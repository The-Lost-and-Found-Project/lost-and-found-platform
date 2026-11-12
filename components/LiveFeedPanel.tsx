"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type LivePost = {
  id: string;
  post_type: string;
  title: string;
  body: string;
  scripture_reference?: string | null;
  choices?: string[];
  is_pinned?: boolean;
  created_at: string;
  responseCount: number;
  choiceCounts: Record<string, number>;
  myResponse?: { choice?: string | null; responseText?: string | null } | null;
  responses?: Array<{ user_id: string; choice?: string | null; response_text?: string | null }>;
};

const labels: Record<string, string> = {
  announcement: "Announcement",
  question: "Question",
  poll: "Live Poll",
  prayer: "Prayer Prompt",
  scripture: "Scripture",
  resource: "Resource",
};

export default function LiveFeedPanel({ sessionId, facilitator }: { sessionId: string; facilitator: boolean }) {
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [postType, setPostType] = useState("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scriptureReference, setScriptureReference] = useState("");
  const [choices, setChoices] = useState("");
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/live/session/${sessionId}/feed`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to load the live feed.");
      setPosts(Array.isArray(result.posts) ? result.posts : []);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the live feed.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/live/session/${sessionId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postType,
          title,
          body,
          scriptureReference,
          choices: choices.split("\n").map((item) => item.trim()).filter(Boolean),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to publish.");
      setTitle("");
      setBody("");
      setScriptureReference("");
      setChoices("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish.");
    } finally {
      setBusy(false);
    }
  }

  async function respond(post: LivePost, value: string, isChoice = false) {
    if (busy || post.myResponse) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/live/session/${sessionId}/feed/${post.id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isChoice ? { choice: value } : { responseText: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to save your response.");
      setResponseDrafts((current) => ({ ...current, [post.id]: "" }));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your response.");
    } finally {
      setBusy(false);
    }
  }

  const activePosts = useMemo(() => posts.filter((post) => post.post_type !== "resource" || post.body), [posts]);

  return (
    <aside className="rounded-2xl border border-[#c8a96b]/25 bg-[#0c1b2c] p-4 text-white xl:sticky xl:top-3 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#d9bd7d]">Interactive room</p>
          <h3 className="mt-1 font-serif text-xl font-bold">Live Feed</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">Post and respond without leaving the study.</p>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase">{posts.length} posts</span>
      </div>

      {facilitator && (
        <form onSubmit={publish} className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Post now</p>
          <select value={postType} onChange={(event) => setPostType(event.target.value)} className="w-full rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white">
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" required maxLength={160} className="w-full rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What should the room see?" rows={3} maxLength={12000} className="w-full rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          {(postType === "scripture" || postType === "prayer") && <input value={scriptureReference} onChange={(event) => setScriptureReference(event.target.value)} placeholder="Scripture reference (optional)" maxLength={240} className="w-full rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white placeholder:text-slate-500" />}
          {postType === "poll" && <textarea value={choices} onChange={(event) => setChoices(event.target.value)} placeholder="One choice per line" rows={3} className="w-full rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white placeholder:text-slate-500" />}
          <button disabled={busy} className="w-full rounded-lg bg-[#d9bd7d] px-3 py-2 text-sm font-black text-[#142033] disabled:opacity-50">{busy ? "Saving..." : "Publish to room"}</button>
        </form>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-100">{error}</p>}
      {loading && <p className="mt-4 text-sm text-slate-400">Loading the live feed...</p>}
      {!loading && !activePosts.length && <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-400">Nothing has been posted yet.</p>}

      <div className="mt-4 space-y-3">
        {activePosts.map((post) => (
          <article key={post.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d9bd7d]">{labels[post.post_type] || post.post_type}</span>
              {post.is_pinned && <span className="text-[10px] font-black uppercase text-amber-200">Pinned</span>}
            </div>
            <h4 className="mt-1 font-black">{post.title}</h4>
            {post.scripture_reference && <p className="mt-1 text-xs font-bold text-[#d9bd7d]">{post.scripture_reference}</p>}
            {post.body && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">{post.body}</p>}

            {post.post_type === "poll" && Array.isArray(post.choices) && (
              <div className="mt-3 space-y-2">
                {post.choices.map((choice) => {
                  const count = post.choiceCounts?.[choice] || 0;
                  return <button key={choice} disabled={busy || Boolean(post.myResponse)} onClick={() => void respond(post, choice, true)} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-[#122238] px-3 py-2 text-left text-sm hover:border-[#d9bd7d] disabled:opacity-60"><span>{choice}</span><span className="text-xs text-slate-400">{count}</span></button>;
                })}
              </div>
            )}

            {post.post_type !== "poll" && post.post_type !== "announcement" && !post.myResponse && (
              <div className="mt-3 flex gap-2">
                <input value={responseDrafts[post.id] || ""} onChange={(event) => setResponseDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Your response" maxLength={4000} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#122238] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                <button disabled={busy || !responseDrafts[post.id]?.trim()} onClick={() => void respond(post, responseDrafts[post.id], false)} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-black disabled:opacity-40">Send</button>
              </div>
            )}

            {post.myResponse && <p className="mt-2 text-xs font-bold text-emerald-200">Response recorded.</p>}
            {facilitator && <p className="mt-2 text-[10px] text-slate-400">{post.responseCount} response{post.responseCount === 1 ? "" : "s"}</p>}
          </article>
        ))}
      </div>
    </aside>
  );
}
