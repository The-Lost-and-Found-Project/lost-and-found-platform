import "server-only";

type AuthIdentity = {
  id?: string | null;
};

/**
 * Owner identities come from server-side deployment configuration, never from
 * profile metadata or a client request. Auth user IDs remain stable if an
 * Owner changes their email address.
 */
export function isConfiguredOwner(user: AuthIdentity): boolean {
  const userId = user.id?.trim().toLowerCase();
  if (!userId) return false;

  const owners = (process.env.LFP_OWNER_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  return owners.includes(userId);
}
