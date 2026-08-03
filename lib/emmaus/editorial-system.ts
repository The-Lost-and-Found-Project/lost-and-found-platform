export type ContributorRole = "researcher" | "linguist" | "historian" | "theologian" | "pastor" | "editor" | "reviewer" | "admin";
export type ProposalKind = "node" | "relationship" | "lexical-note" | "historical-context" | "theological-note" | "curriculum" | "correction";
export type ProposalStatus = "draft" | "submitted" | "in-review" | "changes-requested" | "approved" | "rejected" | "published" | "rolled-back";
export type ReviewDecision = "approve" | "request-changes" | "reject";

export type ContributorProfile = {
  id: string;
  displayName: string;
  roles: ContributorRole[];
  expertise: string[];
  organization?: string;
  biography?: string;
  verifiedAt?: string;
  conflicts: string[];
  active: boolean;
};

export type EditorialSource = {
  id: string;
  kind: "scripture" | "lexicon" | "primary-history" | "peer-reviewed" | "commentary" | "confession" | "internal";
  citation: string;
  url?: string;
  note?: string;
  requiredForApproval: boolean;
};

export type EditorialReview = {
  id: string;
  reviewerId: string;
  decision: ReviewDecision;
  comments: string;
  createdAt: string;
  expertiseUsed: string[];
  conflictDeclared: boolean;
};

export type EditorialVersion = {
  version: number;
  createdAt: string;
  createdBy: string;
  summary: string;
  payload: unknown;
  status: ProposalStatus;
};

export type EditorialProposal = {
  id: string;
  kind: ProposalKind;
  title: string;
  summary: string;
  authorId: string;
  status: ProposalStatus;
  confidence: "explicit" | "strong" | "inferred";
  targetLayer: "canon" | "language" | "historical-world" | "theology" | "narrative" | "discipleship" | "church-history";
  payload: unknown;
  sources: EditorialSource[];
  reviews: EditorialReview[];
  versions: EditorialVersion[];
  createdAt: string;
  updatedAt: string;
  publishedVersion?: number;
  rollbackOfVersion?: number;
  releaseNote?: string;
};

export type EditorialPolicy = {
  minimumApprovals: number;
  requiredReviewerRoles: ContributorRole[];
  requireScriptureSource: boolean;
  requireConflictDeclaration: boolean;
  allowSelfApproval: boolean;
};

export const editorialPolicies: Record<ProposalKind, EditorialPolicy> = {
  node: { minimumApprovals: 2, requiredReviewerRoles: ["editor"], requireScriptureSource: false, requireConflictDeclaration: true, allowSelfApproval: false },
  relationship: { minimumApprovals: 2, requiredReviewerRoles: ["theologian", "editor"], requireScriptureSource: true, requireConflictDeclaration: true, allowSelfApproval: false },
  "lexical-note": { minimumApprovals: 2, requiredReviewerRoles: ["linguist", "editor"], requireScriptureSource: true, requireConflictDeclaration: true, allowSelfApproval: false },
  "historical-context": { minimumApprovals: 2, requiredReviewerRoles: ["historian", "editor"], requireScriptureSource: false, requireConflictDeclaration: true, allowSelfApproval: false },
  "theological-note": { minimumApprovals: 2, requiredReviewerRoles: ["theologian", "editor"], requireScriptureSource: true, requireConflictDeclaration: true, allowSelfApproval: false },
  curriculum: { minimumApprovals: 2, requiredReviewerRoles: ["pastor", "editor"], requireScriptureSource: true, requireConflictDeclaration: true, allowSelfApproval: false },
  correction: { minimumApprovals: 1, requiredReviewerRoles: ["editor"], requireScriptureSource: false, requireConflictDeclaration: true, allowSelfApproval: false },
};

export function createProposal(input: Omit<EditorialProposal, "id" | "status" | "reviews" | "versions" | "createdAt" | "updatedAt">): EditorialProposal {
  const now = new Date().toISOString();
  const proposal: EditorialProposal = {
    ...input,
    id: `proposal-${randomId()}`,
    status: "draft",
    reviews: [],
    versions: [],
    createdAt: now,
    updatedAt: now,
  };
  return addVersion(proposal, input.authorId, "Initial proposal created.", input.payload, "draft");
}

export function submitProposal(proposal: EditorialProposal): EditorialProposal {
  const validation = validateProposal(proposal);
  if (!validation.valid) throw new Error(`Proposal cannot be submitted: ${validation.errors.join("; ")}`);
  return { ...proposal, status: "submitted", updatedAt: new Date().toISOString() };
}

export function beginReview(proposal: EditorialProposal): EditorialProposal {
  if (!['submitted','changes-requested'].includes(proposal.status)) throw new Error("Only submitted proposals can enter review.");
  return { ...proposal, status: "in-review", updatedAt: new Date().toISOString() };
}

