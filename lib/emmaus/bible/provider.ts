export type SupportedBibleTranslation = "KJV" | "WEB";

export type BibleVerse = {
  number: number;
  text: string;
  canonicalKey: string;
  reference: string;
};

export type BibleChapter = {
  translation: SupportedBibleTranslation;
  translationName: string;
  book: string;
  bookId: string;
  chapter: number;
  verses: BibleVerse[];
  source: "Free Use Bible API";
  licenseUrl?: string;
};

const API_BASE = "https://bible.helloao.org/api";

const translationIds: Record<SupportedBibleTranslation, string> = {
  KJV: "ENGKJV",
  WEB: "ENGWEBP",
};

const bookIds: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG", ruth: "RUT", "1 samuel": "1SA", "2 samuel": "2SA",
  "1 kings": "1KI", "2 kings": "2KI", "1 chronicles": "1CH", "2 chronicles": "2CH",
  ezra: "EZR", nehemiah: "NEH", esther: "EST", job: "JOB", psalms: "PSA", psalm: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song of solomon": "SNG", "song of songs": "SNG",
  isaiah: "ISA", jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN",
  hosea: "HOS", joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC",
  nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC",
  malachi: "MAL", matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT",
  romans: "ROM", "1 corinthians": "1CO", "2 corinthians": "2CO", galatians: "GAL",
  ephesians: "EPH", philippians: "PHP", colossians: "COL", "1 thessalonians": "1TH",
  "2 thessalonians": "2TH", "1 timothy": "1TI", "2 timothy": "2TI", titus: "TIT",
  philemon: "PHM", hebrews: "HEB", james: "JAS", "1 peter": "1PE", "2 peter": "2PE",
  "1 john": "1JN", "2 john": "2JN", "3 john": "3JN", jude: "JUD", revelation: "REV",
};

type ApiChapterContent =
  | { type: "verse"; number: number; content: unknown[] }
  | { type: string; [key: string]: unknown };

type ApiChapterResponse = {
  translation?: { name?: string; englishName?: string; licenseUrl?: string };
  book?: { commonName?: string; name?: string; id?: string };
  chapter?: { number?: number; content?: ApiChapterContent[] };
};

export async function getBibleChapter(input: {
  translation: SupportedBibleTranslation;
  book: string;
  chapter: number;
}): Promise<BibleChapter> {
  const translationId = translationIds[input.translation];
  const bookId = getBookId(input.book);
  const chapter = validateChapter(input.chapter);
  const url = `${API_BASE}/${translationId}/${bookId}/${chapter}.json`;

  const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } });
  if (!response.ok) {
    throw new Error(`Bible provider returned ${response.status} for ${input.book} ${chapter}.`);
  }

  const payload = (await response.json()) as ApiChapterResponse;
  const bookName = payload.book?.commonName || payload.book?.name || input.book;
  const content = payload.chapter?.content ?? [];
  const verses = content
    .filter((item): item is Extract<ApiChapterContent, { type: "verse" }> => item.type === "verse")
    .map((item) => ({
      number: item.number,
      text: flattenContent(item.content),
      canonicalKey: `${bookId}.${chapter}.${item.number}`,
      reference: `${bookName} ${chapter}:${item.number}`,
    }))
    .filter((verse) => verse.text.length > 0);

  if (!verses.length) {
    throw new Error(`No verse text was returned for ${bookName} ${chapter}.`);
  }

  return {
    translation: input.translation,
    translationName: payload.translation?.englishName || payload.translation?.name || input.translation,
    book: bookName,
    bookId: payload.book?.id || bookId,
    chapter,
    verses,
    source: "Free Use Bible API",
    licenseUrl: payload.translation?.licenseUrl,
  };
}

export function isSupportedTranslation(value: string): value is SupportedBibleTranslation {
  return value === "KJV" || value === "WEB";
}

function getBookId(book: string) {
  const normalized = book.trim().toLowerCase().replace(/\s+/g, " ");
  const id = bookIds[normalized];
  if (!id) throw new Error(`Unsupported Bible book: ${book}`);
  return id;
}

function validateChapter(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 150) {
    throw new Error("Chapter must be an integer between 1 and 150.");
  }
  return value;
}

function flattenContent(content: unknown[]): string {
  return content.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    const value = item as Record<string, unknown>;
    if (typeof value.text === "string") return value.text;
    if (typeof value.heading === "string") return value.heading;
    if (value.lineBreak === true) return " ";
    return "";
  }).join(" ").replace(/\s+/g, " ").trim();
}
