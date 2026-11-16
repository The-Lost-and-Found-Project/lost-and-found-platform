import "server-only";

type VerifiedIdentity = {
  email?: string | null;
  email_confirmed_at?: string | null;
};

/**
 * Owner identities come from server-side deployment configuration, never from
 * profile metadata or a client request. Requiring a confirmed email prevents
 * an unverified account from matching an Owner address.
 */
export function isConfiguredOwner(user: VerifiedIdentity): boolean {
  if (!user.email || !user.email_confirmed_at) return false;

  const owners = (process.env.LFP_OWNER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return owners.includes(user.email.trim().toLowerCase());
}
