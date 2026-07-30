import type { DevotionDay } from "@/lib/devotion-types";

export function buildNarrationText(day: DevotionDay): string {
  const reflections = day.reflectionQuestions
    .map((question, index) => `Question ${index + 1}. ${question}`)
    .join("\n\n");

  return [
    `Day ${day.day}. ${day.title}.`,
    `Today's Scripture is ${day.verseRef}.`,
    day.scripture,
    "Teaching point.",
    day.teachingPoint,
    "A story to consider.",
    day.story,
    "Today's application.",
    day.application,
    "Questions for reflection.",
    reflections,
    "Let us pray.",
    day.prayer,
  ]
    .filter(Boolean)
    .join("\n\n");
}
