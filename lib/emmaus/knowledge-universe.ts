import { knowledgeEdges, knowledgeNodes, type KnowledgeEdge, type KnowledgeNode } from "@/lib/emmaus/knowledge-graph";

export type KnowledgeLayerId =
  | "canon"
  | "language"
  | "historical-world"
  | "theology"
  | "narrative"
  | "discipleship"
  | "church-history"
  | "contributor";

export type AuthorityLevel =
  | "scripture"
  | "textual-data"
  | "historical-context"
  | "theological-synthesis"
  | "formation-guidance"
  | "historical-interpretation"
  | "editorial-proposal";

export type UniverseLayer = {
  id: KnowledgeLayerId;
  name: string;
  description: string;
  authorityLevel: AuthorityLevel;
  learnerLabel: string;
  boundaryStatement: string;
  allowedNodeTypes: string[];
};

export type UniverseNode = {
  id: string;
  layerId: KnowledgeLayerId;
  authorityLevel: AuthorityLevel;
  sourceNodeId?: string;
  label: string;
  description: string;
  status: "draft" | "reviewed" | "approved";
  provenance: string[];
  tags: string[];
};

export type UniverseBridge = {
  id: string;
  fromLayer: KnowledgeLayerId;
  toLayer: KnowledgeLayerId;
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
  explanation: string;
  status: "draft" | "reviewed" | "approved";
  confidence: "explicit" | "strong" | "inferred";
  boundaryNote: string;
};

export const knowledgeLayers: UniverseLayer[] = [
  {
    id: "canon",
    name: "Canon",
    description: "Books, chapters, verses, passages, quotations, and explicit textual relationships.",
    authorityLevel: "scripture",
    learnerLabel: "Scripture",
    boundaryStatement: "This layer contains the biblical text and direct textual relationships. It is primary over every other layer.",
    allowedNodeTypes: ["book", "chapter", "verse", "passage", "prophecy"],
  },
  {
    id: "language",
    name: "Language",
    description: "Hebrew, Aramaic, and Greek words, morphology, grammar, and translation data.",
    authorityLevel: "textual-data",
    learnerLabel: "Original Language",
    boundaryStatement: "Language data serves interpretation but does not replace literary or canonical context.",
    allowedNodeTypes: ["word"],
  },
  {
    id: "historical-world",
    name: "Historical World",
    description: "People, places, events, cultures, timelines, customs, and archaeological context.",
    authorityLevel: "historical-context",
    learnerLabel: "Historical Context",
    boundaryStatement: "Historical reconstruction may illuminate Scripture but must be distinguished from inspired text.",
    allowedNodeTypes: ["person", "place", "event"],
  },
  {
    id: "theology",
    name: "Theology",
    description: "Doctrines, covenants, themes, and synthesized biblical claims.",
    authorityLevel: "theological-synthesis",
    learnerLabel: "Biblical Theology",
    boundaryStatement: "Theological conclusions must show their scriptural basis and distinguish explicit teaching from synthesis.",
    allowedNodeTypes: ["doctrine", "covenant", "theme", "concept"],
  },
  {
    id: "narrative",
    name: "Narrative",
    description: "Story arcs, literary structure, motifs, patterns, parallels, and canonical development.",
    authorityLevel: "theological-synthesis",
    learnerLabel: "Story and Structure",
    boundaryStatement: "Narrative patterns must arise from demonstrable textual features rather than imaginative similarity.",
    allowedNodeTypes: ["event", "theme", "prophecy", "passage"],
  },
  {
    id: "discipleship",
    name: "Discipleship",
    description: "Formation skills, study practices, application pathways, mentor interventions, and learning objectives.",
    authorityLevel: "formation-guidance",
    learnerLabel: "Practice and Formation",
    boundaryStatement: "Formation guidance applies Scripture but does not claim to measure spiritual worth or divine approval.",
    allowedNodeTypes: ["trail", "concept", "theme"],
  },
  {
    id: "church-history",
    name: "Church History",
    description: "Councils, confessions, theologians, interpretive traditions, and historical debates.",
    authorityLevel: "historical-interpretation",
    learnerLabel: "Historical Interpretation",
    boundaryStatement: "Church history records later interpretation and must never be presented as equal to Scripture.",
    allowedNodeTypes: ["concept", "doctrine", "person", "event"],
  },
  {
    id: "contributor",
    name: "Contributor Review",
    description: "Proposals, source discussions, revisions, confidence ratings, and editorial decisions.",
    authorityLevel: "editorial-proposal",
    learnerLabel: "Editorial Review",
    boundaryStatement: "Contributor material remains non-authoritative until reviewed and approved through the editorial workflow.",
    allowedNodeTypes: ["proposal", "review", "revision"],
  },
];

