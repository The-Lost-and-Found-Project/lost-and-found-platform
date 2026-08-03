import { recommendNextSkill, getTeachingAdjustments, type DiscipleshipProfile, type DiscipleshipSkillId } from "@/lib/emmaus/discipleship-graph";
import { buildMemoryThreads, resurfaceMemories, type EmmausMemory } from "@/lib/emmaus/memory-system";
import { buildReasoningPath, type ReasoningIntent } from "@/lib/emmaus/reasoning-engine";

export type JourneyActionKind = "discovery" | "rabbit-trail" | "workspace" | "word-study" | "memorization" | "prayer" | "mentor-conversation" | "review";

export type JourneyCandidate = {
  id: string;
  kind: JourneyActionKind;
  title: string;
  description: string;
  href: string;
  passage?: string;
  themes: string[];
  skillFocus?: DiscipleshipSkillId;
  reasoningIntent?: ReasoningIntent;
  sourceNodeId?: string;
  estimatedMinutes?: number;
};

export type JourneyContext = {
  learnerId: string;
  currentPassage?: string;
  currentQuestion?: string;
  currentThemes: string[];
  completedCandidateIds: string[];
  discipleshipProfile: DiscipleshipProfile;
  memories: EmmausMemory[];
  mentorGuidance?: {
    priority?: "conversation" | "study-together" | "assign-next-step";
    suggestedPassage?: string;
    suggestedSkill?: DiscipleshipSkillId;
  };
  availableCandidates: JourneyCandidate[];
};

export type RankedJourneyCandidate = JourneyCandidate & {
  score: number;
  reasons: string[];
  cautions: string[];
};

export function recommendJourneyStep(context: JourneyContext) {
  const nextSkill = recommendNextSkill(context.discipleshipProfile);
  const teachingAdjustments = getTeachingAdjustments(context.discipleshipProfile);
  const memoryThreads = buildMemoryThreads(context.memories);
  const resurfacedMemories = resurfaceMemories(context.memories, {
    currentPassage: context.currentPassage,
    currentThemes: context.currentThemes,
    currentQuestion: context.currentQuestion,
    includePrivate: true,
    maxResults: 4,
  });

  const ranked = context.availableCandidates
    .filter((candidate) => !context.completedCandidateIds.includes(candidate.id) || candidate.kind === "review")
    .map((candidate) => rankCandidate(candidate, context, nextSkill.skill.id, memoryThreads, resurfacedMemories))
    .sort((a, b) => b.score - a.score);

  let primary = ranked[0] ?? null;
  const priority = context.mentorGuidance?.priority;
  if (priority === "conversation") primary = ranked.find((item) => item.kind === "mentor-conversation") ?? primary;
  if (priority === "study-together") primary = ranked.find((item) => item.kind === "workspace" || item.kind === "review") ?? primary;
  if (priority === "assign-next-step" && context.mentorGuidance?.suggestedPassage) {
    primary = ranked.find((item) => item.passage === context.mentorGuidance?.suggestedPassage) ?? primary;
  }

  return {
    primary,
    alternatives: ranked.filter((item) => item.id !== primary?.id).slice(0, 3),
    nextSkill,
    teachingAdjustments,
    resurfacedMemories,
    summary: primary
      ? `${primary.title} is recommended because it best aligns with the learner's current themes, next study skill (${nextSkill.skill.label}), and relevant prior memory.`
      : "No suitable next step is available from the current approved library.",
    guardrails: [
      "Recommendations are explainable and can be overridden.",
      "The engine recommends study actions, not private divine direction.",
      "Mentor conversation can outrank automated content.",
      "Private memories remain learner-controlled.",
    ],
  };
}

function rankCandidate(
  candidate: JourneyCandidate,
  context: JourneyContext,
  nextSkillId: DiscipleshipSkillId,
  memoryThreads: ReturnType<typeof buildMemoryThreads>,
  resurfaced: ReturnType<typeof resurfaceMemories>,
): RankedJourneyCandidate {
  let score = 0;
  const reasons: string[] = [];
  const cautions: string[] = [];

  const sharedThemes = candidate.themes.filter((theme) => context.currentThemes.some((current) => current.toLowerCase() === theme.toLowerCase()));
  if (sharedThemes.length) {
    score += sharedThemes.length * 14;
    reasons.push(`continues current themes: ${sharedThemes.join(", ")}`);
  }

  if (candidate.skillFocus === nextSkillId) {
    score += 28;
    reasons.push(`strengthens ${nextSkillId}`);
  }

  if (context.mentorGuidance?.suggestedSkill === candidate.skillFocus) {
    score += 24;
    reasons.push("aligns with mentor guidance");
  }

  if (candidate.passage && context.currentPassage && normalize(candidate.passage) === normalize(context.currentPassage)) {
    score += candidate.kind === "review" ? 24 : 10;
    reasons.push("returns to the current passage");
  }

  const relatedThreads = memoryThreads.filter((thread) =>
    thread.themes.some((theme) => candidate.themes.some((candidateTheme) => candidateTheme.toLowerCase() === theme.toLowerCase())) ||
    (candidate.passage && thread.passages.some((passage) => normalize(passage) === normalize(candidate.passage ?? ""))),
  );
  if (relatedThreads.length) {
    score += Math.min(24, relatedThreads.length * 8);
    reasons.push(`reconnects with ${relatedThreads.length} memory thread${relatedThreads.length === 1 ? "" : "s"}`);
  }

  const relatedMemories = resurfaced.filter((item) =>
    item.memory.themes.some((theme) => candidate.themes.some((candidateTheme) => candidateTheme.toLowerCase() === theme.toLowerCase())) ||
    (candidate.passage && item.memory.passage && normalize(candidate.passage) === normalize(item.memory.passage)),
  );
  if (relatedMemories.length) {
    score += Math.min(20, relatedMemories.length * 7);
    reasons.push("revisits relevant prior learning");
  }

  if (candidate.sourceNodeId && candidate.reasoningIntent) {
    const path = buildReasoningPath(candidate.sourceNodeId, candidate.reasoningIntent, 3);
    if (path?.steps.length) {
      score += path.steps[0].edge.status === "approved" ? 18 : 10;
      reasons.push(`supported by ${path.steps.length} reviewed graph connection${path.steps.length === 1 ? "" : "s"}`);
    } else {
      score -= 18;
      cautions.push("no reviewed reasoning path is available");
    }
  }

  if (candidate.estimatedMinutes && candidate.estimatedMinutes > 60) {
    score -= 5;
    cautions.push("requires a longer study window");
  }

  if (candidate.kind === "mentor-conversation" && context.mentorGuidance?.priority === "conversation") {
    score += 50;
    reasons.push("mentor prioritized conversation");
  }

  return { ...candidate, score, reasons, cautions };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
}
