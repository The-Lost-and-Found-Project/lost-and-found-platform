export type Role = "member" | "prayer_team" | "pastor" | "admin";

const VALID_ROLES: Role[] = ["member", "prayer_team", "pastor", "admin"];

// Real admins can set a preview_role on their own profile to see the app as
// a different role would (for training / QA). It's only ever honored when
// the caller's REAL role is admin — a non-admin can never use preview_role
// to escalate themselves, since this function ignores preview_role for
// anyone whose real role isn't already admin.
export function getEffectiveRole(
  role: string | null | undefined,
  previewRole?: string | null
): Role {
  if (
    role === "admin" &&
    previewRole &&
    VALID_ROLES.includes(previewRole as Role)
  ) {
    return previewRole as Role;
  }
  return (VALID_ROLES.includes(role as Role) ? (role as Role) : "member");
}