export function classifyKnowledgeNode(node: KnowledgeNode): KnowledgeLayerId[] {
  const layers: KnowledgeLayerId[] = [];
  if (["book", "chapter", "verse", "passage", "prophecy"].includes(node.type)) layers.push("canon");
  if (node.type === "word") layers.push("language");
  if (["person", "place", "event"].includes(node.type)) layers.push("historical-world");
  if (["doctrine", "covenant", "theme", "concept"].includes(node.type)) layers.push("theology");
  if (["event", "theme", "prophecy", "passage"].includes(node.type)) layers.push("narrative");
  if (node.type === "trail") layers.push("discipleship");
  return [...new Set(layers)];
}

export function buildUniverseNodes(): UniverseNode[] {
  return knowledgeNodes.flatMap((node) =>
    classifyKnowledgeNode(node).map((layerId) => {
      const layer = getKnowledgeLayer(layerId)!;
      return {
        id: `${layerId}:${node.id}`,
        layerId,
        authorityLevel: layer.authorityLevel,
        sourceNodeId: node.id,
        label: node.label,
        description: node.description,
        status: node.status ?? "draft",
        provenance: node.sources?.map((source) => source.citation) ?? [],
        tags: node.tags ?? [],
      };
    }),
  );
}

export function buildUniverseBridges(): UniverseBridge[] {
  return knowledgeEdges.flatMap((edge, index) => {
    const from = knowledgeNodes.find((node) => node.id === edge.from);
    const to = knowledgeNodes.find((node) => node.id === edge.to);
    if (!from || !to) return [];

    const fromLayers = classifyKnowledgeNode(from);
    const toLayers = classifyKnowledgeNode(to);

    return fromLayers.flatMap((fromLayer) =>
      toLayers
        .filter((toLayer) => toLayer !== fromLayer)
        .map((toLayer) => ({
          id: `bridge-${edge.id ?? index}-${fromLayer}-${toLayer}`,
          fromLayer,
          toLayer,
          fromNodeId: `${fromLayer}:${from.id}`,
          toNodeId: `${toLayer}:${to.id}`,
          relationship: edge.relationship,
          explanation: edge.explanation,
          status: edge.status ?? "draft",
          confidence: edge.confidence ?? "inferred",
          boundaryNote: bridgeBoundary(fromLayer, toLayer),
        })),
    );
  });
}

export function getKnowledgeLayer(id: KnowledgeLayerId) {
  return knowledgeLayers.find((layer) => layer.id === id) ?? null;
}

export function getUniverseNode(id: string) {
  return buildUniverseNodes().find((node) => node.id === id) ?? null;
}

export function getLayerNodes(layerId: KnowledgeLayerId, approvedOnly = false) {
  return buildUniverseNodes().filter((node) => node.layerId === layerId && (!approvedOnly || node.status === "approved"));
}

export function getCrossLayerPaths(sourceNodeId: string, approvedOnly = true) {
  const nodes = buildUniverseNodes().filter((node) => node.sourceNodeId === sourceNodeId);
  const bridges = buildUniverseBridges().filter((bridge) => !approvedOnly || bridge.status === "approved");

  return nodes.map((node) => ({
    source: node,
    paths: bridges.filter((bridge) => bridge.fromNodeId === node.id || bridge.toNodeId === node.id),
  }));
}

export function validateKnowledgeUniverse() {
  const nodes = buildUniverseNodes();
  const nodeIds = new Set(nodes.map((node) => node.id));
  const bridges = buildUniverseBridges();
  const orphanedBridges = bridges.filter((bridge) => !nodeIds.has(bridge.fromNodeId) || !nodeIds.has(bridge.toNodeId));
  const unlabeledBoundaries = bridges.filter((bridge) => !bridge.boundaryNote.trim());
  const approvedWithoutProvenance = nodes.filter((node) => node.status === "approved" && node.layerId !== "discipleship" && node.provenance.length === 0);

  return {
    valid: orphanedBridges.length === 0 && unlabeledBoundaries.length === 0 && approvedWithoutProvenance.length === 0,
    orphanedBridges,
    unlabeledBoundaries,
    approvedWithoutProvenance,
    layerCounts: knowledgeLayers.reduce<Record<KnowledgeLayerId, number>>((counts, layer) => {
      counts[layer.id] = nodes.filter((node) => node.layerId === layer.id).length;
      return counts;
    }, {} as Record<KnowledgeLayerId, number>),
  };
}

function bridgeBoundary(from: KnowledgeLayerId, to: KnowledgeLayerId) {
  if (from === "canon" && to !== "canon") return "This path begins with Scripture and moves into a supporting interpretive layer.";
  if (to === "canon" && from !== "canon") return "This supporting layer must be tested against the biblical text it references.";
  if (from === "church-history" || to === "church-history") return "Historical interpretation is informative but remains distinct from biblical authority.";
  if (from === "contributor" || to === "contributor") return "This relationship remains editorial until review and approval are complete.";
  return "This cross-layer relationship must preserve the authority and limits of both domains.";
}
