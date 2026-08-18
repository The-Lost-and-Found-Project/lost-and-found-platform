"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { johnOneDiscovery } from "@/lib/discoveries/john-1";

type SaveState = "loading" | "saving" | "saved" | "local" | "error";
type Responses = Record<string, string>;

const localKey = "emmaus:john-1-1-eternal-word:progress";

export default function JohnOneDiscovery() {
  const supabase = useMemo(() => createClient(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const hydrated = useRef(false);

  const step = johnOneDiscovery.steps[stepIndex];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = readLocal();
      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;

      const user = authData.user;
      if (!user) {
        setStepIndex(local.stepIndex);
        setResponses(local.responses);
        setSaveState("local");
        hydrated.current = true;
        return;
      }

      setUserId(user.id);
      const { data, error } = await supabase
        .from("emmaus_discovery_progress")
        .select("current_step, responses")
        .eq("user_id", user.id)
        .eq("pack_id", johnOneDiscovery.packId)
        .eq("discovery_id", johnOneDiscovery.discoveryId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setStepIndex(local.stepIndex);
        setResponses(local.responses);
        setSaveState("error");
      } else if (data) {
        setStepIndex(clampStep(data.current_step ?? 0));
        setResponses((data.responses as Responses | null) ?? {});
        setSaveState("saved");
      } else {
        setStepIndex(local.stepIndex);
        setResponses(local.responses);
        setSaveState("saved");
      }
      hydrated.current = true;
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!hydrated.current) return;

    window.localStorage.setItem(localKey, JSON.stringify({ stepIndex, responses }));

    if (!userId || !navigator.onLine) {
      setSaveState("local");
      return;
    }

    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const { error } = await supabase
        .from("emmaus_discovery_progress")
        .upsert(
          {
            user_id: userId,
            pack_id: johnOneDiscovery.packId,
            discovery_id: johnOneDiscovery.discoveryId,
            current_step: stepIndex,
            responses,
            revealed_clues: 0,
            is_completed: stepIndex === johnOneDiscovery.steps.length - 1,
            completed_at:
              stepIndex === johnOneDiscovery.steps.length - 1
                ? new Date().toISOString()
                : null,
          },
          { onConflict: "user_id,pack_id,discovery_id" }
        );

      setSaveState(error ? "error" : "saved");
    }, 650);

    return () => window.clearTimeout(timer);
  }, [responses, stepIndex, supabase, userId]);

  function updateResponse(value: string) {
    setResponses((current) => ({ ...current, [step.id]: value }));
  }

  return (
    <main className="discovery-shell">
      <section className="discovery-card">
        <div className="discovery-head">
          <div>
            <p className="eyebrow">Emmaus Discovery</p>
            <h1>{johnOneDiscovery.title}</h1>
            <p className="lede">{johnOneDiscovery.subtitle}</p>
          </div>
          <div className="save-badge" aria-live="polite">
            {saveLabel(saveState)}
          </div>
        </div>

        <div className="step-row" aria-label="Discovery steps">
          {johnOneDiscovery.steps.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === stepIndex ? "step-button active" : "step-button"}
              onClick={() => setStepIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="study-panel">
          <p className="eyebrow">{step.label}</p>
          <h2>{step.prompt}</h2>

          {step.kind === "read" && (
            <blockquote className="scripture-block">
              <sup>1</sup> {johnOneDiscovery.scripture}
              <footer>{johnOneDiscovery.passage} · {johnOneDiscovery.translation}</footer>
            </blockquote>
          )}

          {step.kind === "response" && (
            <textarea
              aria-label={`${step.label} response`}
              rows={8}
              value={responses[step.id] ?? ""}
              onChange={(event) => updateResponse(event.target.value)}
              placeholder="Write what you discover..."
            />
          )}

          {step.kind === "prayer" && (
            <p className="prayer-text">Pray this slowly, then continue in your own words.</p>
          )}
        </section>

        <div className="discovery-actions">
          <button
            type="button"
            className="secondary-action"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="primary-action"
            disabled={stepIndex === johnOneDiscovery.steps.length - 1}
            onClick={() => setStepIndex((current) => Math.min(johnOneDiscovery.steps.length - 1, current + 1))}
          >
            Continue
          </button>
        </div>
      </section>
    </main>
  );
}

function clampStep(value: number) {
  return Math.min(Math.max(value, 0), johnOneDiscovery.steps.length - 1);
}

function readLocal(): { stepIndex: number; responses: Responses } {
  if (typeof window === "undefined") return { stepIndex: 0, responses: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localKey) ?? "null") as
      | { stepIndex?: number; responses?: Responses }
      | null;
    return {
      stepIndex: clampStep(parsed?.stepIndex ?? 0),
      responses: parsed?.responses ?? {},
    };
  } catch {
    return { stepIndex: 0, responses: {} };
  }
}

function saveLabel(state: SaveState) {
  if (state === "loading") return "Loading…";
  if (state === "saving") return "Saving…";
  if (state === "saved") return "Saved";
  if (state === "local") return "Saved on this device";
  return "Cloud sync failed · saved locally";
}
