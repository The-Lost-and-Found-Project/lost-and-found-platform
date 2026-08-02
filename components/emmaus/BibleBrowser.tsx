"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Testament = "Old Testament" | "New Testament";
type BibleBook = { name: string; chapters: number; testament: Testament };
type Translation = "KJV" | "WEB";
type Verse = { number: number; text: string; canonicalKey: string; reference: string };
type ChapterResponse = {
  translation: Translation;
  translationName: string;
  book: string;
  chapter: number;
  verses: Verse[];
  source: string;
  licenseUrl?: string;
};

const books: BibleBook[] = [
  ["Genesis",50,"Old Testament"],["Exodus",40,"Old Testament"],["Leviticus",27,"Old Testament"],["Numbers",36,"Old Testament"],["Deuteronomy",34,"Old Testament"],["Joshua",24,"Old Testament"],["Judges",21,"Old Testament"],["Ruth",4,"Old Testament"],["1 Samuel",31,"Old Testament"],["2 Samuel",24,"Old Testament"],["1 Kings",22,"Old Testament"],["2 Kings",25,"Old Testament"],["1 Chronicles",29,"Old Testament"],["2 Chronicles",36,"Old Testament"],["Ezra",10,"Old Testament"],["Nehemiah",13,"Old Testament"],["Esther",10,"Old Testament"],["Job",42,"Old Testament"],["Psalms",150,"Old Testament"],["Proverbs",31,"Old Testament"],["Ecclesiastes",12,"Old Testament"],["Song of Solomon",8,"Old Testament"],["Isaiah",66,"Old Testament"],["Jeremiah",52,"Old Testament"],["Lamentations",5,"Old Testament"],["Ezekiel",48,"Old Testament"],["Daniel",12,"Old Testament"],["Hosea",14,"Old Testament"],["Joel",3,"Old Testament"],["Amos",9,"Old Testament"],["Obadiah",1,"Old Testament"],["Jonah",4,"Old Testament"],["Micah",7,"Old Testament"],["Nahum",3,"Old Testament"],["Habakkuk",3,"Old Testament"],["Zephaniah",3,"Old Testament"],["Haggai",2,"Old Testament"],["Zechariah",14,"Old Testament"],["Malachi",4,"Old Testament"],["Matthew",28,"New Testament"],["Mark",16,"New Testament"],["Luke",24,"New Testament"],["John",21,"New Testament"],["Acts",28,"New Testament"],["Romans",16,"New Testament"],["1 Corinthians",16,"New Testament"],["2 Corinthians",13,"New Testament"],["Galatians",6,"New Testament"],["Ephesians",6,"New Testament"],["Philippians",4,"New Testament"],["Colossians",4,"New Testament"],["1 Thessalonians",5,"New Testament"],["2 Thessalonians",3,"New Testament"],["1 Timothy",6,"New Testament"],["2 Timothy",4,"New Testament"],["Titus",3,"New Testament"],["Philemon",1,"New Testament"],["Hebrews",13,"New Testament"],["James",5,"New Testament"],["1 Peter",5,"New Testament"],["2 Peter",3,"New Testament"],["1 John",5,"New Testament"],["2 John",1,"New Testament"],["3 John",1,"New Testament"],["Jude",1,"New Testament"],["Revelation",22,"New Testament"],
].map(([name, chapters, testament]) => ({ name: name as string, chapters: chapters as number, testament: testament as Testament }));

