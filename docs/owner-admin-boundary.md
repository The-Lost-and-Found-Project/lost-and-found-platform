# Owner-only administrator changes

This change limits promotion to, and demotion from, `profiles.role = 'admin'` to a confirmed account listed in the server-side `LFP_OWNER_EMAILS` setting. The setting is comma-separated, is never prefixed with `NEXT_PUBLIC_`, and is not committed with account addresses.

Other active admins can still assign the existing `member`, `facilitator`, and `supervisor` roles. The existing last-admin safeguard remains in place. Owner status does not activate an account, create a profile, or bypass the existing active-profile check.

The setting is empty by default. With no Owner addresses configured, admin-role grants and removals fail closed for everyone. Before this change is merged, configure the confirmed Owner account addresses in the deployment environments. This PR does not change Vercel settings or the live database.

The current app still stores one broad profile role. This is a narrow guard for administrator escalation, not the complete scoped-role and delegated-approval system in the rebuild blueprint. The sample People & roles preview remains read-only.
