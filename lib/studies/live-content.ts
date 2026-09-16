export type StudySlide = Record<string, unknown>;

const PRIVATE_FACILITATOR_FIELDS = new Set([
  "notes",
  "context",
  "word_insights",
  "cross_references",
  "theology",
  "teaching_points",
  "transition",
  "prayer_points",
  "toolbox",
  "facilitator_notes",
  "likely_responses",
  "follow_up_prompts",
  "timing_notes",
]);

/**
 * Ordinary participants never receive facilitator-only content in the network payload.
 * Hiding these fields in the React UI is not considered a privacy boundary.
 */
export function participantSlides(slides: unknown): StudySlide[] {
  if (!Array.isArray(slides)) return [];
  return slides.map((slide) => {
    if (!slide || typeof slide !== "object" || Array.isArray(slide)) return {};
    return Object.fromEntries(
      Object.entries(slide as StudySlide).filter(([key]) => !PRIVATE_FACILITATOR_FIELDS.has(key)),
    );
  });
}

/** Facilitators/admins receive the complete authored study payload. */
export function facilitatorSlides(slides: unknown): StudySlide[] {
  return Array.isArray(slides) ? (slides as StudySlide[]) : [];
}

export type OptionalStudyTool = {
  id?: string;
  type?: "poll" | "quiz" | "scripture_observation" | "word_study" | "reflection" | "application" | "couple_exercise" | "emmaus_insight" | "visual";
  priority?: "core" | "helpful" | "if_time_allows";
  title?: string;
  prompt?: string;
  scripture?: string;
  choices?: string[];
  answer?: string;
  facilitator_note?: string;
};
