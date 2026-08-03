export type DiscipleshipSkillId =
  | "observe"
  | "clarify"
  | "connect"
  | "context"
  | "probe"
  | "test"
  | "theology"
  | "reflect"
  | "apply"
  | "summarize"
  | "guide";

export type DiscipleshipSkill = {
  id: DiscipleshipSkillId;
  label: string;
  description: string;
  indicators: string[];
  commonObstacles: string[];
};

export type DiscipleshipEdge = {
  from: DiscipleshipSkillId;
  to: DiscipleshipSkillId;
  relationship: "prepares" | "supports" | "deepens" | "balances";
  explanation: string;
};

export type SkillEvidence = {
  skillId: DiscipleshipSkillId;
  strength: number;
  confidence: number;
  evidenceCount: number;
  lastObservedAt?: string;
  notes?: string[];
};

export type DiscipleshipProfile = {
  learnerId: string;
  skills: Record<DiscipleshipSkillId, SkillEvidence>;
};

export const discipleshipSkills: DiscipleshipSkill[] = [
  { id: "observe", label: "Observe", description: "Notice what the text actually says before interpreting it.", indicators: ["Identifies repeated words", "Names explicit claims", "Separates observation from explanation"], commonObstacles: ["Rushing to application", "Paraphrasing instead of observing"] },
  { id: "clarify", label: "Clarify", description: "Define the question, term, or claim before moving deeper.", indicators: ["Restates the question precisely", "Identifies ambiguous terms"], commonObstacles: ["Answering a different question", "Assuming shared definitions"] },
  { id: "connect", label: "Connect", description: "Relate the passage to relevant biblical texts without flattening context.", indicators: ["Uses meaningful cross-references", "Explains what the connection adds"], commonObstacles: ["Proof-texting", "Treating all similarities as equal"] },
  { id: "context", label: "Context", description: "Read the passage within its literary, historical, and canonical setting.", indicators: ["Identifies audience and setting", "Reads surrounding verses"], commonObstacles: ["Ignoring genre", "Using background to overpower the text"] },
  { id: "probe", label: "Probe", description: "Press beyond first impressions by asking what the wording requires.", indicators: ["Supports claims with clauses", "Distinguishes explicit teaching from inference"], commonObstacles: ["Settling too early", "Repeating conclusions without evidence"] },
  { id: "test", label: "Test", description: "Compare conclusions with the wider witness of Scripture and plausible alternatives.", indicators: ["Considers another interpretation", "Checks conclusions against multiple passages"], commonObstacles: ["Confirmation bias", "Avoiding difficult texts"] },
  { id: "theology", label: "Theological Synthesis", description: "Form faithful conclusions that hold multiple biblical claims together.", indicators: ["Preserves biblical tensions", "Uses multiple texts responsibly"], commonObstacles: ["Overstating one verse", "Confusing tradition with explicit text"] },
  { id: "reflect", label: "Reflect", description: "Identify what the passage reveals about God, humanity, and discipleship.", indicators: ["Moves from facts to meaning", "Names implications before personal application"], commonObstacles: ["Self-focus too early", "Skipping theological meaning"] },
  { id: "apply", label: "Apply", description: "Respond to discovered truth with specific, faithful action.", indicators: ["Names a concrete response", "Links action directly to the passage"], commonObstacles: ["Generic application", "Action disconnected from interpretation"] },
  { id: "summarize", label: "Summarize", description: "State the discovery clearly, cite support, and preserve unresolved questions.", indicators: ["Concise conclusion", "Names strongest evidence", "Keeps open questions visible"], commonObstacles: ["Overconfidence", "Information dumping"] },
  { id: "guide", label: "Guide Others", description: "Help another learner discover truth through questions rather than premature answers.", indicators: ["Asks sequenced questions", "Uses clues sparingly", "Listens before correcting"], commonObstacles: ["Lecturing", "Rescuing the learner too quickly"] },
];

export const discipleshipEdges: DiscipleshipEdge[] = [
  { from: "observe", to: "clarify", relationship: "prepares", explanation: "Careful observation makes the real question easier to define." },
  { from: "observe", to: "connect", relationship: "prepares", explanation: "Connections are strongest when grounded in the actual wording of the source text." },
  { from: "context", to: "connect", relationship: "balances", explanation: "Context prevents cross-references from becoming isolated proof texts." },
  { from: "connect", to: "probe", relationship: "deepens", explanation: "Related passages create better questions about the source text." },
  { from: "probe", to: "test", relationship: "prepares", explanation: "A proposed conclusion should be tested before synthesis." },
  { from: "test", to: "theology", relationship: "prepares", explanation: "Theological synthesis should follow comparison and testing." },
  { from: "theology", to: "reflect", relationship: "supports", explanation: "Reflection grows from a faithful understanding of what the passage reveals." },
  { from: "reflect", to: "apply", relationship: "prepares", explanation: "Application should flow from discovered meaning." },
  { from: "summarize", to: "guide", relationship: "prepares", explanation: "A learner should be able to state the discovery clearly before guiding another person." },
  { from: "test", to: "guide", relationship: "supports", explanation: "Guides need practice testing conclusions without supplying answers prematurely." },
];

