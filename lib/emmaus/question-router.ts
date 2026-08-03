import { buildReasoningPath, type ReasoningIntent, type ReasoningPath } from "@/lib/emmaus/reasoning-engine";
import { knowledgeNodes, type KnowledgeNode } from "@/lib/emmaus/knowledge-graph";

export type QuestionRoute = {
  question: string;
  normalizedQuestion: string;
  sourceNode: KnowledgeNode | null;
  matchedNodes: Array<{ node: KnowledgeNode; score: number; reasons: string[] }>;
  intent: ReasoningIntent;
  intentConfidence: number;
  reasoningPath: ReasoningPath | null;
  explanation: string;
  unresolvedTerms: string[];
  guardrails: string[];
};

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "by", "did", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me", "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "which", "who", "why", "with",
]);

const intentRules: Array<{ intent: ReasoningIntent; terms: string[]; weight: number }> = [
  { intent: "word-study", terms: ["word", "greek", "hebrew", "means", "meaning", "logos", "arche", "translate", "translation"], weight: 5 },
  { intent: "theology", terms: ["god", "divine", "trinity", "doctrine", "deity", "jesus", "son", "holy spirit", "believe"], weight: 4 },
  { intent: "context", terms: ["culture", "historical", "history", "audience", "background", "custom", "roman", "jewish", "samaritan"], weight: 4 },
  { intent: "person", terms: ["who", "person", "john", "jesus", "moses", "david", "paul", "peter"], weight: 3 },
  { intent: "event", terms: ["happened", "event", "creation", "incarnation", "resurrection", "exodus", "crucifixion"], weight: 3 },
  { intent: "trail", terms: ["explore", "rabbit trail", "follow", "deeper", "study path"], weight: 3 },
  { intent: "connect", terms: ["connect", "connection", "echo", "compare", "elsewhere", "cross reference", "genesis", "old testament", "new testament"], weight: 3 },
  { intent: "observe", terms: ["notice", "observe", "repeated", "phrase", "clause", "say", "says", "text"], weight: 2 },
];

export function routeQuestion(question: string, preferredSourceId?: string): QuestionRoute {
  const normalizedQuestion = normalize(question);
  const tokens = tokenize(normalizedQuestion);
  const intentResult = detectIntent(normalizedQuestion, tokens);
  const matches = rankNodes(normalizedQuestion, tokens);
  const sourceNode = preferredSourceId
    ? knowledgeNodes.find((node) => node.id === preferredSourceId) ?? matches[0]?.node ?? null
    : matches[0]?.node ?? null;
  const reasoningPath = sourceNode ? buildReasoningPath(sourceNode.id, intentResult.intent) : null;
  const matchedTerms = new Set(matches.flatMap((match) => match.reasons.map((reason) => reason.replace(/^matched /, ""))));
  const unresolvedTerms = tokens.filter((token) => token.length > 3 && ![...matchedTerms].some((term) => term.includes(token)));

  return {
    question,
    normalizedQuestion,
    sourceNode,
    matchedNodes: matches.slice(0, 5),
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    reasoningPath,
    explanation: explainRoute(sourceNode, intentResult.intent, matches, reasoningPath),
    unresolvedTerms: [...new Set(unresolvedTerms)].slice(0, 8),
    guardrails: [
      "The router identifies a study path, not a final theological answer.",
      "Only curated nodes and reviewed relationships can enter the reasoning path.",
      "Low-confidence routing should ask the learner to choose between plausible starting points.",
      "Unknown terms remain visible rather than being silently guessed.",
    ],
  };
}

export function suggestClarifyingChoices(question: string) {
  const route = routeQuestion(question);
  if (route.intentConfidence >= 0.7 && route.matchedNodes[0]?.score >= 12) return [];

  return route.matchedNodes.slice(0, 3).map(({ node }) => ({
    label: node.label,
    nodeId: node.id,
    prompt: `Do you want to explore your question beginning with ${node.label}?`,
  }));
}

function detectIntent(normalizedQuestion: string, tokens: string[]) {
  const scores = new Map<ReasoningIntent, number>();
  intentRules.forEach((rule) => {
    const score = rule.terms.reduce((sum, term) => {
      const matched = term.includes(" ") ? normalizedQuestion.includes(term) : tokens.includes(term);
      return sum + (matched ? rule.weight : 0);
    }, 0);
    scores.set(rule.intent, score);
  });

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [intent, topScore] = ranked[0] ?? ["connect", 0];
  const secondScore = ranked[1]?.[1] ?? 0;
  const confidence = topScore === 0 ? 0.35 : Math.min(1, 0.55 + (topScore - secondScore) * 0.08 + topScore * 0.03);
  return { intent, confidence };
}

function rankNodes(normalizedQuestion: string, tokens: string[]) {
  return knowledgeNodes
    .map((node) => {
      let score = 0;
      const reasons: string[] = [];
      const searchable = [node.label, node.reference, node.book, ...(node.tags ?? [])].filter(Boolean).map((value) => String(value).toLowerCase());

      searchable.forEach((field) => {
        if (normalizedQuestion.includes(field)) {
          score += field === node.label.toLowerCase() || field === node.reference?.toLowerCase() ? 15 : 8;
          reasons.push(`matched ${field}`);
        }
      });

      tokens.forEach((token) => {
        const fields = [node.label, node.description, node.reference, node.book, ...(node.tags ?? [])].filter(Boolean).map((value) => String(value).toLowerCase());
        if (fields.some((field) => field.split(/[^a-z0-9]+/).includes(token))) {
          score += token.length >= 7 ? 4 : 2;
          reasons.push(`matched ${token}`);
        }
      });

      if (node.status === "approved") score += 3;
      else if (node.status === "reviewed") score += 1;

      return { node, score, reasons: [...new Set(reasons)] };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}

function explainRoute(sourceNode: KnowledgeNode | null, intent: ReasoningIntent, matches: Array<{ node: KnowledgeNode; score: number }>, path: ReasoningPath | null) {
  if (!sourceNode) return "Emmaus could not map this question to a curated starting point yet. The question should be preserved for founder review instead of answered by guessing.";
  const alternatives = matches.slice(1, 3).map((match) => match.node.label);
  const alternativeText = alternatives.length ? ` Other plausible starting points are ${alternatives.join(" and ")}.` : "";
  const pathText = path?.steps.length ? ` The graph currently provides ${path.steps.length} reviewed ${intent} connection${path.steps.length === 1 ? "" : "s"}.` : ` No reviewed ${intent} path is available yet.`;
  return `Emmaus routed the question to ${sourceNode.label} with a ${intent} intent.${pathText}${alternativeText}`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9:'\-\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return value.split(" ").map((token) => token.replace(/^[':-]+|[':-]+$/g, "")).filter((token) => token.length > 1 && !stopWords.has(token));
}
