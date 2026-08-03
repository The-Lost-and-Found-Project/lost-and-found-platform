"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "companion" | "learner";
  message_type: "question" | "response" | "nudge" | "cross_reference" | "context" | "insight";
  content: string;
  created_at: string;
};

type NodeContext = {
  title: string;
  node_type: string;
  scripture_reference: string | null;
  summary: string | null;
};

type StepContext = {
  id: string;
  observation_prompt: string | null;
  connection_prompt: string | null;
  reflection_prompt: string | null;
};

export default function EmmausCompanionPanel({
  sessionId,
  step,
  node,
}: {
  sessionId: string;
  step: StepContext;
  node: NodeContext;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadConversation();
  }, [sessionId, step.id]);

  async function loadConversation() {
    const { data, error } = await supabase
      .from("emmaus_companion_messages")
      .select("id,role,message_type,content,created_at")
      .eq("session_id", sessionId)
      .eq("step_id", step.id)
      .order("created_at");

    if (error) {
      setMessage(error.message);
      return;
    }

    const loaded = (data ?? []) as Message[];
    if (loaded.length) {
      setMessages(loaded);
      return;
    }

    const opening = buildOpeningQuestion(step, node);
    const { data: created, error: createError } = await supabase
      .from("emmaus_companion_messages")
      .insert({
        session_id: sessionId,
        step_id: step.id,
        role: "companion",
        message_type: "question",
        content: opening,
        metadata: { generator: "deterministic-companion-v1" },
      })
      .select("id,role,message_type,content,created_at")
      .single();

    if (createError) {
      setMessage(createError.message);
      return;
    }

    setMessages([created as Message]);
  }

  async function sendLearnerMessage() {
    const content = draft.trim();
    if (!content) return;
    setWorking(true);
    setDraft("");

    const { data: learnerMessage, error } = await supabase
      .from("emmaus_companion_messages")
      .insert({
        session_id: sessionId,
        step_id: step.id,
        role: "learner",
        message_type: "response",
        content,
      })
      .select("id,role,message_type,content,created_at")
      .single();

    if (error) {
      setMessage(error.message);
      setWorking(false);
      return;
    }

    const nextQuestion = buildFollowUpQuestion(content, messages.length, step, node);
    const { data: companionMessage, error: companionError } = await supabase
      .from("emmaus_companion_messages")
      .insert({
        session_id: sessionId,
        step_id: step.id,
        role: "companion",
        message_type: "question",
        content: nextQuestion,
        metadata: { generator: "deterministic-companion-v1" },
      })
      .select("id,role,message_type,content,created_at")
      .single();

    if (companionError) {
      setMessage(companionError.message);
      setMessages((current) => [...current, learnerMessage as Message]);
      setWorking(false);
      return;
    }

    setMessages((current) => [...current, learnerMessage as Message, companionMessage as Message]);
    setWorking(false);
  }

  async function requestHelp(type: "nudge" | "cross_reference" | "context" | "insight") {
    setWorking(true);
    const content = buildHelpMessage(type, step, node, messages);
    const { data, error } = await supabase
      .from("emmaus_companion_messages")
      .insert({
        session_id: sessionId,
        step_id: step.id,
        role: "companion",
        message_type: type,
        content,
        metadata: { generator: "deterministic-companion-v1" },
      })
      .select("id,role,message_type,content,created_at")
      .single();

    if (error) setMessage(error.message);
    else setMessages((current) => [...current, data as Message]);
    setWorking(false);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-indigo-200 bg-white shadow-xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-5 text-left text-white"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Study Companion</p>
          <h2 className="mt-1 text-2xl font-black">Discover before you reveal.</h2>
        </div>
        <span className="text-2xl" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="p-5 sm:p-6">
          <div className="max-h-[420px] space-y-4 overflow-auto rounded-2xl bg-slate-50 p-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[88%] rounded-2xl px-4 py-3 ${item.role === "learner" ? "ml-auto bg-indigo-600 text-white" : "bg-white text-slate-800 shadow-sm"}`}
              >
                <p className="text-[10px] font-black uppercase tracking-wide opacity-60">
                  {item.role === "learner" ? "You" : labelForType(item.message_type)}
                </p>
                <p className="mt-1 leading-7">{item.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={working} onClick={() => void requestHelp("nudge")} className={helpButton}>Give me a nudge</button>
            <button type="button" disabled={working} onClick={() => void requestHelp("cross_reference")} className={helpButton}>Cross-reference</button>
            <button type="button" disabled={working} onClick={() => void requestHelp("context")} className={helpButton}>Context</button>
            <button type="button" disabled={working || messages.filter((item) => item.role === "learner").length < 1} onClick={() => void requestHelp("insight")} className={helpButton}>Reveal insight</button>
          </div>

          <div className="mt-4 flex gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Share what you notice or ask for another question..."
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <button type="button" disabled={working || !draft.trim()} onClick={() => void sendLearnerMessage()} className="self-end rounded-2xl bg-indigo-600 px-5 py-3 font-black text-white disabled:opacity-50">
              Send
            </button>
          </div>
          <p className="mt-3 min-h-5 text-xs font-bold text-slate-500" aria-live="polite">{message}</p>
        </div>
      )}
    </section>
  );
}

function buildOpeningQuestion(step: StepContext, node: NodeContext) {
  return step.observation_prompt ?? `Before looking for an explanation, what stands out to you about ${node.title}${node.scripture_reference ? ` in ${node.scripture_reference}` : ""}?`;
}

function buildFollowUpQuestion(response: string, messageCount: number, step: StepContext, node: NodeContext) {
  const lower = response.toLowerCase();
  if (messageCount < 3) return `What in the text or context led you to that observation?`;
  if (lower.includes("god") || lower.includes("jesus") || lower.includes("lord")) return `What does that observation suggest about God's character or actions?`;
  if (step.connection_prompt) return step.connection_prompt;
  if (step.reflection_prompt) return step.reflection_prompt;
  return `How might ${node.title} connect to another passage, promise, person, or event you already know?`;
}

function buildHelpMessage(type: "nudge" | "cross_reference" | "context" | "insight", step: StepContext, node: NodeContext, messages: Message[]) {
  if (type === "nudge") return `Look again at the key nouns, verbs, repeated ideas, and contrasts connected to ${node.title}. Which one seems most important, and why?`;
  if (type === "cross_reference") return node.scripture_reference
    ? `Use the wording and major theme of ${node.scripture_reference} to search for another passage that repeats or develops the same idea. What connection do you notice before reading an explanation?`
    : `Search for another passage connected to the central theme of ${node.title}. Compare what remains the same and what develops.`;
  if (type === "context") return node.summary
    ? `Context clue: ${node.summary} Now reread the prompt and identify which detail changes or strengthens your first observation.`
    : `Context clue: identify the speaker, audience, setting, and what happens immediately before and after this passage or concept.`;
  const learnerResponses = messages.filter((message) => message.role === "learner").map((message) => message.content);
  return `Possible insight: ${node.title} should be understood by combining the wording of the passage, its immediate context, and its relationship to the larger story of Scripture. Compare that possibility with your own observations: ${learnerResponses.slice(-2).join(" | ") || "What evidence supports or challenges it?"}`;
}

function labelForType(type: Message["message_type"]) {
  if (type === "nudge") return "Nudge";
  if (type === "cross_reference") return "Cross-reference";
  if (type === "context") return "Context";
  if (type === "insight") return "Insight";
  return "Emmaus Companion";
}

const helpButton = "rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 disabled:opacity-40";