export function addReview(proposal: EditorialProposal, review: Omit<EditorialReview, "id" | "createdAt">, contributors: ContributorProfile[]): EditorialProposal {
  const reviewer = contributors.find((item) => item.id === review.reviewerId);
  if (!reviewer || !reviewer.active) throw new Error("Reviewer is not active.");
  const policy = editorialPolicies[proposal.kind];
  if (!policy.allowSelfApproval && proposal.authorId === review.reviewerId) throw new Error("Authors cannot approve their own proposal.");
  if (policy.requireConflictDeclaration && !review.conflictDeclared) throw new Error("Conflict declaration is required.");
  const nextReview: EditorialReview = { ...review, id: `review-${randomId()}`, createdAt: new Date().toISOString() };
  const next = { ...proposal, reviews: [...proposal.reviews, nextReview], updatedAt: new Date().toISOString() };
  if (review.decision === "request-changes") return { ...next, status: "changes-requested" };
  if (review.decision === "reject") return { ...next, status: "rejected" };
  return next;
}

export function approveProposal(proposal: EditorialProposal, contributors: ContributorProfile[]): EditorialProposal {
  const gate = evaluateApprovalGate(proposal, contributors);
  if (!gate.ready) throw new Error(`Approval gate not satisfied: ${gate.reasons.join("; ")}`);
  return { ...proposal, status: "approved", updatedAt: new Date().toISOString() };
}

export function publishProposal(proposal: EditorialProposal, releaseNote: string): EditorialProposal {
  if (proposal.status !== "approved") throw new Error("Only approved proposals can be published.");
  const version = proposal.versions.at(-1)?.version;
  return { ...proposal, status: "published", publishedVersion: version, releaseNote, updatedAt: new Date().toISOString() };
}

export function reviseProposal(proposal: EditorialProposal, authorId: string, summary: string, payload: unknown): EditorialProposal {
  const revised = addVersion({ ...proposal, status: "draft", reviews: [], updatedAt: new Date().toISOString() }, authorId, summary, payload, "draft");
  return { ...revised, payload };
}

export function rollbackProposal(proposal: EditorialProposal, version: number, actorId: string, reason: string): EditorialProposal {
  const target = proposal.versions.find((item) => item.version === version);
  if (!target) throw new Error("Rollback version not found.");
  const rolled = addVersion({ ...proposal, status: "rolled-back", rollbackOfVersion: version }, actorId, `Rollback: ${reason}`, target.payload, "rolled-back");
  return { ...rolled, payload: target.payload, publishedVersion: undefined, updatedAt: new Date().toISOString() };
}

export function evaluateApprovalGate(proposal: EditorialProposal, contributors: ContributorProfile[]) {
  const policy = editorialPolicies[proposal.kind];
  const approvals = proposal.reviews.filter((review) => review.decision === "approve");
  const approvingReviewers = approvals.map((review) => contributors.find((item) => item.id === review.reviewerId)).filter(Boolean) as ContributorProfile[];
  const reasons: string[] = [];
  if (approvals.length < policy.minimumApprovals) reasons.push(`requires ${policy.minimumApprovals} approvals`);
  policy.requiredReviewerRoles.forEach((role) => {
    if (!approvingReviewers.some((reviewer) => reviewer.roles.includes(role))) reasons.push(`missing approval from ${role}`);
  });
  if (policy.requireScriptureSource && !proposal.sources.some((source) => source.kind === "scripture")) reasons.push("missing Scripture source");
  if (proposal.sources.some((source) => source.requiredForApproval && !source.citation.trim())) reasons.push("required source citation is incomplete");
  if (proposal.reviews.some((review) => review.decision === "request-changes" || review.decision === "reject")) reasons.push("unresolved negative review");
  return { ready: reasons.length === 0, reasons };
}

export function validateProposal(proposal: EditorialProposal) {
  const errors: string[] = [];
  if (!proposal.title.trim()) errors.push("title is required");
  if (!proposal.summary.trim()) errors.push("summary is required");
  if (!proposal.authorId) errors.push("author is required");
  if (!proposal.sources.length) errors.push("at least one source is required");
  if (proposal.confidence === "explicit" && !proposal.sources.some((source) => source.kind === "scripture")) errors.push("explicit claims require a Scripture source");
  return { valid: errors.length === 0, errors };
}

export function getEditorialIntegrity(proposals: EditorialProposal[], contributors: ContributorProfile[]) {
  const invalid = proposals.filter((proposal) => !validateProposal(proposal).valid);
  const publishedWithoutGate = proposals.filter((proposal) => proposal.status === "published" && !evaluateApprovalGate(proposal, contributors).ready);
  const inactiveAuthors = proposals.filter((proposal) => !contributors.some((contributor) => contributor.id === proposal.authorId && contributor.active));
  const missingVersions = proposals.filter((proposal) => proposal.versions.length === 0);
  return { valid: invalid.length === 0 && publishedWithoutGate.length === 0 && inactiveAuthors.length === 0 && missingVersions.length === 0, invalid, publishedWithoutGate, inactiveAuthors, missingVersions };
}

function addVersion(proposal: EditorialProposal, actorId: string, summary: string, payload: unknown, status: ProposalStatus): EditorialProposal {
  const version: EditorialVersion = {
    version: (proposal.versions.at(-1)?.version ?? 0) + 1,
    createdAt: new Date().toISOString(),
    createdBy: actorId,
    summary,
    payload,
    status,
  };
  return { ...proposal, versions: [...proposal.versions, version], updatedAt: version.createdAt };
}

function randomId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
