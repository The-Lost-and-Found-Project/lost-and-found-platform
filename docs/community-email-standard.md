# L&F Community Email Standard

## Active email inventory

| Email | Owner | Trigger | Member action |
| --- | --- | --- | --- |
| Confirm account | Supabase Auth | New signup or confirmation resend | Confirm the Community Member account |
| Welcome | Community App / Resend | First successful email confirmation | Open the account; optionally view Future Apps or give |
| Reset password | Supabase Auth | Member requests a password reset | Choose a new password |
| Prayer request revision | Community App / Resend | Community Admin requests a safe revision | Review the member's own request or get help |

The old direct prayer-submission and praise-submission email endpoints are
retired. Current operational updates remain in the Community App and optional
push delivery, preventing duplicate or abusive email usage.

## Voice and role rules

- Use `Community Member` and `Community Admin` only.
- Never describe a prayer as assigned, owned, matched, or handed off.
- Never refer to Prayer Care Members, a care-team queue, Prayer Journey, EMAS
  inside the Community App, weekly digests, or retired in-app product links.
- Describe Prayer as repeatable community action, Praise Love as one removable
  acknowledgement per member, and Testimony as a story shared to encourage.
- Keep giving optional and separate from access to community participation.
- Explain why the recipient received the email and never include private prayer
  text in a subject line or unnecessary preview text.

## Hosted Supabase deployment note

The repository versions of the confirmation and recovery templates live in
`supabase/templates/` and are wired into `supabase/config.toml` for local and
CLI-managed environments. The hosted production project must also receive the
same subjects and HTML through Supabase Authentication > Email Templates or the
Supabase Management API. Updating repository files alone does not change the
hosted templates.
