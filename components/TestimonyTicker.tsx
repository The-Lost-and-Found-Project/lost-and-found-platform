"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TickerScroll from "./TickerScroll";
import ExpandableText from "./ExpandableText";

type Testimony = {
  id: string;
  faith_story: string;
  updated_at: string;
};

// Poll for newly saved testimonies so the ticker keeps growing over time.
const REFRESH_INTERVAL_MS = 30000;

export default function TestimonyTicker() {
  const supabase = createClient();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("testimonies_public")
        .select("id, faith_story, updated_at")
        .order("updated_at", { ascending: false })
        .limit(30);

      if (active) {
        setTestimonies((data as Testimony[]) ?? []);
        setLoading(false);
      }
    }

    async function loadUserAndSent() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user || !active) return;
      setUserId(user.id);

      const { data: sent } = await supabase
        .from("testimony_encouragements")
        .select("profile_id")
        .eq("from_user_id", user.id);

      if (active) {
        setSentTo(
          new Set((sent as { profile_id: string }[] | null ?? []).map((r) => r.profile_id))
        );
      }
    }

    load();
    loadUserAndSent();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendEncouragement(testimonyId: string) {
    const message = (messages[testimonyId] ?? "").trim();
    if (!message || !userId) return;

    setSending(testimonyId);
    const { error } = await supabase.from("testimony_encouragements").insert({
      profile_id: testimonyId,
      from_user_id: userId,
      message,
    });

    if (!error) {
      setSentTo((prev) => new Set(prev).add(testimonyId));
      setOpenKey(null);
    }
    setSending(null);
  }

  if (loading || testimonies.length === 0) {
    return null;
  }

  // Duplicated so the auto-scroll can loop seamlessly.
  const items = [...testimonies, ...testimonies];

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Testimonies From Our Community
        </h2>
      </div>

      <TickerScroll>
        {items.map((t, i) => {
            const key = `${t.id}-${i}`;
            const alreadySent = sentTo.has(t.id);
            const isSelf = userId === t.id;
            const isOpen = openKey === key;

            return (
              <div key={key} className="rounded-md bg-gray-50 px-4 py-3">
                <ExpandableText
                  text={`“${t.faith_story}”`}
                  className="italic text-gray-700"
                />

                {!isSelf && userId && (
                  <div className="mt-2">
                    {alreadySent ? (
                      <span className="text-xs font-medium text-emerald-600">
                        💛 You sent a note of encouragement
                      </span>
                    ) : isOpen ? (
                      <div className="mt-1 space-y-2">
                        <textarea
                          rows={2}
                          value={messages[t.id] ?? ""}
                          onChange={(e) =>
                            setMessages((prev) => ({
                              ...prev,
                              [t.id]: e.target.value,
                            }))
                          }
                          placeholder="Leave a note of thanks or encouragement..."
                          className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs shadow-sm"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => sendEncouragement(t.id)}
                            disabled={
                              sending === t.id ||
                              !(messages[t.id] ?? "").trim()
                            }
                            className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {sending === t.id ? "Sending..." : "Send"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenKey(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenKey(key)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Leave a note of encouragement
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </TickerScroll>
    </div>
  );
}