export function createEmptyDiscipleshipProfile(learnerId: string): DiscipleshipProfile {
  const skills = discipleshipSkills.reduce((profile, skill) => {
    profile[skill.id] = { skillId: skill.id, strength: 0, confidence: 0, evidenceCount: 0 };
    return profile;
  }, {} as Record<DiscipleshipSkillId, SkillEvidence>);
  return { learnerId, skills };
}

export function updateSkillEvidence(profile: DiscipleshipProfile, signal: { skillId: DiscipleshipSkillId; quality: number; confidence?: number; note?: string; observedAt?: string }): DiscipleshipProfile {
  const current = profile.skills[signal.skillId];
  const quality = clamp(signal.quality, 0, 100);
  const evidenceCount = current.evidenceCount + 1;
  const strength = Math.round((current.strength * current.evidenceCount + quality) / evidenceCount);
  const confidence = Math.round((current.confidence * current.evidenceCount + (signal.confidence ?? quality)) / evidenceCount);
  return {
    ...profile,
    skills: {
      ...profile.skills,
      [signal.skillId]: {
        ...current,
        strength,
        confidence: clamp(confidence, 0, 100),
        evidenceCount,
        lastObservedAt: signal.observedAt ?? new Date().toISOString(),
        notes: signal.note ? [...(current.notes ?? []), signal.note].slice(-8) : current.notes,
      },
    },
  };
}

export function recommendNextSkill(profile: DiscipleshipProfile) {
  const ranked = discipleshipSkills.map((skill) => {
    const evidence = profile.skills[skill.id];
    const prerequisites = discipleshipEdges.filter((edge) => edge.to === skill.id && edge.relationship === "prepares");
    const readiness = prerequisites.length
      ? prerequisites.reduce((sum, edge) => sum + profile.skills[edge.from].strength, 0) / prerequisites.length
      : 100;
    const need = 100 - evidence.strength;
    const evidenceGap = Math.max(0, 3 - evidence.evidenceCount) * 8;
    const score = need * 0.55 + readiness * 0.35 + evidenceGap * 0.1;
    return { skill, evidence, readiness: Math.round(readiness), score: Math.round(score), prerequisites };
  }).sort((a, b) => b.score - a.score);

  const recommendation = ranked.find((item) => item.readiness >= 45) ?? ranked[0];
  return {
    ...recommendation,
    reason: `${recommendation.skill.label} is recommended because current evidence shows ${describeStrength(recommendation.evidence.strength)} development and prerequisite readiness of ${recommendation.readiness}%.`,
  };
}

export function getTeachingAdjustments(profile: DiscipleshipProfile) {
  const recommendations: string[] = [];
  const skills = profile.skills;
  if (skills.observe.strength < 55) recommendations.push("Ask for concrete textual observations before interpretation.");
  if (skills.connect.strength < 55) recommendations.push("Offer one reviewed cross-reference and ask what it adds.");
  if (skills.test.strength < 55) recommendations.push("Require the learner to test conclusions against an alternative or second passage.");
  if (skills.apply.strength > 75 && skills.observe.strength < 60) recommendations.push("Slow the learner down; they may be applying before observing carefully.");
  if (skills.theology.strength > 75 && skills.apply.strength < 50) recommendations.push("Move from synthesis to a specific act of obedience.");
  if (skills.guide.strength > 60) recommendations.push("Include teacher-level prompts that ask how to lead another learner without lecturing.");
  return recommendations.length ? recommendations : ["Maintain the current balance of observation, connection, reflection, and application."];
}

export function getSkillPath(target: DiscipleshipSkillId) {
  const visited = new Set<DiscipleshipSkillId>();
  const path: DiscipleshipSkillId[] = [];
  function visit(skillId: DiscipleshipSkillId) {
    if (visited.has(skillId)) return;
    visited.add(skillId);
    discipleshipEdges.filter((edge) => edge.to === skillId && edge.relationship === "prepares").forEach((edge) => visit(edge.from));
    path.push(skillId);
  }
  visit(target);
  return path.map((id) => discipleshipSkills.find((skill) => skill.id === id)).filter(Boolean) as DiscipleshipSkill[];
}

function describeStrength(value: number) {
  if (value >= 80) return "strong";
  if (value >= 55) return "growing";
  return "developing";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
