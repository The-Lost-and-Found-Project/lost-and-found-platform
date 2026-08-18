export type ScriptureTranslationId = "KJV";

export type ScriptureReference = {
  book: string;
  chapter: number;
};

export type ScriptureVerse = {
  number: number;
  text: string;
  canonicalKey: string;
  reference: string;
};

export type ScriptureChapter = {
  translation: ScriptureTranslationId;
  translationName: string;
  book: string;
  chapter: number;
  verses: ScriptureVerse[];
  source: string;
  attribution?: string;
};

export interface ScriptureProvider {
  readonly id: string;
  readonly translations: readonly ScriptureTranslationId[];
  getChapter(input: ScriptureReference & { translation: ScriptureTranslationId }): Promise<ScriptureChapter>;
}
