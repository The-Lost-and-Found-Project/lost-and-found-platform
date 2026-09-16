export const LF_LIVE_POLICY = {
  standardMinutes: 75,
  facilitatorWarningsAtMinutes: [60, 70] as const,
  facilitatorExtensionMinutes: 15,
  supervisorExtensionMinutes: 15,
  supervisorApprovalRequiredAfterMinutes: 90,
  adminApprovalRequiredAfterMinutes: 105,
} as const;

export type LiveExtensionLevel = "facilitator_15" | "supervisor_15" | "admin_override";

export function maximumMinutesFor(level?: LiveExtensionLevel | null) {
  if (level === "admin_override") return Number.POSITIVE_INFINITY;
  if (level === "supervisor_15") return 105;
  if (level === "facilitator_15") return 90;
  return LF_LIVE_POLICY.standardMinutes;
}

export function requiresWrittenReason(reason: string) {
  return reason.trim().length >= 3;
}
