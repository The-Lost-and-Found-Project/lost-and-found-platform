export type Role = "member" | "facilitator" | "supervisor" | "admin";

const VALID_ROLES: Role[] = ["member", "facilitator", "supervisor", "admin"];

export function getEffectiveRole(role: string | null | undefined, previewRole?: string | null): Role {
  if (role === "admin" && previewRole && VALID_ROLES.includes(previewRole as Role)) return previewRole as Role;
  return VALID_ROLES.includes(role as Role) ? (role as Role) : "member";
}

export function canManageStudies(role: Role) {
  return role === "facilitator" || role === "supervisor" || role === "admin";
}

export function canManagePeople(role: Role) {
  return role === "admin";
}
