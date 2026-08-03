export type MemoryKind =
  | "discovery"
  | "question"
  | "correction"
  | "prayer"
  | "journal"
  | "memorized-verse"
  | "rabbit-trail"
  | "mentor-note"
  | "milestone";

export type MemoryVisibility = "private" | "mentor-shared" | "community-shared";

export type EmmausMemory = {
  id: string;
  learnerId: string;
  kind: MemoryKind;
  title: string;
  body: string;
  passage?: string;
  themes: string[];
  createdAt: string;
  updatedAt: string;
  visibility: MemoryVisibility;
  consentSource: "learner" | "mentor" | "system";
  canResurface: boolean;
  resolvedAt?: string;
  supersedesMemoryId?: string;
  sourceHref?: string;
};

export type MemoryThread = {
  key: string;
  label: string;
  memories: EmmausMemory[];
  passages: string[];
  themes: string[];
  openQuestions: EmmausMemory[];
  correctedConclusions: EmmausMemory[];
  lastActiveAt: string;
};

export type ResurfacingContext = {
  currentPassage?: string;
  currentThemes?: string[];
  currentQuestion?: string;
  maxResults?: number;
  includePrivate?: boolean;
};

export type ResurfacedMemory = {
  memory: EmmausMemory;
  score: number;
  reasons: string[];
};

export function createMemory(input: Omit<EmmausMemory, "id" | "createdAt" | "updatedAt">): EmmausMemory {
  const now = new Date().toISOString();
  return {
    ...input,
    id: `memory-${cryptoRandomId()}`,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateMemory(memory: EmmausMemory, changes: Partial<Pick<EmmausMemory, "title" | "body" | "themes" | "visibility" | "canResurface" | "resolvedAt">>): EmmausMemory {
  return {
    ...memory,
    ...changes,
    updatedAt: new Date().toISOString(),
  };
}

export function correctMemory(original: EmmausMemory, correction: { title: string; body: string; passage?: string; themes?: string[] }): EmmausMemory {
  const now = new Date().toISOString();
  return {
    id: `memory-${cryptoRandomId()}`,
    learnerId: original.learnerId,
    kind: "correction",
    title: correction.title,
    body: correction.body,
    passage: correction.passage ?? original.passage,
    themes: correction.themes ?? original.themes,
    createdAt: now,
    updatedAt: now,
    visibility: original.visibility,
    consentSource: original.consentSource,
    canResurface: true,
    supersedesMemoryId: original.id,
    sourceHref: original.sourceHref,
  };
}

export function buildMemoryThreads(memories: EmmausMemory[]): MemoryThread[] {
  const groups = new Map<string, EmmausMemory[]>();

  memories.forEach((memory) => {
    const keys = new Set<string>();
    memory.themes.forEach((theme) => keys.add(`theme:${theme.toLowerCase()}`));
    if (memory.passage) keys.add(`passage:${normalizePassage(memory.passage)}`);
    if (!keys.size) keys.add(`kind:${memory.kind}`);

    keys.forEach((key) => groups.set(key, [...(groups.get(key) ?? []), memory]));
  });

  return [...groups.entries()]
    .map(([key, threadMemories]) => {
      const ordered = [...threadMemories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const label = key.startsWith("theme:")
        ? ordered.flatMap((memory) => memory.themes).find((theme) => `theme:${theme.toLowerCase()}` === key) ?? key.replace("theme:", "")
        : key.startsWith("passage:")
          ? ordered.find((memory) => memory.passage)?.passage ?? key.replace("passage:", "")
          : key.replace("kind:", "");

      return {
        key,
        label,
        memories: ordered,
        passages: [...new Set(ordered.map((memory) => memory.passage).filter(Boolean) as string[])],
        themes: [...new Set(ordered.flatMap((memory) => memory.themes))],
        openQuestions: ordered.filter((memory) => memory.kind === "question" && !memory.resolvedAt),
        correctedConclusions: ordered.filter((memory) => memory.kind === "correction"),
        lastActiveAt: ordered[0]?.updatedAt ?? new Date(0).toISOString(),
      };
    })
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
}

export function resurfaceMemories(memories: EmmausMemory[], context: ResurfacingContext): ResurfacedMemory[] {
  const currentThemes = (context.currentThemes ?? []).map((theme) => theme.toLowerCase());
  const normalizedQuestion = context.currentQuestion?.toLowerCase() ?? "";
  const currentPassage = context.currentPassage ? normalizePassage(context.currentPassage) : "";

  return memories
    .filter((memory) => memory.canResurface)
    .filter((memory) => context.includePrivate || memory.visibility !== "private")
    .map((memory) => {
      let score = 0;
      const reasons: string[] = [];

      if (memory.passage && currentPassage && normalizePassage(memory.passage) === currentPassage) {
        score += 45;
        reasons.push(`same passage: ${memory.passage}`);
      }

      const sharedThemes = memory.themes.filter((theme) => currentThemes.includes(theme.toLowerCase()));
      if (sharedThemes.length) {
        score += sharedThemes.length * 18;
        reasons.push(`shared themes: ${sharedThemes.join(", ")}`);
      }

      const searchable = `${memory.title} ${memory.body} ${memory.themes.join(" ")}`.toLowerCase();
      const questionTerms = normalizedQuestion.split(/\W+/).filter((term) => term.length > 4);
      const matchedTerms = questionTerms.filter((term) => searchable.includes(term));
      if (matchedTerms.length) {
        score += matchedTerms.length * 8;
        reasons.push(`question overlap: ${matchedTerms.join(", ")}`);
      }

      if (memory.kind === "correction") {
        score += 12;
        reasons.push("contains a corrected conclusion");
      }

      if (memory.kind === "question" && !memory.resolvedAt) {
        score += 10;
        reasons.push("contains an unresolved question");
      }

      const ageDays = Math.max(0, (Date.now() - new Date(memory.updatedAt).getTime()) / 86_400_000);
      score += Math.max(0, 10 - Math.floor(ageDays / 30));

      return { memory, score, reasons };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, context.maxResults ?? 5);
}

export function getMemorySummary(memories: EmmausMemory[]) {
  const threads = buildMemoryThreads(memories);
  return {
    total: memories.length,
    privateCount: memories.filter((memory) => memory.visibility === "private").length,
    sharedWithMentorCount: memories.filter((memory) => memory.visibility === "mentor-shared").length,
    unresolvedQuestions: memories.filter((memory) => memory.kind === "question" && !memory.resolvedAt).length,
    correctedConclusions: memories.filter((memory) => memory.kind === "correction").length,
    memorizedVerses: memories.filter((memory) => memory.kind === "memorized-verse").length,
    activeThreads: threads.length,
    mostRecentThread: threads[0]?.label ?? null,
  };
}

export function canMentorViewMemory(memory: EmmausMemory) {
  return memory.visibility === "mentor-shared";
}

export function exportLearnerMemory(memories: EmmausMemory[]) {
  return memories.map((memory) => ({
    id: memory.id,
    kind: memory.kind,
    title: memory.title,
    body: memory.body,
    passage: memory.passage,
    themes: memory.themes,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    visibility: memory.visibility,
    resolvedAt: memory.resolvedAt,
    supersedesMemoryId: memory.supersedesMemoryId,
  }));
}

function normalizePassage(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[–—]/g, "-").trim();
}

function cryptoRandomId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
