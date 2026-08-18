"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ScriptureChapter, ScriptureVerse } from "@/lib/scripture/types";
import { createClient } from "@/lib/supabase/client";

type Props = { chapter: ScriptureChapter };
const tabs = ["Verse", "Compare", "Original Language", "Cross References", "Notes", "Study"] as const;
type Tab = (typeof tabs)[number];
type SaveState = "idle" | "loading" | "saving" | "saved" | "local" | "error";

export default function BibleReader({ chapter }: Props) {
  const [selectedVerse, setSelectedVerse] = useState<ScriptureVerse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Verse");
  const [note, setNote] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<Set<string>>(new Set());
  const loadToken = useRef(0);

  const context = useMemo(() => {
    if (!selectedVerse) return [];
    const index = chapter.verses.findIndex((verse) => verse.canonicalKey === selectedVerse.canonicalKey);
    return chapter.verses.slice(Math.max(0, index - 1), Math.min(chapter.verses.length, index + 2));
  }, [chapter.verses, selectedVerse]);

  function localKey(verse: ScriptureVerse) {
    return `emmaus:verse-note:${chapter.translation}:${verse.canonicalKey}`;
  }

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const keys = chapter.verses.map((verse) => verse.canonicalKey);
      const [{ data: bookmarkRows }, { data: highlightRows }] = await Promise.all([
        supabase.from("emmaus_verse_bookmarks").select("canonical_key").eq("user_id", user.id).eq("translation", chapter.translation).in("canonical_key", keys),
        supabase.from("emmaus_verse_highlights").select("canonical_key").eq("user_id", user.id).eq("translation", chapter.translation).in("canonical_key", keys),
      ]);
      setBookmarks(new Set((bookmarkRows ?? []).map((row) => row.canonical_key)));
      setHighlights(new Set((highlightRows ?? []).map((row) => row.canonical_key)));
    })();
  }, [chapter.translation, chapter.verses]);

  function openVerse(verse: ScriptureVerse) {
    setSelectedVerse(verse);
    setActiveTab("Verse");
    setNote("");
    setSaveState("idle");
  }

  async function toggleBookmark(verse: ScriptureVerse) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const active = bookmarks.has(verse.canonicalKey);
    if (active) {
      await supabase.from("emmaus_verse_bookmarks").delete().eq("user_id", user.id).eq("canonical_key", verse.canonicalKey).eq("translation", chapter.translation);
      setBookmarks((current) => { const next = new Set(current); next.delete(verse.canonicalKey); return next; });
    } else {
      await supabase.from("emmaus_verse_bookmarks").upsert({ user_id: user.id, canonical_key: verse.canonicalKey, reference_label: verse.reference, translation: chapter.translation }, { onConflict: "user_id,canonical_key,translation" });
      setBookmarks((current) => new Set(current).add(verse.canonicalKey));
    }
  }

  async function toggleHighlight(verse: ScriptureVerse) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const active = highlights.has(verse.canonicalKey);
    if (active) {
      await supabase.from("emmaus_verse_highlights").delete().eq("user_id", user.id).eq("canonical_key", verse.canonicalKey).eq("translation", chapter.translation);
      setHighlights((current) => { const next = new Set(current); next.delete(verse.canonicalKey); return next; });
    } else {
      await supabase.from("emmaus_verse_highlights").upsert({ user_id: user.id, canonical_key: verse.canonicalKey, reference_label: verse.reference, translation: chapter.translation, highlight_style: "default", updated_at: new Date().toISOString() }, { onConflict: "user_id,canonical_key,translation" });
      setHighlights((current) => new Set(current).add(verse.canonicalKey));
    }
  }

  useEffect(() => {
    if (!selectedVerse || activeTab !== "Notes") return;
    const token = ++loadToken.current;
    const fallback = window.localStorage.getItem(localKey(selectedVerse)) ?? "";
    setNote(fallback);
    setSaveState("loading");
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || token !== loadToken.current) { if (token === loadToken.current) setSaveState("local"); return; }
      const { data, error } = await supabase.from("emmaus_verse_notes").select("note_text").eq("user_id", user.id).eq("canonical_key", selectedVerse.canonicalKey).eq("translation", chapter.translation).maybeSingle();
      if (token !== loadToken.current) return;
      if (error) { setSaveState("local"); return; }
      if (data?.note_text != null) { setNote(data.note_text); window.localStorage.setItem(localKey(selectedVerse), data.note_text); }
      setSaveState("saved");
    })();
  }, [activeTab, chapter.translation, selectedVerse]);

  useEffect(() => {
    if (!selectedVerse || activeTab !== "Notes" || saveState === "loading") return;
    window.localStorage.setItem(localKey(selectedVerse), note);
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void (async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSaveState("local"); return; }
        const { error } = await supabase.from("emmaus_verse_notes").upsert({ user_id: user.id, canonical_key: selectedVerse.canonicalKey, reference_label: selectedVerse.reference, translation: chapter.translation, note_text: note, updated_at: new Date().toISOString() }, { onConflict: "user_id,canonical_key,translation" });
        setSaveState(error ? "error" : "saved");
      })();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [note, activeTab, chapter.translation, selectedVerse]);

  return (
    <>
      <section className="scripture-reader" aria-label={`${chapter.book} ${chapter.chapter}`}>
        {chapter.verses.map((verse) => {
          const isHighlighted = highlights.has(verse.canonicalKey);
          const isBookmarked = bookmarks.has(verse.canonicalKey);
          return (
            <button key={verse.canonicalKey} id={verse.canonicalKey} type="button" className={`scripture-verse-button${isHighlighted ? " highlighted" : ""}`} onClick={() => openVerse(verse)} aria-label={`Study ${verse.reference}`}>
              <sup>{verse.number}</sup><span>{verse.text}</span>{isBookmarked && <span className="verse-bookmark-indicator" aria-label="Bookmarked">★</span>}
            </button>
          );
        })}
      </section>

      {selectedVerse && (
        <div className="verse-panel-backdrop" role="presentation" onMouseDown={() => setSelectedVerse(null)}>
          <aside className="verse-panel" role="dialog" aria-modal="true" aria-labelledby="verse-panel-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="verse-panel-head">
              <div><p className="eyebrow">Verse Study</p><h2 id="verse-panel-title">{selectedVerse.reference}</h2></div>
              <button type="button" className="panel-close" onClick={() => setSelectedVerse(null)} aria-label="Close verse study panel">×</button>
            </div>
            <div className="verse-quick-actions">
              <button type="button" className={bookmarks.has(selectedVerse.canonicalKey) ? "quick-action active" : "quick-action"} onClick={() => void toggleBookmark(selectedVerse)}>{bookmarks.has(selectedVerse.canonicalKey) ? "★ Bookmarked" : "☆ Bookmark"}</button>
              <button type="button" className={highlights.has(selectedVerse.canonicalKey) ? "quick-action active" : "quick-action"} onClick={() => void toggleHighlight(selectedVerse)}>{highlights.has(selectedVerse.canonicalKey) ? "✓ Highlighted" : "Highlight"}</button>
            </div>
            <div className="verse-tabs" role="tablist" aria-label="Verse study sections">
              {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "verse-tab active" : "verse-tab"} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>
            <div className="verse-panel-body">
              {activeTab === "Verse" && <><blockquote className="selected-verse"><sup>{selectedVerse.number}</sup> {selectedVerse.text}</blockquote><section className="context-card"><p className="eyebrow">Nearby context</p>{context.map((verse) => <p key={verse.canonicalKey} className={verse.canonicalKey === selectedVerse.canonicalKey ? "context-verse current" : "context-verse"}><sup>{verse.number}</sup> {verse.text}</p>)}</section><p className="dig-deeper-note">Dig deeper when you are ready. Advanced sections remain behind reviewed providers.</p></>}
              {activeTab === "Notes" && <section className="verse-notes"><div className="notes-head"><div><p className="eyebrow">Personal Notes</p><h3>{selectedVerse.reference}</h3></div><span className="save-badge">{saveState === "loading" ? "Loading…" : saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Saved locally · sync failed" : saveState === "local" ? "Saved locally" : "Ready"}</span></div><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={10} placeholder="What are you noticing? What questions do you have? What do you want to remember about this verse?" aria-label={`Notes for ${selectedVerse.reference}`} /><p className="notes-help">Notes save automatically. A local copy is kept on this device while Emmaus syncs the note to your private account.</p></section>}
              {activeTab !== "Verse" && activeTab !== "Notes" && <section className="coming-study-tool"><p className="eyebrow">{activeTab}</p><h3>Provider not connected yet</h3><p>This section will only be enabled after its source, licensing, attribution, and theological guardrails are reviewed.</p></section>}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
