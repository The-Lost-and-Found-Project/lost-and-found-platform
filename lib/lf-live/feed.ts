export const LIVE_POST_TYPES = [
  "announcement",
  "question",
  "poll",
  "prayer",
  "scripture",
  "resource",
] as const;

export type LivePostType = (typeof LIVE_POST_TYPES)[number];

export const LIVE_POST_LIMITS = {
  title: 160,
  body: 12000,
  scriptureReference: 240,
  choice: 240,
  choices: 8,
  response: 4000,
} as const;

export function isLivePostType(value: unknown): value is LivePostType {
  return typeof value === "string" && (LIVE_POST_TYPES as readonly string[]).includes(value);
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanChoices(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((choice) => cleanText(choice, LIVE_POST_LIMITS.choice)).filter(Boolean)),
  ).slice(0, LIVE_POST_LIMITS.choices);
}
