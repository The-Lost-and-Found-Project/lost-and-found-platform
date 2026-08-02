"use client";

import { useEffect, useMemo, useState } from "react";

type ThreadDraft = {
  reference: string;
  text: string;
  question: string;
};

type BuilderDraft = {
  key: string;
  title: string;
  subtitle: string;
  translation: string;
  passage: string;
  observe: string;
  wonder: string;
  reflect: string;
  pray: string;
  threads: ThreadDraft[];
};

const storageKey = "emmaus-discovery-builder-draft";
const initial: BuilderDraft = {
  key: "",
  title: "",
  subtitle: "",
  translation: "KJV · Public domain",
  passage: "1 In the beginning...\n2 The same was...",
  observe: "",
  wonder: "",
  reflect: "",
  pray: "",
  threads: [{ reference: "", text: "", question: "" }],
};

export default function DiscoveryBuilder() {
  const [draft, setDraft] = useState<BuilderDraft>(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setDraft({ ...initial, ...JSON.parse(raw) });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1000);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const verses = useMemo(() => parseVerses(draft.passage), [draft.passage]);
  const validKey = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.key);
  const ready = Boolean(validKey && draft.title.trim() && verses.length && draft.observe.trim() && draft.wonder.trim() && draft.reflect.trim() && draft.pray.trim());

  function update<K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateThread(index: number, patch: Partial<ThreadDraft>) {
    setDraft((current) => ({
      ...current,
      threads: current.threads.map((thread, threadIndex) => threadIndex === index ? { ...thread, ...patch } : thread),
    }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Founder Workspace</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">Discovery Builder</h1>
          </div>
          <span className="text-xs text-gray-500">{saved ? "Draft saved" : "Saved locally"}</span>
        </div>

        <Field label="Discovery key" hint="Lowercase letters, numbers, and hyphens only.">
          <input value={draft.key} onChange={(e) => update("key", slugify(e.target.value))} placeholder="romans-8" className={inputClass} />
          {draft.key && !validKey && <p className="mt-1 text-sm text-red-600">Use a key such as romans-8.</p>}
        </Field>
        <Field label="Title"><input value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="Romans 8:1–17" className={inputClass} /></Field>
        <Field label="Subtitle"><input value={draft.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Life in the Spirit" className={inputClass} /></Field>
        <Field label="Translation"><input value={draft.translation} onChange={(e) => update("translation", e.target.value)} className={inputClass} /></Field>
        <Field label="Passage" hint="Put each verse on its own line and begin with the verse number.">
          <textarea value={draft.passage} onChange={(e) => update("passage", e.target.value)} rows={10} className={inputClass} />
          <p className="mt-2 text-sm text-gray-500">Parsed verses: {verses.length}</p>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Observe prompt"><textarea value={draft.observe} onChange={(e) => update("observe", e.target.value)} rows={4} className={inputClass} /></Field>
          <Field label="Wonder prompt"><textarea value={draft.wonder} onChange={(e) => update("wonder", e.target.value)} rows={4} className={inputClass} /></Field>
          <Field label="Reflect prompt"><textarea value={draft.reflect} onChange={(e) => update("reflect", e.target.value)} rows={4} className={inputClass} /></Field>
          <Field label="Prayer prompt"><textarea value={draft.pray} onChange={(e) => update("pray", e.target.value)} rows={4} className={inputClass} /></Field>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-950">Scripture Threads</h2>
            <button type="button" onClick={() => update("threads", [...draft.threads, { reference: "", text: "", question: "" }])} className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">Add Thread</button>
          </div>
          <div className="mt-4 space-y-4">
            {draft.threads.map((thread, index) => (
              <div key={index} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between"><p className="font-semibold">Thread {index + 1}</p>{draft.threads.length > 1 && <button type="button" onClick={() => update("threads", draft.threads.filter((_, i) => i !== index))} className="text-sm text-red-600">Remove</button>}</div>
                <div className="mt-3 grid gap-3">
                  <input value={thread.reference} onChange={(e) => updateThread(index, { reference: e.target.value })} placeholder="Genesis 1:1" className={inputClass} />
                  <textarea value={thread.text} onChange={(e) => updateThread(index, { text: e.target.value })} placeholder="Connected passage text" rows={3} className={inputClass} />
                  <textarea value={thread.question} onChange={(e) => updateThread(index, { question: e.target.value })} placeholder="Discovery question" rows={3} className={inputClass} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-5">
          <button type="button" disabled={!ready} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Ready for database publishing</button>
          <button type="button" onClick={() => setDraft(initial)} className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700">Clear draft</button>
        </div>
      </section>

      <aside className="self-start rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Live Preview</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-950">{draft.title || "Untitled Discovery"}</h2>
        <p className="mt-2 text-gray-600">{draft.subtitle || "Add a subtitle to frame the journey."}</p>
        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{draft.translation}</p>
          <div className="mt-3 max-h-72 space-y-3 overflow-auto text-sm leading-6 text-gray-800">
            {verses.length ? verses.map(([number, text]) => <p key={number}><sup className="mr-2 font-bold text-indigo-700">{number}</sup>{text}</p>) : <p>No valid verses parsed yet.</p>}
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <PreviewLine label="Observe" value={draft.observe} />
          <PreviewLine label="Wonder" value={draft.wonder} />
          <PreviewLine label="Reflect" value={draft.reflect} />
          <PreviewLine label="Pray" value={draft.pray} />
        </div>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-gray-950">Threads: {draft.threads.filter((thread) => thread.reference.trim()).length}</p>
          <p className="mt-1 text-sm text-gray-600">Publishing will be enabled after the builder is connected to Supabase.</p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><span className="font-semibold text-gray-900">{label}</span>{hint && <span className="ml-2 text-sm text-gray-500">{hint}</span>}<div className="mt-2">{children}</div></label>;
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-gray-200 p-3"><p className="font-semibold text-indigo-700">{label}</p><p className="mt-1 text-gray-600">{value || "Not written yet."}</p></div>;
}

function parseVerses(value: string): Array<[number, string]> {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(/^(\d+)\s*[.:\-]?\s*(.+)$/);
    return match ? [Number(match[1]), match[2].trim()] as [number, string] : null;
  }).filter((verse): verse is [number, string] => verse !== null);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const inputClass = "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
