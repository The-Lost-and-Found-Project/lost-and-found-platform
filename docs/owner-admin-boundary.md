# Owner-only administrator changes

This change limits promotion to, and demotion from, `profiles.role = 'admin'` to an Auth user ID listed in the server-side `LFP_OWNER_USER_IDS` setting. The setting is comma-separated, is never prefixed with `NEXT_PUBLIC_`, and its values are not committed to this repository.

Other active admins can still assign the existing `member`, `facilitator`, and `supervisor` roles. The existing last-admin safeguard remains in place. Owner status does not activate an account, create a profile, or bypass the existing active-profile check.

With no Owner IDs configured in an environment, admin-role grants and removals fail closed for everyone. The Production Owner list is configured in Vercel as a sensitive value; the IDs are not stored in this repository. Other environments need their own explicit configuration. No Supabase schema or data was changed.

The current app still stores one broad profile role. This is a narrow guard for administrator escalation, not the complete scoped-role and delegated-approval system in the rebuild blueprint. The sample People & roles preview remains read-only.
