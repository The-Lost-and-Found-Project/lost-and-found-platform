export type SuggestionNode = {
  id: string;
  node_type: string;
  title: string;
  subtitle?: string | null;
  scripture_reference?: string | null;
  summary?: string | null;
};

export type ExistingEdge = {
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
};

export type ConnectionSuggestion = {
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
  score: number;
  confidence_class: "explicit" | "strong" | "supported" | "tentative" | "disputed";
  rationale: string;
  evidence: Array<{ type: string; detail: string; weight: number }>;
  generator: "deterministic-v1";
};

const STOP_WORDS = new Set([
  "the", "and", "that", "with", "from", "this", "into", "your", "their", "they", "them", "then", "than",
  "for", "are", "was", "were", "has", "have", "had", "but", "not", "you", "his", "her", "our", "out",
  "who", "what", "when", "where", "why", "how", "all", "any", "can", "will", "would", "should", "could",
  "god", "jesus", "lord", "christ", "verse", "passage", "scripture",
]);

export function generateConnectionSuggestions(
  nodes: SuggestionNode[],
  existingEdges: ExistingEdge[],
  options: { minimumScore?: number; maximumSuggestions?: number } = {},
): ConnectionSuggestion[] {
  const minimumScore = options.minimumScore ?? 45;
  const maximumSuggestions = options.maximumSuggestions ?? 100;
  const existing = new Set(
    existingEdges.flatMap((edge) => [
      edgeKey(edge.source_node_id, edge.target_node_id, edge.relationship_key),
      edgeKey(edge.target_node_id, edge.source_node_id, edge.relationship_key),
    ]),
  );
  const suggestions: ConnectionSuggestion[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const source = nodes[i];
      const target = nodes[j];
      const candidate = scorePair(source, target);
      if (!candidate || candidate.score < minimumScore) continue;
      if (existing.has(edgeKey(source.id, target.id, candidate.relationship_key))) continue;
      suggestions.push({
        source_node_id: source.id,
        target_node_id: target.id,
        ...candidate,
        generator: "deterministic-v1",
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maximumSuggestions);
}

function scorePair(source: SuggestionNode, target: SuggestionNode) {
  const evidence: ConnectionSuggestion["evidence"] = [];
  let score = 0;
  let relationship_key = "develops_theme";

  const sourceReference = normalizeReference(source.scripture_reference);
  const targetReference = normalizeReference(target.scripture_reference);
  if (sourceReference && targetReference) {
    if (sourceReference === targetReference) {
      score += 55;
      relationship_key = "parallel_passage";
      evidence.push({ type: "scripture_reference", detail: `Both nodes reference ${source.scripture_reference}.`, weight: 55 });
    } else if (sameBook(sourceReference, targetReference)) {
      score += 22;
      relationship_key = "related_passage";
      evidence.push({ type: "same_book", detail: "Both nodes reference passages from the same biblical book.", weight: 22 });
    }
  }

  const sourceTokens = tokenize(source);
  const targetTokens = tokenize(target);
  const overlap = [...sourceTokens].filter((token) => targetTokens.has(token));
  if (overlap.length) {
    const weight = Math.min(42, overlap.length * 9);
    score += weight;
    evidence.push({ type: "shared_terms", detail: `Shared terms: ${overlap.slice(0, 8).join(", ")}.`, weight });
  }

  if (source.node_type === target.node_type) {
    score += 8;
    evidence.push({ type: "same_node_type", detail: `Both nodes are ${source.node_type.replaceAll("_", " ")} nodes.`, weight: 8 });
  }

  const typeRelationship = inferTypeRelationship(source.node_type, target.node_type);
  if (typeRelationship) {
    relationship_key = typeRelationship.key;
    score += typeRelationship.weight;
    evidence.push({ type: "node_type_pair", detail: typeRelationship.detail, weight: typeRelationship.weight });
  }

  score = Math.min(100, score);
  if (score < 1) return null;

  return {
    relationship_key,
    score,
    confidence_class: confidenceClass(score),
    rationale: buildRationale(source, target, evidence),
    evidence,
  };
}

function tokenize(node: SuggestionNode) {
  const text = [node.title, node.subtitle, node.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  return new Set(
    text
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token)),
  );
}

function inferTypeRelationship(sourceType: string, targetType: string) {
  const pair = new Set([sourceType, targetType]);
  if (pair.has("passage") && pair.has("theme")) return { key: "develops_theme", weight: 18, detail: "A passage-theme pairing may indicate thematic development." };
  if (pair.has("verse") && pair.has("theme")) return { key: "develops_theme", weight: 18, detail: "A verse-theme pairing may indicate thematic development." };
  if (pair.has("person") && pair.has("event")) return { key: "participates_in", weight: 18, detail: "A person-event pairing may indicate participation in the event." };
  if (pair.has("place") && pair.has("event")) return { key: "occurs_at", weight: 18, detail: "A place-event pairing may indicate the event occurred at that location." };
  if (pair.has("language_term") && (pair.has("verse") || pair.has("passage"))) return { key: "language_connection", weight: 20, detail: "A language-term and Scripture pairing may indicate a word-study connection." };
  if (pair.has("doctrine") && (pair.has("verse") || pair.has("passage"))) return { key: "supports_doctrine", weight: 20, detail: "A doctrine and Scripture pairing may indicate doctrinal support." };
  if (pair.has("promise") && (pair.has("verse") || pair.has("passage"))) return { key: "contains_promise", weight: 20, detail: "A promise and Scripture pairing may indicate the promise is expressed in the passage." };
  return null;
}

function normalizeReference(reference?: string | null) {
  return reference?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function sameBook(a: string, b: string) {
  const book = (reference: string) => reference.replace(/\d.*$/, "").trim();
  return book(a) !== "" && book(a) === book(b);
}

function buildRationale(
  source: SuggestionNode,
  target: SuggestionNode,
  evidence: ConnectionSuggestion["evidence"],
) {
  const reasons = evidence.map((item) => item.detail).join(" ");
  return `${source.title} and ${target.title} may be connected. ${reasons}`.trim();
}

function confidenceClass(score: number): ConnectionSuggestion["confidence_class"] {
  if (score >= 95) return "explicit";
  if (score >= 85) return "strong";
  if (score >= 65) return "supported";
  if (score >= 40) return "tentative";
  return "disputed";
}

function edgeKey(sourceId: string, targetId: string, relationshipKey: string) {
  return `${sourceId}:${targetId}:${relationshipKey}`;
}
