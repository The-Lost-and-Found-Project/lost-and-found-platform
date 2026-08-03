import { searchKnowledge, getConnectedKnowledge, type KnowledgeNodeType, type ReviewStatus, type Testament } from "@/lib/emmaus/knowledge-graph";
import { buildReasoningPath, type ReasoningIntent } from "@/lib/emmaus/reasoning-engine";
import { routeQuestion } from "@/lib/emmaus/question-router";
import { beginDialogue, continueDialogue, type DialogueDepth, type DialogueState } from "@/lib/emmaus/socratic-dialogue";
import { recommendJourneyStep, type JourneyContext } from "@/lib/emmaus/journey-orchestrator";

export type EmmausSdkScope =
  | "graph:read"
  | "reasoning:read"
  | "questions:route"
  | "dialogue:run"
  | "journey:recommend"
  | "content:read";

export type EmmausSdkClientOptions = {
  organizationId: string;
  apiVersion?: "v1";
  scopes: EmmausSdkScope[];
  audit?: (event: EmmausSdkAuditEvent) => void;
};

export type EmmausSdkAuditEvent = {
  id: string;
  organizationId: string;
  action: string;
  scope: EmmausSdkScope;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type GraphSearchInput = {
  query: string;
  type?: KnowledgeNodeType;
  status?: ReviewStatus;
  testament?: Testament;
};

export class EmmausSdkClient {
  readonly organizationId: string;
  readonly apiVersion: "v1";
  private readonly scopes: Set<EmmausSdkScope>;
  private readonly audit?: (event: EmmausSdkAuditEvent) => void;

  constructor(options: EmmausSdkClientOptions) {
    if (!options.organizationId.trim()) throw new Error("organizationId is required.");
    this.organizationId = options.organizationId;
    this.apiVersion = options.apiVersion ?? "v1";
    this.scopes = new Set(options.scopes);
    this.audit = options.audit;
  }

  graph = {
    search: (input: GraphSearchInput) => {
      this.assertScope("graph:read");
      const result = searchKnowledge(input.query, {
        type: input.type,
        status: input.status,
        testament: input.testament,
      });
      this.record("graph.search", "graph:read", { query: input.query, resultCount: result.length });
      return result;
    },
    connections: (nodeId: string, approvedOnly = true) => {
      this.assertScope("graph:read");
      const result = getConnectedKnowledge(nodeId, { approvedOnly });
      this.record("graph.connections", "graph:read", { nodeId, resultCount: result.length, approvedOnly });
      return result;
    },
  };

  reasoning = {
    buildPath: (sourceNodeId: string, intent: ReasoningIntent, limit = 6) => {
      this.assertScope("reasoning:read");
      const result = buildReasoningPath(sourceNodeId, intent, limit);
      this.record("reasoning.buildPath", "reasoning:read", { sourceNodeId, intent, limit, stepCount: result?.steps.length ?? 0 });
      return result;
    },
  };

  questions = {
    route: (question: string, preferredSourceId?: string) => {
      this.assertScope("questions:route");
      const result = routeQuestion(question, preferredSourceId);
      this.record("questions.route", "questions:route", { preferredSourceId, intent: result.intent, matchedNodeCount: result.matchedNodes.length });
      return result;
    },
  };

  dialogue = {
    begin: (question: string, depth: DialogueDepth = "growing", preferredSourceId?: string) => {
      this.assertScope("dialogue:run");
      const result = beginDialogue(question, depth, preferredSourceId);
      this.record("dialogue.begin", "dialogue:run", { depth, preferredSourceId, move: result.move });
      return result;
    },
    continue: (state: DialogueState, learnerResponse: string) => {
      this.assertScope("dialogue:run");
      const result = continueDialogue(state, learnerResponse);
      this.record("dialogue.continue", "dialogue:run", { move: result.move, responseLength: learnerResponse.length });
      return result;
    },
  };

  journey = {
    recommend: (context: JourneyContext) => {
      this.assertScope("journey:recommend");
      if (context.learnerId !== this.organizationId && !context.learnerId.startsWith(`${this.organizationId}:`)) {
        throw new Error("Journey context is outside this organization's scope.");
      }
      const result = recommendJourneyStep(context);
      this.record("journey.recommend", "journey:recommend", { learnerId: context.learnerId, primaryId: result.primary?.id ?? null });
      return result;
    },
  };

  private assertScope(scope: EmmausSdkScope) {
    if (!this.scopes.has(scope)) throw new Error(`Missing SDK scope: ${scope}`);
  }

  private record(action: string, scope: EmmausSdkScope, metadata?: Record<string, unknown>) {
    this.audit?.({
      id: randomId(),
      organizationId: this.organizationId,
      action,
      scope,
      occurredAt: new Date().toISOString(),
      metadata,
    });
  }
}

export function createEmmausSdkClient(options: EmmausSdkClientOptions) {
  return new EmmausSdkClient(options);
}

export const EMMAUS_SDK_VERSION = "1.0.0-alpha.1";

function randomId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
