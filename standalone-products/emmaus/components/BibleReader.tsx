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
  const loadToken = useRef(0);

  const context = useMemo(() => {
    if (!selectedVerse) return [];
    const index = chapter.verses.findIndex((verse) => verse.canonicalKey === selectedVerse.canonicalKey);
    return chapter.verses.slice(Math.max(0, index - 1), Math.min(chapter.verses.length, index + 2));
  }, [chapter.verses, selectedVerse]);

  function localKey(verse: ScriptureVerse) {
    return `emmaus:verse-note:${chapter.translation}:${verse.canonicalKey}`;
  }

  function openVerse(verse: ScriptureVerse) {
    setSelectedVerse(verse);
    setActiveTab("Verse");
    setNote("");
    setSaveState("idle");
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
      if (!user || token !== loadToken.current) {
        if (token === loadToken.current) setSaveState("local");
        return;
      }
      const { data, error } = await supabase
        .from("emmaus_verse_notes")
        .select("note_text")
        .eq("user_id", user.id)
        .eq("canonical_key", selectedVerse.canonicalKey)
        .eq("translation", chapter.translation)
        .maybeSingle();
      if (token !== loadToken.current) return;
      if (error) {
        setSaveState("local");
        return;
      }
      if (data?.note_text != null) {
        setNote(data.note_text);
        window.localStorage.setItem(localKey(selectedVerse), data.note_text);
      }
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
        const { error } = await supabase.from("emmaus_verse_notes").upsert({
          user_id: user.id,
          canonical_key: selectedVerse.canonicalKey,
          reference_label: selectedVerse.reference,
          translation: chapter.translation,
          note_text: note,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,canonical_key,translation" });
        setSaveState(error ? "error" : "saved");
      })();
    }, 700);
    return () => window.clearTimeout(timer);
  }, [note, activeTab, chapter.translation, selectedVerse]);

  return (
    <>
      <section className="scripture-reader" aria-label={`${chapter.book} ${chapter.chapter}`}>
        {chapter.verses.map((verse) => (
          <button key={verse.canonicalKey} id={verse.canonicalKey} type="button" className="scripture-verse-button" onClick={() => openVerse(verse)} aria-label={`Study ${verse.reference}`}>
            <sup>{verse.number}</sup><span>{verse.text}</span>
          </button>
        ))}
      </section>

      {selectedVerse && (
        <div className="verse-panel-backdrop" role="presentation" onMouseDown={() => setSelectedVerse(null)}>
          <aside className="verse-panel" role="dialog" aria-modal="true" aria-labelledby="verse-panel-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="verse-panel-head">
              <div><p className="eyebrow">Verse Study</p><h2 id="verse-panel-title">{selectedVerse.reference}</h2></div>
              <button type="button" className="panel-close" onClick={() => setSelectedVerse(null)} aria-label="Close verse study panel">×</button>
            </div>
            <div className="verse-tabs" role="tablist" aria-label="Verse study sections">
              {tabs.map((tab) => (
                <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "verse-tab active" : "verse-tab"} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>
            <div className="verse-panel-body">
              {activeTab === "Verse" && (
                <>
                  <blockquote className="selected-verse"><sup>{selectedVerse.number}</sup> {selectedVerse.text}</blockquote>
                  <section className="context-card"><p className="eyebrow">Nearby context</p>{context.map((verse) => <p key={verse.canonicalKey} className={verse.canonicalKey === selectedVerse.canonicalKey ? "context-verse current" : "context-verse"}><sup>{verse.number}</sup> {verse.text}</p>)}</section>
                  <p className="dig-deeper-note">Dig deeper when you are ready. Advanced sections remain behind reviewed providers.</p>
                </>
              )}
              {activeTab === "Notes" && (
                <section className="verse-notes">
                  <div className="notes-head"><div><p className="eyebrow">Personal Notes</p><h3>{selectedVerse.reference}</h3></div><span className="save-badge">{saveState === "loading" ? "Loading…" : saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Saved locally · sync failed" : saveState === "local" ? "Saved locally" : "Ready"}</span></div>
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={10} placeholder="What are you noticing? What questions do you have? What do you want to remember about this verse?" aria-label={`Notes for ${selectedVerse.reference}`} />
                  <p className="notes-help">Notes save automatically. A local copy is kept on this device while Emmaus syncs the note to your private account.</p>
                </section>
              )}
              {activeTab !== "Verse" && activeTab !== "Notes" && (
                <section className="coming-study-tool"><p className="eyebrow">{activeTab}</p><h3>Provider not connected yet</h3><p>This section will only be enabled after its source, licensing, attribution, and theological guardrails are reviewed.</p></section>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
