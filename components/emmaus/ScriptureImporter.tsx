"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TranslationCode = "KJV" | "WEB";
type ParsedVerse = { verse: number; text: string; referenceKey: string; label: string };

const translations: Record<TranslationCode, { label: string; note: string }> = {
  KJV: { label: "King James Version", note: "Public domain in the United States." },
  WEB: { label: "World English Bible", note: "Public domain modern-English translation." },
};

export default function ScriptureImporter() {
  const supabase = useMemo(() => createClient(), []);
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState<TranslationCode>("KJV");
  const [passage, setPassage] = useState("1 In the beginning was the Word...\n2 The same was in the beginning with God.");
  const [status, setStatus] = useState("Paste a public-domain passage to begin.");
  const [importing, setImporting] = useState(false);

  const verses = useMemo(() => parseVerses(book, chapter, passage), [book, chapter, passage]);

  async function importNodes() {
    if (!book.trim() || chapter < 1 || !verses.length) return;
    setImporting(true);
    setStatus("Checking existing Scripture nodes...");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setStatus("You must be signed in.");
      setImporting(false);
      return;
    }

    const keys = verses.map((verse) => verse.referenceKey);
    const { data: existing, error: lookupError } = await supabase
      .from("emmaus_scripture_nodes")
      .select("reference_key")
      .in("reference_key", keys);

    if (lookupError) {
      setStatus(lookupError.message);
      setImporting(false);
      return;
    }

    const existingKeys = new Set((existing ?? []).map((row) => row.reference_key));
    const missing = verses.filter((verse) => !existingKeys.has(verse.referenceKey));

    if (!missing.length) {
      setStatus(`All ${verses.length} verse nodes already exist.`);
      setImporting(false);
      return;
    }

    const payload = missing.map((verse) => ({
      reference_key: verse.referenceKey,
      book: book.trim(),
      chapter,
      verse_start: verse.verse,
      verse_end: null,
      reference_label: verse.label,
      text_content: verse.text,
      translation,
      summary: "",
      status: "draft",
      created_by: user.id,
    }));

    const { error: insertError } = await supabase.from("emmaus_scripture_nodes").insert(payload);
    if (insertError) {
      setStatus(insertError.message);
      setImporting(false);
      return;
    }

    setStatus(`Imported ${missing.length} new verse node${missing.length === 1 ? "" : "s"}; ${existingKeys.size} already existed.`);
    setImporting(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Emmaus Founder Tool</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">Scripture Graph Importer</h1>
        <p className="mt-2 leading-7 text-gray-600">Create canonical verse nodes from verified public-domain Bible text.</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Field label="Book"><input value={book} onChange={(event) => setBook(event.target.value)} className={inputClass} /></Field>
          <Field label="Chapter"><input type="number" min={1} value={chapter} onChange={(event) => setChapter(Math.max(1, Number(event.target.value)))} className={inputClass} /></Field>
        </div>

        <Field label="Translation">
          <select value={translation} onChange={(event) => setTranslation(event.target.value as TranslationCode)} className={inputClass}>
            {Object.entries(translations).map(([code, item]) => <option key={code} value={code}>{code} — {item.label}</option>)}
          </select>
          <p className="mt-2 text-sm text-gray-500">{translations[translation].note}</p>
        </Field>

        <Field label="Passage text" hint="Use one verse per line, beginning with the verse number.">
          <textarea value={passage} onChange={(event) => setPassage(event.target.value)} rows={14} className={inputClass} />
        </Field>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={importNodes} disabled={importing || !verses.length} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            {importing ? "Importing..." : "Import missing nodes"}
          </button>
          <span className="text-sm text-gray-600">{status}</span>
        </div>
      </section>

      <aside className="self-start rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Import Preview</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">{book || "Book"} {chapter}</h2>
          </div>
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{translation}</span>
        </div>

        <div className="mt-5 max-h-[34rem] space-y-3 overflow-auto pr-1">
          {verses.length ? verses.map((verse) => (
            <article key={verse.referenceKey} className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-gray-950">{verse.label}</p>
                <code className="text-xs text-gray-400">{verse.referenceKey}</code>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">{verse.text}</p>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">No valid verses parsed.</div>}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-gray-700">
          This importer stores the exact text you provide. It does not yet fetch Bible text automatically from an external translation service.
        </div>
      </aside>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="mt-5 block"><span className="font-semibold text-gray-900">{label}</span>{hint && <span className="ml-2 text-sm text-gray-500">{hint}</span>}<div className="mt-2">{children}</div></label>;
}

function parseVerses(book: string, chapter: number, value: string): ParsedVerse[] {
  const normalizedBook = book.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalizedBook || chapter < 1) return [];

  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = line.match(/^(\d+)\s*[.:\-]?\s*(.+)$/);
    if (!match) return null;
    const verse = Number(match[1]);
    const text = match[2].trim();
    return {
      verse,
      text,
      referenceKey: `${normalizedBook}-${chapter}-${verse}`,
      label: `${book.trim()} ${chapter}:${verse}`,
    };
  }).filter((verse): verse is ParsedVerse => verse !== null);
}

const inputClass = "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
