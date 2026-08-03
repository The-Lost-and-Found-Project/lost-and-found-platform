export type PassageDnaSectionId =
  | "canon"
  | "literary"
  | "observation"
  | "language"
  | "historical"
  | "connections"
  | "theology"
  | "narrative"
  | "formation"
  | "mentor"
  | "group"
  | "discovery"
  | "rabbit-trails"
  | "prayer"
  | "journal"
  | "assessment"
  | "memory"
  | "atlas"
  | "ai"
  | "editorial";

export type PassageDnaSection = {
  id: PassageDnaSectionId;
  label: string;
  description: string;
  weight: number;
  requiredFields: string[];
  data: Record<string, unknown>;
  reviewStatus: "empty" | "draft" | "reviewed" | "approved";
};

export type PassageDna = {
  id: string;
  reference: string;
  sourceNodeId: string;
  title: string;
  status: "draft" | "in-review" | "approved" | "published";
  version: number;
  sections: Record<PassageDnaSectionId, PassageDnaSection>;
  updatedAt: string;
};

export const passageDnaBlueprint: Array<Omit<PassageDnaSection, "data" | "reviewStatus">> = [
  { id: "canon", label: "Canon Identity", description: "Book, chapter, verses, genre, section, speaker, and audience.", weight: 8, requiredFields: ["book", "chapter", "verses", "genre"] },
  { id: "literary", label: "Literary DNA", description: "Structure, repetition, contrast, movement, commands, questions, and dialogue.", weight: 6, requiredFields: ["structure", "features"] },
  { id: "observation", label: "Observation DNA", description: "Raw textual observations before interpretation.", weight: 8, requiredFields: ["observations"] },
  { id: "language", label: "Language DNA", description: "Greek, Hebrew, Aramaic, grammar, roots, and significant constructions.", weight: 6, requiredFields: ["terms"] },
  { id: "historical", label: "Historical DNA", description: "Political, cultural, geographic, archaeological, and religious context.", weight: 5, requiredFields: ["context"] },
  { id: "connections", label: "Biblical Connections", description: "Quotations, allusions, echoes, fulfillment, and canonical links.", weight: 8, requiredFields: ["links"] },
  { id: "theology", label: "Theology DNA", description: "Supported doctrines, evidence, confidence, and alternatives.", weight: 7, requiredFields: ["claims"] },
  { id: "narrative", label: "Narrative DNA", description: "Placement in the Bible's redemptive and literary story.", weight: 5, requiredFields: ["storyPlacement"] },
  { id: "formation", label: "Formation DNA", description: "Discipleship skills and faithful responses the passage can form.", weight: 6, requiredFields: ["skills", "responses"] },
  { id: "mentor", label: "Mentor DNA", description: "Misconceptions, follow-up questions, warnings, and encouragement.", weight: 4, requiredFields: ["questions"] },
  { id: "group", label: "Group DNA", description: "Discussion flow, exercises, application, prayer, and leader notes.", weight: 4, requiredFields: ["discussion"] },
  { id: "discovery", label: "Discovery DNA", description: "Adaptive paths for multiple learner depths and audiences.", weight: 6, requiredFields: ["paths"] },
  { id: "rabbit-trails", label: "Rabbit Trail DNA", description: "Valid trails, stops, themes, difficulty, and duration.", weight: 4, requiredFields: ["trails"] },
  { id: "prayer", label: "Prayer DNA", description: "Praise, confession, thanksgiving, intercession, lament, and mission.", weight: 4, requiredFields: ["prompts"] },
  { id: "journal", label: "Journal DNA", description: "Reflection, application, and meditation prompts.", weight: 3, requiredFields: ["prompts"] },
  { id: "assessment", label: "Assessment DNA", description: "Observation, interpretation, connection, application, and reflection items.", weight: 4, requiredFields: ["questions"] },
  { id: "memory", label: "Memory DNA", description: "Memory verse, phrases, connections, and review schedule.", weight: 3, requiredFields: ["verse"] },
  { id: "atlas", label: "Atlas DNA", description: "Visual links, maps, timeline, people, places, and themes.", weight: 4, requiredFields: ["nodes"] },
  { id: "ai", label: "AI DNA", description: "Approved question timing, clues, challenge rules, and stopping conditions.", weight: 5, requiredFields: ["questionRules"] },
  { id: "editorial", label: "Editorial DNA", description: "Sources, reviews, contributors, confidence, versions, and release notes.", weight: 6, requiredFields: ["sources", "reviewers"] },
];

