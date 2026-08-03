import { routeQuestion, type QuestionRoute } from "@/lib/emmaus/question-router";
import { recommendJourneyStep, type JourneyContext } from "@/lib/emmaus/journey-orchestrator";
import { beginDialogue, continueDialogue, type DialogueDepth, type DialogueResponse, type DialogueState } from "@/lib/emmaus/socratic-dialogue";

export type IntelligenceMode = "rules" | "ai";

export type IntelligenceFeature =
  | "question-routing"
  | "dialogue"
  | "journey-recommendation"
  | "dynamic-rephrasing"
  | "freeform-summary";

export type IntelligenceCapabilities = Record<IntelligenceFeature, boolean>;

export type IntelligenceAuditEvent = {
  id: string;
  mode: IntelligenceMode;
  action: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type IntelligenceLayerOptions = {
  mode?: IntelligenceMode;
  aiAdapter?: EmmausAiAdapter;
  audit?: (event: IntelligenceAuditEvent) => void;
};

export type AiQuestionRoutingInput = {
  question: string;
  preferredSourceId?: string;
};

export type AiDialogueInput = {
  question: string;
  depth: DialogueDepth;
  preferredSourceId?: string;
};

export type AiJourneyInput = JourneyContext;

export interface EmmausAiAdapter {
  name: string;
  capabilities: Partial<IntelligenceCapabilities>;
  routeQuestion?: (input: AiQuestionRoutingInput) => Promise<QuestionRoute>;
  beginDialogue?: (input: AiDialogueInput) => Promise<DialogueResponse>;
  continueDialogue?: (state: DialogueState, learnerResponse: string) => Promise<DialogueResponse>;
  recommendJourney?: (context: AiJourneyInput) => Promise<ReturnType<typeof recommendJourneyStep>>;
}

export interface EmmausIntelligenceEngine {
  readonly mode: IntelligenceMode;
  readonly capabilities: IntelligenceCapabilities;
  routeQuestion(question: string, preferredSourceId?: string): Promise<QuestionRoute>;
  beginDialogue(question: string, depth?: DialogueDepth, preferredSourceId?: string): Promise<DialogueResponse>;
  continueDialogue(state: DialogueState, learnerResponse: string): Promise<DialogueResponse>;
  recommendJourney(context: JourneyContext): Promise<ReturnType<typeof recommendJourneyStep>>;
}

const rulesCapabilities: IntelligenceCapabilities = {
  "question-routing": true,
  dialogue: true,
  "journey-recommendation": true,
  "dynamic-rephrasing": false,
  "freeform-summary": false,
};

class RulesIntelligenceEngine implements EmmausIntelligenceEngine {
  readonly mode = "rules" as const;
  readonly capabilities = rulesCapabilities;

  constructor(private readonly audit?: (event: IntelligenceAuditEvent) => void) {}

  async routeQuestion(question: string, preferredSourceId?: string) {
    const result = routeQuestion(question, preferredSourceId);
    this.record("route-question", { intent: result.intent, sourceNodeId: result.sourceNode?.id ?? null });
    return result;
  }

  async beginDialogue(question: string, depth: DialogueDepth = "growing", preferredSourceId?: string) {
    const result = beginDialogue(question, depth, preferredSourceId);
    this.record("begin-dialogue", { depth, move: result.move });
    return result;
  }

  async continueDialogue(state: DialogueState, learnerResponse: string) {
    const result = continueDialogue(state, learnerResponse);
    this.record("continue-dialogue", { move: result.move, responseLength: learnerResponse.length });
    return result;
  }

  async recommendJourney(context: JourneyContext) {
    const result = recommendJourneyStep(context);
    this.record("recommend-journey", { learnerId: context.learnerId, primaryId: result.primary?.id ?? null });
    return result;
  }

  private record(action: string, metadata?: Record<string, unknown>) {
    this.audit?.({ id: randomId(), mode: this.mode, action, occurredAt: new Date().toISOString(), metadata });
  }
}

class AiEnhancedIntelligenceEngine implements EmmausIntelligenceEngine {
  readonly mode = "ai" as const;
  readonly capabilities: IntelligenceCapabilities;

  constructor(
    private readonly adapter: EmmausAiAdapter,
    private readonly fallback: RulesIntelligenceEngine,
    private readonly audit?: (event: IntelligenceAuditEvent) => void,
  ) {
    this.capabilities = { ...rulesCapabilities, ...adapter.capabilities };
  }

  async routeQuestion(question: string, preferredSourceId?: string) {
    if (!this.adapter.routeQuestion) return this.fallback.routeQuestion(question, preferredSourceId);
    const result = await this.adapter.routeQuestion({ question, preferredSourceId });
    this.record("route-question", { adapter: this.adapter.name, intent: result.intent });
    return result;
  }

  async beginDialogue(question: string, depth: DialogueDepth = "growing", preferredSourceId?: string) {
    if (!this.adapter.beginDialogue) return this.fallback.beginDialogue(question, depth, preferredSourceId);
    const result = await this.adapter.beginDialogue({ question, depth, preferredSourceId });
    this.record("begin-dialogue", { adapter: this.adapter.name, move: result.move });
    return result;
  }

  async continueDialogue(state: DialogueState, learnerResponse: string) {
    if (!this.adapter.continueDialogue) return this.fallback.continueDialogue(state, learnerResponse);
    const result = await this.adapter.continueDialogue(state, learnerResponse);
    this.record("continue-dialogue", { adapter: this.adapter.name, move: result.move });
    return result;
  }

  async recommendJourney(context: JourneyContext) {
    if (!this.adapter.recommendJourney) return this.fallback.recommendJourney(context);
    const result = await this.adapter.recommendJourney(context);
    this.record("recommend-journey", { adapter: this.adapter.name, primaryId: result.primary?.id ?? null });
    return result;
  }

  private record(action: string, metadata?: Record<string, unknown>) {
    this.audit?.({ id: randomId(), mode: this.mode, action, occurredAt: new Date().toISOString(), metadata });
  }
}

export function createEmmausIntelligenceLayer(options: IntelligenceLayerOptions = {}): EmmausIntelligenceEngine {
  const rules = new RulesIntelligenceEngine(options.audit);
  if (options.mode !== "ai") return rules;
  if (!options.aiAdapter) return rules;
  return new AiEnhancedIntelligenceEngine(options.aiAdapter, rules, options.audit);
}

export const defaultEmmausIntelligence = createEmmausIntelligenceLayer({ mode: "rules" });

export function getIntelligenceStatus(engine: EmmausIntelligenceEngine) {
  return {
    mode: engine.mode,
    productionReady: engine.mode === "rules",
    capabilities: engine.capabilities,
    message: engine.mode === "rules"
      ? "Emmaus is operating in rules-first mode with deterministic, reviewable behavior and no AI dependency."
      : "Emmaus is operating with an optional AI adapter and deterministic fallback.",
  };
}

function randomId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