export default function BibleBrowser() {
  const [translation, setTranslation] = useState<Translation>("KJV");
  const [testament, setTestament] = useState<Testament>("New Testament");
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<BibleBook>(books[42]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapterData, setChapterData] = useState<ChapterResponse | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return books.filter((book) => book.testament === testament && (!needle || book.name.toLowerCase().includes(needle)));
  }, [query, testament]);

  const selectedVerses = useMemo(
    () => chapterData?.verses.filter((verse) => selectedKeys.has(verse.canonicalKey)) ?? [],
    [chapterData, selectedKeys]
  );

  useEffect(() => {
    const controller = new AbortController();
    setSelectedKeys(new Set());

    async function loadChapter() {
      setLoading(true);
      setError("");
      setChapterData(null);
      try {
        const params = new URLSearchParams({ translation, book: selectedBook.name, chapter: String(selectedChapter) });
        const response = await fetch(`/api/emmaus/bible/chapter?${params.toString()}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load Bible text.");
        setChapterData(payload as ChapterResponse);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load Bible text.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadChapter();
    return () => controller.abort();
  }, [translation, selectedBook, selectedChapter]);

  function chooseBook(book: BibleBook) {
    setSelectedBook(book);
    setSelectedChapter(1);
  }

  function toggleVerse(key: string) {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function createDiscovery() {
    if (!selectedVerses.length || !chapterData) return;
    const first = selectedVerses[0].number;
    const last = selectedVerses[selectedVerses.length - 1].number;
    const range = first === last ? String(first) : `${first}-${last}`;
    const draft = {
      key: `${slugify(chapterData.book)}-${chapterData.chapter}-${range}`,
      title: `${chapterData.book} ${chapterData.chapter}:${range}`,
      subtitle: "",
      translation: `${chapterData.translation} · ${chapterData.translationName}`,
      passage: selectedVerses.map((verse) => `${verse.number} ${verse.text}`).join("\n"),
      observe: "",
      wonder: "",
      reflect: "",
      pray: "",
      threads: [{ reference: "", text: "", question: "" }],
    };
    window.localStorage.setItem("emmaus-discovery-builder-draft", JSON.stringify(draft));
    window.location.href = "/emmaus/admin";
  }

  const importerHref = `/emmaus/admin/import?book=${encodeURIComponent(selectedBook.name)}&chapter=${selectedChapter}&translation=${translation}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Emmaus Bible Library</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">Browse Scripture</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">Select verses to create a Discovery directly from the Bible text.</p>
        <label className="mt-6 block"><span className="text-sm font-semibold text-gray-800">Translation</span><select value={translation} onChange={(event) => setTranslation(event.target.value as Translation)} className={inputClass}><option value="KJV">KJV — King James Version</option><option value="WEB">WEB — World English Bible</option></select></label>
        <div className="mt-5 grid grid-cols-2 gap-2">{(["Old Testament", "New Testament"] as Testament[]).map((item) => <button key={item} type="button" onClick={() => setTestament(item)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${testament === item ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-700"}`}>{item === "Old Testament" ? "Old" : "New"}</button>)}</div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search books" className={`${inputClass} mt-4`} />
        <div className="mt-4 max-h-[32rem] space-y-1 overflow-auto pr-1">{visibleBooks.map((book) => <button key={book.name} type="button" onClick={() => chooseBook(book)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${selectedBook.name === book.name ? "bg-indigo-50 font-semibold text-indigo-800" : "text-gray-700 hover:bg-gray-50"}`}><span>{book.name}</span><span className="text-xs text-gray-400">{book.chapters}</span></button>)}</div>
      </aside>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">{selectedBook.testament}</p><h2 className="mt-1 text-4xl font-bold text-gray-950">{selectedBook.name} {selectedChapter}</h2><p className="mt-2 text-gray-600">{chapterData?.translationName || translation}</p></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{translation}</span></div>
        <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">{Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map((chapter) => <button key={chapter} type="button" onClick={() => setSelectedChapter(chapter)} className={`aspect-square rounded-xl border text-sm font-semibold transition ${selectedChapter === chapter ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"}`}>{chapter}</button>)}</div>

        <div className="mt-8 rounded-3xl border border-indigo-200 bg-indigo-50/50 p-5 sm:p-7">
          {loading && <p className="text-gray-600">Loading {selectedBook.name} {selectedChapter}...</p>}
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {chapterData && <div className="space-y-3">{chapterData.verses.map((verse) => {
            const selected = selectedKeys.has(verse.canonicalKey);
            return <button key={verse.canonicalKey} type="button" onClick={() => toggleVerse(verse.canonicalKey)} aria-pressed={selected} className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${selected ? "border-indigo-500 bg-indigo-100 ring-2 ring-indigo-200" : "border-white/80 bg-white hover:border-indigo-300"}`}><div className="flex gap-3"><span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 text-gray-500"}`}>{selected ? "✓" : verse.number}</span><div><p className="text-base leading-8 text-gray-800">{verse.text}</p><code className="mt-2 block text-xs text-gray-400">{verse.canonicalKey}</code></div></div></button>;
          })}<p className="pt-2 text-xs text-gray-500">Source: {chapterData.source}</p></div>}
        </div>

        <div className="mt-6 flex flex-wrap gap-3"><Link href={importerHref} className="rounded-full border border-indigo-300 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700">Open in Scripture Importer</Link><Link href="/emmaus/admin/threads" className="rounded-full border border-indigo-300 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700">Open Thread Graph</Link></div>
      </section>

      {selectedVerses.length > 0 && <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-white/95 p-4 shadow-2xl backdrop-blur"><div><p className="font-bold text-gray-950">{selectedVerses.length} verse{selectedVerses.length === 1 ? "" : "s"} selected</p><p className="text-sm text-gray-500">{selectedVerses[0].reference}{selectedVerses.length > 1 ? ` – ${selectedVerses[selectedVerses.length - 1].reference}` : ""}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedKeys(new Set())} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Clear</button><button type="button" onClick={createDiscovery} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">Create Discovery</button></div></div>}
    </div>
  );
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
const inputClass = "mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