export function createPassageDna(input: { id: string; reference: string; sourceNodeId: string; title: string }): PassageDna {
  const sections = passageDnaBlueprint.reduce((result, section) => {
    result[section.id] = { ...section, data: {}, reviewStatus: "empty" };
    return result;
  }, {} as Record<PassageDnaSectionId, PassageDnaSection>);

  return {
    ...input,
    status: "draft",
    version: 1,
    sections,
    updatedAt: new Date().toISOString(),
  };
}

export function updatePassageDnaSection(
  dna: PassageDna,
  sectionId: PassageDnaSectionId,
  data: Record<string, unknown>,
  reviewStatus: PassageDnaSection["reviewStatus"] = "draft",
): PassageDna {
  return {
    ...dna,
    version: dna.version + 1,
    updatedAt: new Date().toISOString(),
    sections: {
      ...dna.sections,
      [sectionId]: { ...dna.sections[sectionId], data, reviewStatus },
    },
  };
}

export function getSectionCompleteness(section: PassageDnaSection) {
  if (!section.requiredFields.length) return 100;
  const completed = section.requiredFields.filter((field) => {
    const value = section.data[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return value !== undefined && value !== null;
  }).length;
  const fieldScore = Math.round((completed / section.requiredFields.length) * 80);
  const reviewBonus = section.reviewStatus === "approved" ? 20 : section.reviewStatus === "reviewed" ? 12 : section.reviewStatus === "draft" ? 5 : 0;
  return Math.min(100, fieldScore + reviewBonus);
}

export function getEmmausCompletenessScore(dna: PassageDna) {
  const totalWeight = Object.values(dna.sections).reduce((sum, section) => sum + section.weight, 0);
  const weighted = Object.values(dna.sections).reduce((sum, section) => sum + getSectionCompleteness(section) * section.weight, 0);
  return Math.round(weighted / totalWeight);
}

export function getPassageDnaGaps(dna: PassageDna) {
  return Object.values(dna.sections)
    .map((section) => ({ section, completeness: getSectionCompleteness(section) }))
    .filter((item) => item.completeness < 80)
    .sort((a, b) => a.completeness - b.completeness);
}

export function generateDownstreamDrafts(dna: PassageDna) {
  const score = getEmmausCompletenessScore(dna);
  const enabled = score >= 40;
  return [
    { id: "discovery", label: "Discovery Draft", enabled, reason: enabled ? "Passage DNA has enough foundation for a guided Discovery draft." : "Requires at least 40% completeness." },
    { id: "rabbit-trail", label: "Rabbit Trail Draft", enabled: getSectionCompleteness(dna.sections.connections) >= 60, reason: "Requires mature Biblical Connections DNA." },
    { id: "mentor", label: "Mentor Guide Draft", enabled: getSectionCompleteness(dna.sections.mentor) >= 60, reason: "Requires Mentor DNA questions and cautions." },
    { id: "group", label: "Group Study Draft", enabled: getSectionCompleteness(dna.sections.group) >= 60, reason: "Requires Group DNA discussion structure." },
    { id: "assessment", label: "Assessment Draft", enabled: getSectionCompleteness(dna.sections.assessment) >= 60, reason: "Requires reviewed assessment questions." },
    { id: "atlas", label: "Atlas Draft", enabled: getSectionCompleteness(dna.sections.atlas) >= 60, reason: "Requires mapped Atlas nodes." },
  ];
}
