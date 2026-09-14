# Platform 2.0 Access Control Standard

L&F uses least privilege and separates system-wide authority from ministry responsibility.

## Global identity
Every authenticated person is fundamentally a member. Existing `profiles.role` remains compatible with legacy `member` / `admin` behavior while Platform 2.0 moves elevated authority into explicit assignments.

## Platform roles
- `content_editor`: create/edit editorial resources; does not imply user administration or ministry leadership.
- `admin`: operational administration across the platform.
- `owner`: highest protected system authority. Reserved for security-sensitive role administration and ownership functions.

## Ministry assignments
Ministry authority is scoped by `ministry_key`.
- `participant`: member of that ministry space.
- `facilitator`: may run authorized studies/sessions for that ministry.
- `leader`: may manage ministry participants/facilitators and ministry operations; includes facilitator-level session visibility.

Examples: a person may be a Foundry participant and Hearth facilitator without receiving platform administration. A facilitator cannot see unrelated ministry sessions merely because they facilitate somewhere else.

## Bible-study permissions
Members see only sessions in which they are enrolled. Facilitators/leaders see sessions for ministries to which they are assigned. Admin/owner can operate across ministries. Study lifecycle actions are enforced server-side and at the database boundary; hiding UI is never considered authorization.

## Editorial separation
Creating/approving Bible-study content is not the same permission as facilitating a study. Content-editor/admin/owner authority should govern editorial workflows; facilitator/leader assignments govern ministry delivery.

## Preview-role safety
Legacy preview role remains a QA/training presentation feature for real admins only. It must never be accepted by RLS or privileged RPCs as proof of authority. Database authorization uses the authenticated user and active role assignments.

## Security rules
- deny by default;
- least privilege;
- scope ministry authority to a ministry key;
- enforce permissions in RLS/RPC/server actions, not only navigation;
- revocation is explicit and immediately removes active assignment authority;
- service-role use stays server-only;
- no client may assign itself elevated roles;
- owner-level role management should require owner authority when the role-management UI is implemented.
