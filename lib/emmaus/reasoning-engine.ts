import {
  getConnectedKnowledge,
  getKnowledgeNode,
  knowledgeEdges,
  knowledgeNodes,
  type EdgeConfidence,
  type KnowledgeEdge,
  type KnowledgeNode,
  type KnowledgeNodeType,
  type ReviewStatus,
} from "@/lib/emmaus/knowledge-graph";

export type ReasoningIntent =
  | "observe"
  | "connect"
  | "context"
  | "theology"
  | "word-study"
  | "person"
  | "event"
  | "trail";

export type ReasoningStep = {
  node: KnowledgeNode;
  edge: KnowledgeEdge;
  score: number;
  reason: string;
  evidence: string[];
};

export type ReasoningPath = {
  source: KnowledgeNode;
  intent: ReasoningIntent;
  steps: ReasoningStep[];
  summary: string;
  guardrails: string[];
};

const intentTypes: Record<ReasoningIntent, KnowledgeNodeType[]> = {
  observe: ["verse", "passage", "chapter"],
  connect: ["verse", "passage", "theme", "event", "prophecy", "covenant"],
  context: ["book", "chapter", "person", "place", "event"],
  theology: ["doctrine", "concept", "covenant", "theme", "person"],
  "word-study": ["word"],
  person: ["person"],
  event: ["event"],
  trail: ["trail"],
};

const confidenceWeight: Record<EdgeConfidence, number> = {
  explicit: 40,
  strong: 25,
  inferred: 10,
};

const statusWeight: Record<ReviewStatus, number> = {
  approved: 35,
  reviewed: 20,
  draft: 0,
};

export function buildReasoningPath(sourceId: string, intent: ReasoningIntent, limit = 6): ReasoningPath | null {
  const source = getKnowledgeNode(sourceId);
  if (!source) return null;

  const allowedTypes = intentTypes[intent];
  const direct = getConnectedKnowledge(sourceId)
    .filter(({ node }) => allowedTypes.includes(node.type))
    .map(({ node, edge }) => rankStep(node, edge, intent));

  const secondDegree = getConnectedKnowledge(sourceId)
    .flatMap(({ node: intermediate }) =>
      getConnectedKnowledge(intermediate.id)
        .filter(({ node }) => node.id !== sourceId && allowedTypes.includes(node.type))
        .map(({ node, edge }) => ({ ...rankStep(node, edge, intent), score: rankStep(node, edge, intent).score - 15 }))
    );

  const deduped = [...direct, ...secondDegree]
    .filter((step) => step.edge.status === "approved" || step.edge.status === "reviewed")
    .sort((a, b) => b.score - a.score)
    .filter((step, index, list) => list.findIndex((candidate) => candidate.node.id === step.node.id) === index)
    .slice(0, limit);

  return {
    source,
    intent,
    steps: deduped,
    summary: summarizePath(source, intent, deduped),
    guardrails: [
      "Only curated graph relationships are used.",
      "Draft relationships are excluded from learner-facing reasoning.",
      "Explicit textual links rank above strong theological synthesis.",
      "The engine explains why each connection appears.",
      "Human theological review remains authoritative for publication.",
    ],
  };
}

export function explainRelationship(sourceId: string, targetId: string) {
  const edge = knowledgeEdges.find((item) =>
    (item.from === sourceId && item.to === targetId) || (item.from === targetId && item.to === sourceId)
  );
  if (!edge) return null;

  return {
    relationship: edge.relationship,
    explanation: edge.explanation,
    confidence: edge.confidence ?? "inferred",
    status: edge.status ?? "draft",
    sources: edge.sources?.map((source) => source.citation) ?? [],
    reviewNote: edge.reviewNote,
  };
}

export function getAvailableReasoningIntents(sourceId: string): ReasoningIntent[] {
  const source = getKnowledgeNode(sourceId);
  if (!source) return [];

  return (Object.keys(intentTypes) as ReasoningIntent[]).filter((intent) => {
    const path = buildReasoningPath(sourceId, intent, 1);
    return Boolean(path?.steps.length);
  });
}

export function getReasoningCoverage() {
  return knowledgeNodes.map((node) => ({
    nodeId: node.id,
    label: node.label,
    intents: getAvailableReasoningIntents(node.id),
  }));
}

function rankStep(node: KnowledgeNode, edge: KnowledgeEdge, intent: ReasoningIntent): ReasoningStep {
  const confidence = edge.confidence ?? "inferred";
  const status = edge.status ?? "draft";
  const typeMatch = intentTypes[intent].includes(node.type) ? 20 : 0;
  const sourceSupport = Math.min(15, (edge.sources?.length ?? 0) * 5);
  const score = confidenceWeight[confidence] + statusWeight[status] + typeMatch + sourceSupport;

  return {
    node,
    edge,
    score,
    reason: `${node.label} is surfaced because it ${edge.relationship} the source passage through a ${confidence} relationship that is ${status}.`,
    evidence: edge.sources?.map((source) => source.citation) ?? [],
  };
}

function summarizePath(source: KnowledgeNode, intent: ReasoningIntent, steps: ReasoningStep[]) {
  if (!steps.length) return `No reviewed ${intent} path is currently available from ${source.label}.`;
  const strongest = steps[0];
  return `${source.label} currently opens ${steps.length} reviewed ${intent} connection${steps.length === 1 ? "" : "s"}. The strongest path leads to ${strongest.node.label} because the graph marks that relationship as ${strongest.edge.confidence ?? "inferred"}.`;
}
