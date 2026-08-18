"use client";

import { useMemo, useState } from "react";
import type { ScriptureChapter, ScriptureVerse } from "@/lib/scripture/types";

type Props = {
  chapter: ScriptureChapter;
};

const tabs = ["Verse", "Compare", "Original Language", "Cross References", "Notes", "Study"] as const;
type Tab = (typeof tabs)[number];

export default function BibleReader({ chapter }: Props) {
  const [selectedVerse, setSelectedVerse] = useState<ScriptureVerse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Verse");

  const context = useMemo(() => {
    if (!selectedVerse) return [];
    const index = chapter.verses.findIndex((verse) => verse.canonicalKey === selectedVerse.canonicalKey);
    return chapter.verses.slice(Math.max(0, index - 1), Math.min(chapter.verses.length, index + 2));
  }, [chapter.verses, selectedVerse]);

  function openVerse(verse: ScriptureVerse) {
    setSelectedVerse(verse);
    setActiveTab("Verse");
  }

  return (
    <>
      <section className="scripture-reader" aria-label={`${chapter.book} ${chapter.chapter}`}>
        {chapter.verses.map((verse) => (
          <button
            key={verse.canonicalKey}
            id={verse.canonicalKey}
            type="button"
            className="scripture-verse-button"
            onClick={() => openVerse(verse)}
            aria-label={`Study ${verse.reference}`}
          >
            <sup>{verse.number}</sup>
            <span>{verse.text}</span>
          </button>
        ))}
      </section>

      {selectedVerse && (
        <div className="verse-panel-backdrop" role="presentation" onMouseDown={() => setSelectedVerse(null)}>
          <aside
            className="verse-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verse-panel-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="verse-panel-head">
              <div>
                <p className="eyebrow">Verse Study</p>
                <h2 id="verse-panel-title">{selectedVerse.reference}</h2>
              </div>
              <button type="button" className="panel-close" onClick={() => setSelectedVerse(null)} aria-label="Close verse study panel">
                ×
              </button>
            </div>

            <div className="verse-tabs" role="tablist" aria-label="Verse study sections">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? "verse-tab active" : "verse-tab"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="verse-panel-body">
              {activeTab === "Verse" ? (
                <>
                  <blockquote className="selected-verse">
                    <sup>{selectedVerse.number}</sup> {selectedVerse.text}
                  </blockquote>
                  <section className="context-card">
                    <p className="eyebrow">Nearby context</p>
                    {context.map((verse) => (
                      <p key={verse.canonicalKey} className={verse.canonicalKey === selectedVerse.canonicalKey ? "context-verse current" : "context-verse"}>
                        <sup>{verse.number}</sup> {verse.text}
                      </p>
                    ))}
                  </section>
                  <p className="dig-deeper-note">Dig deeper when you are ready. The advanced study sections are intentionally present but not yet connected to unreviewed providers.</p>
                </>
              ) : (
                <section className="coming-study-tool">
                  <p className="eyebrow">{activeTab}</p>
                  <h3>Provider not connected yet</h3>
                  <p>This section is reserved in the Emmaus study architecture. It will only be enabled after its source, licensing, attribution, and theological guardrails are reviewed.</p>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
