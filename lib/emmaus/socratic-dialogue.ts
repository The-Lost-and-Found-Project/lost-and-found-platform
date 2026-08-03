import { routeQuestion, type QuestionRoute } from "@/lib/emmaus/question-router";
import { type ReasoningIntent, type ReasoningPath } from "@/lib/emmaus/reasoning-engine";

export type DialogueDepth = "foundational" | "growing" | "deep" | "guide";
export type DialogueMove = "observe" | "clarify" | "connect" | "probe" | "test" | "reflect" | "apply" | "summarize";

export type DialogueTurn = {
  id: string;
  speaker: "guide" | "learner";
  text: string;
  move?: DialogueMove;
  createdAt: string;
};

export type DialogueState = {
  question: string;
  route: QuestionRoute;
  depth: DialogueDepth;
  turns: DialogueTurn[];
  completedMoves: DialogueMove[];
  currentMove: DialogueMove;
  learnerEvidence: {
    observations: string[];
    connections: string[];
    conclusions: string[];
    applications: string[];
    unresolved: string[];
  };
};

export type DialogueResponse = {
  state: DialogueState;
  nextQuestion: string;
  move: DialogueMove;
  rationale: string;
  clue?: string;
  sourceReferences: string[];
  shouldOfferExplanation: boolean;
};

const moveOrder: Record<ReasoningIntent, DialogueMove[]> = {
  observe: ["observe", "clarify", "probe", "summarize", "apply"],
  connect: ["observe", "connect", "probe", "test", "summarize", "apply"],
  context: ["observe", "clarify", "connect", "test", "summarize", "apply"],
  theology: ["observe", "clarify", "connect", "probe", "test", "summarize", "apply"],
  "word-study": ["observe", "clarify", "connect", "test", "summarize", "apply"],
  person: ["observe", "clarify", "connect", "reflect", "summarize", "apply"],
  event: ["observe", "clarify", "connect", "reflect", "summarize", "apply"],
  trail: ["observe", "connect", "probe", "reflect", "summarize", "apply"],
};

export function beginDialogue(question: string, depth: DialogueDepth = "growing", preferredSourceId?: string): DialogueResponse {
  const route = routeQuestion(question, preferredSourceId);
  const firstMove = chooseFirstMove(route);
  const state: DialogueState = {
    question,
    route,
    depth,
    turns: [],
    completedMoves: [],
    currentMove: firstMove,
    learnerEvidence: { observations: [], connections: [], conclusions: [], applications: [], unresolved: [] },
  };
  return buildGuideResponse(state, firstMove, "The dialogue begins with the earliest useful discovery move rather than an explanation.");
}

export function continueDialogue(state: DialogueState, learnerResponse: string): DialogueResponse {
  const learnerTurn: DialogueTurn = {
    id: `learner-${Date.now()}`,
    speaker: "learner",
    text: learnerResponse.trim(),
    createdAt: new Date().toISOString(),
  };

  const analyzed = analyzeResponse(learnerResponse, state.currentMove, state.route.reasoningPath);
  const evidence = mergeEvidence(state.learnerEvidence, analyzed);
  const completedMoves = learnerResponse.trim().length > 0
    ? [...new Set([...state.completedMoves, state.currentMove])]
    : state.completedMoves;
  const nextMove = chooseNextMove({ ...state, learnerEvidence: evidence, completedMoves }, analyzed);
  const nextState: DialogueState = {
    ...state,
    turns: [...state.turns, learnerTurn],
    learnerEvidence: evidence,
    completedMoves,
    currentMove: nextMove,
  };

  return buildGuideResponse(nextState, nextMove, explainMoveChoice(nextMove, analyzed, nextState));
}

function chooseFirstMove(route: QuestionRoute): DialogueMove {
  if (!route.sourceNode || route.intentConfidence < 0.5) return "clarify";
  return "observe";
}

function chooseNextMove(state: DialogueState, analysis: ReturnType<typeof analyzeResponse>): DialogueMove {
  if (!state.route.sourceNode || state.route.intentConfidence < 0.5) return "clarify";
  if (analysis.empty) return state.currentMove;
  if (analysis.vague && state.currentMove !== "clarify") return "clarify";
  if (analysis.unsupportedConclusion && state.currentMove !== "test") return "test";

  const sequence = moveOrder[state.route.intent];
  const currentIndex = sequence.indexOf(state.currentMove);
  const remaining = sequence.slice(Math.max(0, currentIndex + 1));
  return remaining.find((move) => !state.completedMoves.includes(move)) ?? "summarize";
}

function buildGuideResponse(state: DialogueState, move: DialogueMove, rationale: string): DialogueResponse {
  const path = state.route.reasoningPath;
  const nextQuestion = questionForMove(move, state.depth, state.route, path, state.learnerEvidence);
  const clue = clueForMove(move, state.route, path);
  const sourceReferences = collectSources(path, move);
  const guideTurn: DialogueTurn = {
    id: `guide-${Date.now()}-${move}`,
    speaker: "guide",
    text: nextQuestion,
    move,
    createdAt: new Date().toISOString(),
  };

  return {
    state: { ...state, turns: [...state.turns, guideTurn] },
    nextQuestion,
    move,
    rationale,
    clue,
    sourceReferences,
    shouldOfferExplanation: move === "summarize" && state.learnerEvidence.conclusions.length > 0,
  };
}

