# Platform 2.0 Access Control Standard

L&F uses least privilege and separates system-wide authority from ministry responsibility.

## Global identity
Every authenticated person is fundamentally a member. Existing `profiles.role` remains compatible with legacy `member` / `admin` behavior while Platform 2.0 moves elevated authority into explicit assignments.

## Platform roles
- `content_editor`: create/edit editorial resources; does not imply user administration or ministry leadership.
- `admin`: operational administration across the platform.
- `owner`: highest protected system authority. Reserved for security-sensitive role administration and ownership functions.

Legacy `profiles.role='admin'` satisfies Admin authority only. It never implicitly satisfies Owner authority.

## Ministry assignments
Ministry authority is scoped by `ministry_key`.
- `participant`: member of that ministry space.
- `facilitator`: may run authorized studies/sessions for that ministry.
- `leader`: may manage ministry participants/facilitators and ministry operations; includes facilitator-level session visibility.

A person may be a Foundry participant and Hearth facilitator without receiving platform administration. A facilitator cannot see unrelated ministry sessions merely because they facilitate somewhere else.

## Grant and revoke matrix
- Owner may grant/revoke Admin and Content Editor.
- Admin may grant/revoke Content Editor.
- Owner or Admin may grant/revoke Ministry Leader, Facilitator, and Participant assignments in any ministry.
- Ministry Leader may grant/revoke Participant and Facilitator assignments only inside ministries they lead.
- Ministry Leader may not create another Ministry Leader.
- Normal role-management UI never grants or revokes Owner.
- Self-revocation of elevated platform roles is blocked in the role RPC.

## Initial Owner bootstrap
Platform 2.0 provides a one-time migration bridge. If no active Owner exists, one existing legacy administrator may claim the initial Owner role. The RPC locks the assignment table, verifies no Owner exists, verifies the caller is already a legacy admin, and then creates the Owner assignment. Once an Owner exists, the bootstrap permanently refuses further claims.

Owner transfer after bootstrap remains a deliberate out-of-band security operation.

## Bible-study permissions
Members see only sessions in which they are enrolled. Facilitators/leaders see sessions for ministries to which they are assigned. Admin/owner can operate across ministries. Study lifecycle actions are enforced server-side and at the database boundary; hiding UI is never considered authorization.

## Editorial separation
Creating/approving Bible-study content is not the same permission as facilitating a study. Content-editor/admin/owner authority governs editorial workflows; facilitator/leader assignments govern ministry delivery.

## Preview-role safety
Legacy preview role remains a QA/training presentation feature for real admins only. It is never accepted by RLS or privileged RPCs as proof of authority. Database authorization uses the authenticated user and active role assignments.

## Security rules
- deny by default;
- least privilege;
- scope ministry authority to a ministry key;
- enforce permissions in RLS/RPC/server actions, not only navigation;
- revocation explicitly removes active assignment authority;
- service-role use stays server-only;
- no client may assign itself elevated roles;
- Owner is not a normal application-selectable role;
- platform and ministry role management remain separate concerns.
