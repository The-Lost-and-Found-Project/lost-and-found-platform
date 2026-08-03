import { nextDiscoveries, type TraversalEdge, type TraversalNode } from "@/lib/emmaus/graphTraversal";

export type LearnerProfile = {
  visitedNodeIds: string[];
  completedRelationshipKeys: string[];
  preferredNodeTypes?: string[];
  difficulty: "explorer" | "growing" | "deep" | "mentor";
  earnedXp: number;
};

export type PathGoal = {
  title: string;
  targetNodeTypes?: string[];
  preferredRelationshipKeys?: string[];
  excludedRelationshipKeys?: string[];
};

export type AdaptiveCandidate = {
  node: TraversalNode;
  relationship: string;
  confidence: number;
  baseScore: number;
  adaptiveScore: number;
  reasons: string[];
};

export function chooseAdaptiveNext({
  currentNodeId,
  nodes,
  edges,
  learner,
  goal,
  limit = 3,
}: {
  currentNodeId: string;
  nodes: TraversalNode[];
  edges: TraversalEdge[];
  learner: LearnerProfile;
  goal: PathGoal;
  limit?: number;
}): AdaptiveCandidate[] {
  const visited = new Set(learner.visitedNodeIds);
  const completedRelationships = new Set(learner.completedRelationshipKeys);
  const preferredTypes = new Set(learner.preferredNodeTypes ?? []);
  const targetTypes = new Set(goal.targetNodeTypes ?? []);
  const preferredRelationships = new Set(goal.preferredRelationshipKeys ?? []);
  const excludedRelationships = new Set(goal.excludedRelationshipKeys ?? []);

  return nextDiscoveries(currentNodeId, edges, nodes, Math.max(limit * 4, 12))
    .filter((candidate): candidate is typeof candidate & { node: TraversalNode } => Boolean(candidate.node))
    .filter((candidate) => !excludedRelationships.has(candidate.relationship))
    .filter((candidate) => !visited.has(candidate.node.id))
    .map((candidate) => {
      let adaptiveScore = candidate.score;
      const reasons: string[] = [
        `${candidate.confidence}% relationship confidence`,
      ];

      if (preferredRelationships.has(candidate.relationship)) {
        adaptiveScore += 250;
        reasons.push("Matches the current learning objective");
      }

      if (targetTypes.has(candidate.node.nodeType)) {
        adaptiveScore += 175;
        reasons.push(`Advances toward a ${candidate.node.nodeType.replaceAll("_", " ")} discovery`);
      }

      if (preferredTypes.has(candidate.node.nodeType)) {
        adaptiveScore += 80;
        reasons.push("Matches the learner's demonstrated interests");
      }

      if (completedRelationships.has(candidate.relationship)) {
        adaptiveScore -= 90;
        reasons.push("Reduced to encourage a different kind of connection");
      } else {
        adaptiveScore += 45;
        reasons.push("Introduces a less-explored relationship type");
      }

      const difficultyAdjustment = getDifficultyAdjustment(
        learner.difficulty,
        candidate.node.nodeType,
        candidate.confidence,
      );
      adaptiveScore += difficultyAdjustment.score;
      if (difficultyAdjustment.reason) reasons.push(difficultyAdjustment.reason);

      if (learner.earnedXp < 250 && candidate.confidence < 65) {
        adaptiveScore -= 120;
        reasons.push("Lowered because the connection may be too ambiguous for an early learner");
      }

      return {
        node: candidate.node,
        relationship: candidate.relationship,
        confidence: candidate.confidence,
        baseScore: candidate.score,
        adaptiveScore,
        reasons,
      };
    })
    .sort((a, b) => b.adaptiveScore - a.adaptiveScore)
    .slice(0, limit);
}

export function chooseAdaptiveNextNode(args: Parameters<typeof chooseAdaptiveNext>[0]) {
  return chooseAdaptiveNext(args)[0] ?? null;
}

export function explainAdaptiveChoice(candidate: AdaptiveCandidate, goal: PathGoal) {
  return `Emmaus recommends ${candidate.node.title} for “${goal.title}” through a ${candidate.relationship.replaceAll("_", " ")} connection. ${candidate.reasons.join(". ")}.`;
}

function getDifficultyAdjustment(
  difficulty: LearnerProfile["difficulty"],
  nodeType: string,
  confidence: number,
) {
  const advancedTypes = new Set(["doctrine", "language_term", "covenant", "prophecy", "typology"]);
  const isAdvanced = advancedTypes.has(nodeType);

  if (difficulty === "explorer") {
    if (isAdvanced) return { score: -100, reason: "Reduced to keep the next step accessible" };
    if (confidence >= 85) return { score: 70, reason: "Strong, accessible connection for an Explorer" };
  }

  if (difficulty === "growing") {
    if (isAdvanced && confidence >= 75) return { score: 40, reason: "Adds depth without excessive ambiguity" };
  }

  if (difficulty === "deep") {
    if (isAdvanced) return { score: 120, reason: "Prioritized for deeper theological exploration" };
    if (confidence < 65) return { score: 25, reason: "Allows a carefully framed interpretive challenge" };
  }

  if (difficulty === "mentor") {
    if (isAdvanced) return { score: 150, reason: "Supports mentor-level discussion and teaching" };
    return { score: 35, reason: "Useful for guided discussion" };
  }

  return { score: 0, reason: "" };
}