function questionForMove(move: DialogueMove, depth: DialogueDepth, route: QuestionRoute, path: ReasoningPath | null, evidence: DialogueState["learnerEvidence"]) {
  const source = route.sourceNode?.label ?? "the passage";
  const primary = path?.steps[0];
  const secondary = path?.steps[1];

  if (move === "clarify") {
    const options = route.matchedNodes.slice(0, 3).map((match) => match.node.label);
    return options.length
      ? `Which starting point best matches your question: ${options.join(", ")}? What are you specifically trying to understand?`
      : `What passage, person, word, or theme are you asking about? Restate the question with one specific biblical reference if possible.`;
  }

  if (move === "observe") {
    if (depth === "foundational") return `Before explaining ${source}, what words or claims do you notice directly in the text?`;
    if (depth === "guide") return `What sequence of observations would help another learner discover the central claim of ${source} without being told first?`;
    return `Read ${source} closely. Which words, repetitions, contrasts, or relationships must be noticed before interpretation begins?`;
  }

  if (move === "connect") {
    return primary
      ? `Compare ${source} with ${primary.node.label}. What does the second passage add, confirm, or clarify—and what does it not prove by itself?`
      : `Where else in Scripture do you see the same wording, event, person, or theme developed?`;
  }

  if (move === "probe") {
    const conclusion = evidence.conclusions.at(-1);
    return conclusion
      ? `You concluded, “${conclusion}.” Which exact words in the passage require that conclusion, and which parts are inference?`
      : `What conclusion is the wording pushing you toward, and which clause carries the most weight?`;
  }

  if (move === "test") {
    return secondary
      ? `Test your conclusion against ${secondary.node.label}. Does it strengthen, limit, or correct your reading? Explain from the text.`
      : `What alternative interpretation could someone propose, and which textual evidence best tests it?`;
  }

  if (move === "reflect") return `What does this reveal about God, Christ, humanity, or faithful discipleship before you move to personal application?`;
  if (move === "apply") return `If your conclusion is true, what belief, habit, fear, relationship, or act of obedience should change? Be specific.`;
  return `Summarize what you have discovered in one clear statement, name the strongest supporting passage, and preserve one unresolved question.`;
}

function clueForMove(move: DialogueMove, route: QuestionRoute, path: ReasoningPath | null) {
  if (move === "observe") return "Stay inside the wording before reaching for a commentary or conclusion.";
  if (move === "connect" && path?.steps[0]) return path.steps[0].edge.explanation;
  if (move === "test") return "A strong conclusion should survive comparison with the wider witness of Scripture.";
  if (move === "clarify" && route.unresolvedTerms.length) return `Terms not yet mapped: ${route.unresolvedTerms.join(", ")}.`;
  if (move === "apply") return "Application should flow from the discovered truth, not replace careful interpretation.";
  return undefined;
}

function analyzeResponse(response: string, move: DialogueMove, path: ReasoningPath | null) {
  const normalized = response.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const referencePattern = /\b(?:genesis|exodus|psalms?|isaiah|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|hebrews|james|peter|revelation)\s+\d+(?::\d+)?/i;
  const explicitTerms = path?.steps.flatMap((step) => [step.node.label.toLowerCase(), step.edge.relationship.toLowerCase()]) ?? [];
  const mentionsPath = explicitTerms.some((term) => normalized.includes(term));
  const hasReference = referencePattern.test(response);
  const conclusionMarkers = ["therefore", "this means", "i think", "shows that", "reveals that", "conclude"];
  const applicationMarkers = ["i need", "i should", "obey", "change", "trust", "pray", "forgive", "serve"];

  return {
    empty: words.length === 0,
    vague: words.length > 0 && words.length < 6,
    hasReference,
    mentionsPath,
    observation: move === "observe" && words.length >= 6 ? response.trim() : null,
    connection: move === "connect" && (hasReference || mentionsPath) ? response.trim() : null,
    conclusion: conclusionMarkers.some((marker) => normalized.includes(marker)) || ["probe", "test", "reflect", "summarize"].includes(move) ? response.trim() : null,
    application: move === "apply" || applicationMarkers.some((marker) => normalized.includes(marker)) ? response.trim() : null,
    unsupportedConclusion: ["probe", "test", "reflect", "summarize"].includes(move) && !hasReference && !mentionsPath && words.length > 8,
    unresolved: response.includes("?") || normalized.includes("not sure") ? response.trim() : null,
  };
}

function mergeEvidence(current: DialogueState["learnerEvidence"], analysis: ReturnType<typeof analyzeResponse>) {
  return {
    observations: analysis.observation ? [...current.observations, analysis.observation] : current.observations,
    connections: analysis.connection ? [...current.connections, analysis.connection] : current.connections,
    conclusions: analysis.conclusion ? [...current.conclusions, analysis.conclusion] : current.conclusions,
    applications: analysis.application ? [...current.applications, analysis.application] : current.applications,
    unresolved: analysis.unresolved ? [...current.unresolved, analysis.unresolved] : current.unresolved,
  };
}

function explainMoveChoice(move: DialogueMove, analysis: ReturnType<typeof analyzeResponse>, state: DialogueState) {
  if (analysis.empty) return "The learner has not supplied evidence yet, so the engine repeats the current discovery move.";
  if (analysis.vague) return "The response is too brief to establish understanding, so the engine asks for clarification rather than assuming intent.";
  if (analysis.unsupportedConclusion) return "A conclusion was stated without visible textual support, so the engine asks the learner to test it against Scripture.";
  return `The learner supplied enough evidence to advance from the prior move to ${move}. Completed moves: ${state.completedMoves.join(", ") || "none"}.`;
}

function collectSources(path: ReasoningPath | null, move: DialogueMove) {
  if (!path || !["connect", "test", "summarize"].includes(move)) return [];
  return [...new Set(path.steps.slice(0, move === "connect" ? 1 : 3).flatMap((step) => step.evidence))];
}
