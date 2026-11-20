"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { filterPreviewEvents, previewEvents, type CalendarFilter, type CalendarScope } from "@/lib/rebuild-preview";
import styles from "./RebuildPreview.module.css";

type Surface = "Administration" | "Public homepage" | "Member home";

function useDialogAccessibility(onClose: () => void, enabled = true) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!enabled || !dialogRef.current) return;
    const activeDialog = dialogRef.current as HTMLElement;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(activeDialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((item) => item.getAttribute("aria-hidden") !== "true");
    const focusable = getFocusable();
    (focusable[0] ?? activeDialog).focus();
    function keepFocusInside(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const current = getFocusable();
      if (!current.length) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }
      const first = current[0];
      const last = current[current.length - 1];
      if (!activeDialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keepFocusInside);
    return () => {
      document.removeEventListener("keydown", keepFocusInside);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [enabled]);
  return (element: HTMLElement | null) => { dialogRef.current = element; };
}
type Workspace = "Home" | "My tasks" | "Calendars" | "Groups" | "People & roles" | "Prayer review" | "Events" | "Studies" | "Insights" | "Settings";
type RoleView = "Member directory" | "Role requests" | "Group requests" | "Group roster" | "Delegation" | "Current access";
const surfaces: Surface[] = ["Administration", "Public homepage", "Member home"];
const calendarFilters: CalendarFilter[] = ["All", "Mine", "Assigned", "Shared"];

function Info({ label, children }: { label: string; children: ReactNode }) {
  return <details className={styles.info}><summary aria-label={label}>i</summary><div className={styles.infoText}>{children}</div></details>;
}

function SectionTitle({ title, help }: { title: string; help: string }) {
  return <div className={styles.sectionTitle}><h2>{title}</h2><Info label={"Help with " + title}>{help}</Info></div>;
}

function Schedule() {
  return <section className={styles.panel}><SectionTitle title="Today’s schedule" help="Your authorized events and accepted commitments will appear here. These entries are samples." /><ul className={styles.schedule}><li><time>12:00 PM</time><span>Prayer team</span></li><li><time>3:00 PM</time><span>Study preparation</span></li><li><time>6:30 PM</time><span>Men’s Bible study</span></li></ul></section>;
}

function Attention({ onOpen, personal = false }: { onOpen: (message: string) => void; personal?: boolean }) {
  return <section className={styles.panel}><SectionTitle title="Needs attention" help="One queue for work within your role and assignments. Opening a sample item does not change real records." /><ul className={styles.queue}>{[
    ...(personal ? [
      ["Prepare for my next study", "Before Friday", "Personal study"],
      ["Respond to serving invitation", "Response needed", "My serving invitation"],
    ] : [
      ["Follow up on prayer requests", "3 waiting", "Prayer care workspace"],
      ["Review study material", "1 awaiting review", "Study review workspace"],
      ["Review role requests", "2 waiting", "Role approval workspace"],
    ]),
  ].map(([title, detail, target]) => <li key={title}><div><strong>{title}</strong><span>{detail}</span></div><button className={styles.outlineButton} onClick={() => onOpen(target + ": this is a sample preview. No approval or record has changed.")}>Review<span className={styles.srOnly}>{" " + title.toLowerCase()}</span></button></li>)}</ul></section>;
}

function MyTasks({ onOpen, personal = false }: { onOpen: (message: string) => void; personal?: boolean }) {
  const [view, setView] = useState("All work");
  const [role, setRole] = useState("All roles");
  const [memberCareStatus, setMemberCareStatus] = useState("Needs follow-up");
  const [leaderCareStatus, setLeaderCareStatus] = useState("Due this week");
  const tasks = personal ? [
    { title: "Prepare for my next study", ministry: "Men’s Bible study", role: "Member", due: "Before Friday", assigned: true },
    { title: "Respond to serving invitation", ministry: "Serve team", role: "Member", due: "Response needed", assigned: true },
  ] : [
    { title: "Follow up with a prayer team member", ministry: "Prayer ministry", role: "Prayer team", due: "Today", assigned: true },
    { title: "Prepare Friday’s study materials", ministry: "Men’s Forge", role: "Study facilitator", due: "Before Friday", assigned: true },
    { title: "Review facilitator role request", ministry: "Men’s Forge", role: "Ministry leader", due: "2 requests waiting", assigned: false },
    { title: "Confirm serve team roster", ministry: "Outreach", role: "Serve team", due: "Before Saturday", assigned: true },
  ];
  const views = personal ? ["All work", "Assigned to me"] : ["All work", "Assigned to me", "Role queues"];
  const visible = tasks.filter((task) => {
    if (view === "Assigned to me" && !task.assigned) return false;
    if (view === "Role queues" && task.assigned) return false;
    if (role !== "All roles" && task.role !== role) return false;
    return true;
  });
  return <section className={styles.panel} aria-label="My tasks preview">
    <div className={styles.approvalHeading}><SectionTitle title={personal ? "My tasks" : "Work queue"} help="See work assigned to you alongside review queues available to your approved roles. Opening a sample task does not change a record."/><p>{personal ? "Your next steps" : "Your assignments and role queues"}</p></div>
    <div className={styles.taskControls}><div className={styles.approvalTabs} role="group" aria-label="Task views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div><label className={styles.selectLabel}>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option><option>Member</option><option>Prayer team</option><option>Study facilitator</option><option>Ministry leader</option><option>Serve team</option></select></label></div>
    {visible.length ? <ul className={styles.taskList}>{visible.map((task) => <li key={task.title}><div className={styles.taskMain}><span className={styles.requestLabel}>{task.ministry}</span><h3>{task.title}</h3><p>{task.role} · {task.assigned ? "Assigned to you" : "Role review queue"}</p></div><div className={styles.taskAction}><span className={styles.statusPill}>{task.due}</span><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this would open the authorized task workspace. No record or assignment changed.")}>Open task</button></div></li>)}</ul> : <p className={styles.empty}>No sample work matches this view. Choose another role or task filter.</p>}
    {!personal && role === "Ministry leader" && <article className={styles.privateCareTask}><div><p className={styles.eyebrow}>Care follow-ups · assigned role sample</p><h3>Make room to check in</h3><p>Reminders help leaders follow through on care without scoring people or putting private conversation notes in the general task list.</p></div><ul className={styles.careFollowUpList}><li><div><strong>Member A requested a personal check-in</strong><span>Optional note stays private · assigned to you</span></div><span className={styles.statusPill} role="status">{memberCareStatus}</span><div className={styles.careFollowUpActions}>{memberCareStatus !== "Complete" && <button className={styles.outlineButton} onClick={() => setMemberCareStatus(memberCareStatus === "Planned" ? "Complete" : "Planned")}>{memberCareStatus === "Planned" ? "Mark complete" : "Plan check-in"}</button>}</div></li><li><div><strong>Regular check-in with a ministry leader</strong><span>Scheduled follow-up · assigned to you</span></div><span className={styles.statusPill} role="status">{leaderCareStatus}</span><div className={styles.careFollowUpActions}>{leaderCareStatus !== "Complete" && <button className={styles.outlineButton} onClick={() => setLeaderCareStatus(leaderCareStatus === "Planned" ? "Complete" : "Planned")}>{leaderCareStatus === "Planned" ? "Mark complete" : "Plan check-in"}</button>}</div></li></ul><p className={styles.caption}>Sample status changes stay on this screen and are not saved.</p><p className={styles.caption}>No member chat or message is sent; follow-up uses an existing trusted channel.</p></article>}
    <p className={styles.caption}>Sample queue · available tasks depend on approved roles and assignments</p>
  </section>;
}

function MemberDirectory() {
  const [query, setQuery] = useState("");
  const members = [
    { name: "Leah Carter", audience: "L&F members", fields: [["Faith story", "Jesus met me in a difficult season and kept drawing me closer."], ["Favorite Scripture", "Psalm 46:1"]] },
    { name: "Marcus Reed", audience: "Accepted groups", fields: [["Favorite Scripture", "John 15:5"]] },
    { name: "Dana Miller", audience: "L&F members", fields: [] },
  ];
  const visible = members.filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className={styles.directory}>
    <p className={styles.approvalIntro}>This directory includes only people who chose to share their directory name. Other profile details appear only when each member has opted in to those fields.</p>
    <label className={styles.directorySearch}>Search shared profiles<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name"/></label>
    {visible.length ? <ul className={styles.directoryList}>{visible.map((member) => <li key={member.name}><div className={styles.memberCardHeading}><div><span className={styles.requestLabel}>Shared profile</span><h3>{member.name}</h3></div><span className={styles.statusPill}>{member.audience}</span></div>{member.fields.length ? <dl className={styles.sharedProfileFields}>{member.fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className={styles.emptyProfile}>No other fields shared.</p>}</li>)}</ul> : <p className={styles.empty}>No shared profile names match your search.</p>}
    <p className={styles.ownerRule}>Members who keep Directory name private do not appear in search. Contact details remain hidden unless that person explicitly shares them.</p>
  </div>;
}

function RoleApprovals({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState<RoleView>("Member directory");
  const [rosterGroup, setRosterGroup] = useState("Men’s Forge");
  const [removalTarget, setRemovalTarget] = useState<{ group: string; name: string } | null>(null);
  const [sampleDelegationActive, setSampleDelegationActive] = useState(true);
  const [reviewingRevocation, setReviewingRevocation] = useState(false);
  const [revocationAcknowledged, setRevocationAcknowledged] = useState(false);
  const views: RoleView[] = ["Member directory", "Role requests", "Group requests", "Group roster", "Delegation", "Current access"];
  const groupRosters: Record<string, { name: string; joined: string; reviewRemoval?: boolean }[]> = {
    "Men’s Forge": [
      { name: "Leah Carter", joined: "Oct 18" },
      { name: "Marcus Reed", joined: "Nov 2", reviewRemoval: true },
      { name: "Dana Miller", joined: "Nov 10" },
    ],
    "The Hearth": [
      { name: "Rachel Brooks", joined: "Nov 3" },
      { name: "Sam Brooks", joined: "Nov 8", reviewRemoval: true },
    ],
    "Outreach Serve Team": [
      { name: "Jordan Ellis", joined: "Nov 5" },
      { name: "Alex Rivera", joined: "Nov 9", reviewRemoval: true },
      { name: "Chris Morgan", joined: "Nov 14" },
    ],
  };
  return <section className={styles.panel} aria-label="People and roles preview">
    <div className={styles.approvalHeading}><SectionTitle title="People & roles" help="A person becomes a member after signup. Additional roles need approval. Delegation can cover approved role types and scopes; only the Owner grants or removes administrator access." /><p>Membership and ministry access</p></div>
    <div className={styles.approvalTabs} role="group" aria-label="People and roles views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    {view === "Member directory" && <MemberDirectory/>}
    {view === "Role requests" && <><p className={styles.approvalIntro}>Check the requested role, exact scope, training, and your authority before deciding. Members cannot approve their own requests.</p><ul className={styles.requestList}>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Role request</span><h3>Study facilitator</h3></div><span className={styles.statusPill}>Sample training status</span></div><p>Requested for <strong>Men’s Forge</strong></p><p className={styles.requestMeta}>Sample member · Submitted Nov 12</p><p className={styles.requestScope}>Review only if your authority includes the Study facilitator role in Men’s Forge. Group membership alone does not grant this role.</p><DecisionReview kind="role" scope="Study facilitator · Men’s Forge" onOpen={onOpen}/></li>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Role request</span><h3>Prayer team</h3></div><span className={styles.statusPill}>Leader review</span></div><p>Requested for <strong>Prayer ministry</strong></p><p className={styles.requestMeta}>Sample member · Training requirement not yet configured</p><p className={styles.requestScope}>Review only if your authority includes the Prayer team role in Prayer ministry. This decision does not change prayer-request audiences.</p><DecisionReview kind="role" scope="Prayer team · Prayer ministry" onOpen={onOpen}/></li>
    </ul></>}
    {view === "Group requests" && <><p className={styles.approvalIntro}>Review group participation only. Act only when your authority covers the exact group; membership approval does not create or change a ministry role.</p><ul className={styles.requestList}>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Join request · The Hearth</span><h3>Faithful Together</h3></div><span className={styles.statusPill}>Awaiting review</span></div><p className={styles.requestMeta}>Sample member · Submitted Nov 12</p><p className={styles.requestScope}>Review only if your authority includes group membership decisions for The Hearth. The requester cannot approve their own request.</p><DecisionReview kind="group" scope="Group participation · The Hearth" onOpen={onOpen}/></li>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Invitation · Outreach Serve Team</span><h3>Sample member</h3></div><span className={styles.statusPill}>Awaiting response</span></div><p className={styles.requestMeta}>Invitation issued by an authorized group inviter · Nov 15</p><p className={styles.requestScope}>An invitation offers group participation only. Serving or leadership roles require separate approval.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => onOpen("Sample only: an authorized inviter could resend this invitation. No message was sent.")}>Resend invitation</button><button className={styles.outlineButton} onClick={() => onOpen("Sample only: an authorized inviter could cancel this invitation. No record changed.")}>Cancel invitation</button></div></li>
    </ul></>}
    {view === "Group roster" && <><p className={styles.approvalIntro}>Review accepted members within groups you are authorized to manage. Removing group participation does not change L&amp;F account membership or separately approved ministry roles.</p><div className={styles.groupRoster}><label className={styles.selectLabel}>Group<select value={rosterGroup} onChange={(event) => { setRosterGroup(event.target.value); setRemovalTarget(null); }}><option>Men’s Forge</option><option>The Hearth</option><option>Outreach Serve Team</option></select></label><ul className={styles.accessList}>{groupRosters[rosterGroup].map((member) => <li key={member.name}><div><strong>{member.name}</strong><span>Group member · Joined {member.joined}</span></div><button className={styles.outlineButton} onClick={() => member.reviewRemoval ? setRemovalTarget({ group: rosterGroup, name: member.name }) : onOpen(`Sample only: this would open ${member.name}’s group membership details. No profile data was changed.`)}>{member.reviewRemoval ? "Review removal" : "View details"}</button></li>)}</ul>{removalTarget && <section className={styles.groupRemovalReview} aria-labelledby="group-removal-title"><p className={styles.requestLabel}>Sample removal review</p><h3 id="group-removal-title">Remove {removalTarget.name} from {removalTarget.group}?</h3><p>This affects participation in <strong>{removalTarget.group}</strong> only. The person’s L&amp;F account, profile, and any separately approved ministry roles remain unchanged.</p><p>In the live app, this decision requires authority for this group and a final confirmation. The preview will not remove anyone.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setRemovalTarget(null)}>Keep membership</button><button className={styles.primaryButton} onClick={() => { setRemovalTarget(null); onOpen(`Sample only: ${removalTarget.name} would be removed from ${removalTarget.group} group participation after authorized confirmation. Account membership and ministry roles would remain separate. No record changed.`); }}>Confirm sample review</button></div></section>}</div><p className={styles.ownerRule}>Group roster access is limited to an authorized group scope. A roster action cannot change account membership, profile sharing, or ministry-role approval.</p></>}
    {view === "Delegation" && <><p className={styles.approvalIntro}>Delegation must name one reviewer, one allowed decision, an exact role or group scope, and an end date. Ministry role approval and group membership approval stay separate.</p><article className={styles.delegationCard}><div className={styles.delegationTop}><div><span className={styles.requestLabel}>Sample delegated authority</span><h3>Prayer ministry leader</h3><p>Sample reviewer · Approval scope is limited</p></div><span className={styles.statusPill}>{sampleDelegationActive ? "Active · sample" : "Revoked · sample"}</span></div><dl className={styles.delegationDetails}><div><dt>Can review</dt><dd>Prayer team role requests</dd></div><div><dt>Scope</dt><dd>Prayer ministry</dd></div><div><dt>Granted by</dt><dd>Authorized role approver · sample</dd></div><div><dt>Ends</dt><dd>Dec 31, 2026 · illustrative</dd></div></dl><div className={styles.delegationGuardrail}><strong>Cannot</strong><ul><li>approve their own request</li><li>add roles or widen scope</li><li>delegate onward</li><li>grant administrator access</li></ul></div></article>{sampleDelegationActive ? <button className={styles.outlineButton} onClick={() => { setReviewingRevocation(true); setRevocationAcknowledged(false); }}>Review revocation</button> : <p className={styles.caption} role="status">Sample delegation revoked · no permission changed</p>}{reviewingRevocation && sampleDelegationActive && <section className={styles.groupRemovalReview} aria-labelledby="delegation-revoke-title"><p className={styles.requestLabel}>Sample revocation review</p><h3 id="delegation-revoke-title">Revoke this scoped approval?</h3><p>This would stop this reviewer from taking new Prayer team decisions in Prayer ministry. The reviewer would keep their separate group memberships and any other approved role.</p><p className={styles.departureBoundary}><strong>Pending request handling · proposal</strong><br/>If the grant expires or is revoked, an unfinished request should return to the standing authorized review queue. It must remain pending; expiry never approves it automatically.</p><label className={styles.departureAcknowledgement}><input type="checkbox" checked={revocationAcknowledged} onChange={(event) => setRevocationAcknowledged(event.target.checked)}/><span>I understand this revokes only the selected reviewer, decision type, and scope.</span></label><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setReviewingRevocation(false)}>Keep delegation</button><button className={styles.dangerButton} disabled={!revocationAcknowledged} onClick={() => { setSampleDelegationActive(false); setReviewingRevocation(false); setRevocationAcknowledged(false); onOpen("Sample only: the delegation would be revoked for new decisions in this exact scope. Pending requests stay pending and return to an authorized queue; no permission changed."); }}>Confirm sample revocation</button></div><p className={styles.caption}>No live permission or request is changed.</p></section>}<DelegationSetup onOpen={onOpen}/><p className={styles.ownerRule}>Only configured Owners grant or remove administrator access. A delegated approval cannot add administrator permissions; only an Owner can grant or remove them.</p></>}
    {view === "Current access" && <><p className={styles.approvalIntro}>Each approved role shows who granted it and where it applies.</p><ul className={styles.accessList}><li><div><strong>Study facilitator</strong><span>Men’s Forge · Approved by sample ministry leader</span></div><span className={styles.statusPill}>Active</span></li><li><div><strong>Supervisor</strong><span>Assigned facilitators · Existing L&amp;F role</span></div><span className={styles.statusPill}>Active</span></li><li><div><strong>Member</strong><span>Member home and personal study</span></div><span className={styles.statusPill}>Baseline</span></li></ul></>}
    <p className={styles.caption}>Synthetic examples · no member records or role changes</p>
  </section>;
}

function DelegationSetup({ onOpen }: { onOpen: (message: string) => void }) {
  const [reviewer, setReviewer] = useState("");
  const [authority, setAuthority] = useState<"role" | "group">("role");
  const [scope, setScope] = useState("Study facilitator · Men’s Forge");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [authorized, setAuthorized] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const roleScopes = ["Study facilitator · Men’s Forge", "Prayer team · Prayer ministry", "Ministry leader · Prayer ministry", "Serve team · Outreach Serve Team"];
  const groupScopes = ["Men’s Forge", "The Hearth", "Outreach Serve Team"];
  const scopes = authority === "role" ? roleScopes : groupScopes;
  const resetReview = () => setReviewing(false);
  return <section className={styles.delegationSetup} aria-labelledby="delegation-setup-title">
    <div><p className={styles.requestLabel}>New sample delegation</p><h3 id="delegation-setup-title">Set up scoped approval</h3><p>Choose a reviewer and the exact decisions they may handle. A delegation does not give the reviewer broader access.</p></div>
    <div className={styles.delegationForm}>
      <label className={styles.selectLabel}>Reviewer<select value={reviewer} onChange={(event) => { setReviewer(event.target.value); setAuthorized(false); resetReview(); }}><option value="">Choose a sample reviewer</option><option>Alex Rivera · Ministry leader</option><option>Jordan Ellis · Group leader</option><option>Chad · Owner</option><option>Chrissy · Owner</option></select></label>
      <label className={styles.selectLabel}>Decision type<select value={authority} onChange={(event) => { const next = event.target.value as "role" | "group"; setAuthority(next); setScope(next === "role" ? roleScopes[0] : groupScopes[0]); setAuthorized(false); resetReview(); }}><option value="role">Ministry role approval</option><option value="group">Group membership decisions</option></select></label>
      <label className={styles.selectLabel}>{authority === "role" ? "Role and ministry scope" : "Group scope"}<select value={scope} onChange={(event) => { setScope(event.target.value); setAuthorized(false); resetReview(); }}>{scopes.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className={styles.selectLabel}>Delegation ends<input type="date" min={today} value={endDate} onChange={(event) => { setEndDate(event.target.value); setAuthorized(false); resetReview(); }}/></label>
    </div>
    <p className={styles.requestScope}>{authority === "role" ? "This permits review of the selected role in its named ministry or group only. It does not grant group membership or other roles." : "This permits group membership decisions for this group only. It does not grant a ministry role."} The reviewer cannot approve their own request, expand scope, or delegate onward.</p>
    {!reviewing ? <div className={styles.delegationSetupActions}><label className={styles.decisionCheck}><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /><span>I am authorized to delegate this decision within the selected scope.</span></label><button className={styles.primaryButton} disabled={!reviewer || !authorized || !endDate || endDate < today} onClick={() => setReviewing(true)}>Review delegation</button></div> : <section className={styles.groupRemovalReview} aria-labelledby="delegation-review-title"><p className={styles.requestLabel}>Confirm exact delegation</p><h4 id="delegation-review-title">{reviewer}</h4><dl className={styles.delegationReviewDetails}><div><dt>Decision</dt><dd>{authority === "role" ? "Ministry role approval" : "Group membership decisions"}</dd></div><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Ends</dt><dd>{endDate}</dd></div></dl><p>In the live app, this delegation would grant only the selected review authority until the end date. It does not grant administrator access.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => { resetReview(); setAuthorized(false); }}>Edit delegation</button><button className={styles.primaryButton} onClick={() => { onOpen(`Sample only: ${reviewer} would receive ${authority === "role" ? "ministry role approval" : "group membership decision"} authority for ${scope} through ${endDate}. No permission was assigned.`); resetReview(); setAuthorized(false); }}>Confirm sample delegation</button></div></section>}
    <p className={styles.caption}>Illustrative reviewers and scopes · no permission or reviewer assignment is saved</p>
  </section>;
}

function DecisionReview({ kind, scope, onOpen }: { kind: "role" | "group"; scope: string; onOpen: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"approve" | "decline" | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [reason, setReason] = useState("");
  const decisionLabel = kind === "role" ? "ministry role" : "group participation";
  const reset = () => { setOpen(false); setDecision(null); setAuthorized(false); setReason(""); };
  return <>
    {!open ? <div className={styles.requestActions}><button className={styles.primaryButton} onClick={() => setOpen(true)}>Review decision</button></div> : <section className={styles.decisionReview} aria-label={`Review ${decisionLabel} decision`}>
      <p className={styles.requestLabel}>Sample decision review</p>
      <h4>{scope}</h4>
      <p>Confirm that your approved authority covers this exact scope and that you are not approving your own request. Group membership and ministry role access remain separate.</p>
      <div className={styles.requestActions} role="group" aria-label="Choose a sample decision">
        <button className={decision === "approve" ? styles.primaryButton : styles.outlineButton} aria-pressed={decision === "approve"} onClick={() => { setDecision("approve"); setAuthorized(false); }}>Approve {kind === "role" ? "role" : "membership"}</button>
        <button className={decision === "decline" ? styles.primaryButton : styles.outlineButton} aria-pressed={decision === "decline"} onClick={() => { setDecision("decline"); setAuthorized(false); }}>Decline request</button>
        <button className={styles.outlineButton} onClick={reset}>Cancel</button>
      </div>
      {decision && <div className={styles.decisionConfirm}>
        {decision === "decline" && <label className={styles.decisionReason}>Optional reason for the member<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} placeholder="A brief, helpful explanation" /></label>}
        <label className={styles.decisionCheck}><input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} /><span>I confirm I am authorized for this exact scope and am not approving my own request.</span></label>
        <button className={styles.primaryButton} disabled={!authorized} onClick={() => { const verb = decision === "approve" ? "approved" : "declined"; onOpen(`Sample only: this ${decisionLabel} request for ${scope} would be ${verb} by an authorized reviewer. ${reason.trim() ? "The optional reason is only local sample text and is not saved. " : ""}No access or request record changed.`); reset(); }}>Confirm sample {decision}</button>
      </div>}
      <p className={styles.caption}>No approval, rejection, access change, or notification is sent in this preview.</p>
    </section>}
  </>;
}

function PrayerReview({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("Visitor requests");
  const views = ["Visitor requests", "Member requests", "Cleared public"];
  return <section className={styles.panel} aria-label="Prayer review preview">
    <div className={styles.approvalHeading}><SectionTitle title="Prayer review" help="Visitor requests are public-only and stay hidden until cleared. Members may choose private audiences. Review never broadens a member’s chosen audience." /><p>Review public submissions and respect member-selected privacy.</p></div>
    <div className={styles.approvalTabs} role="group" aria-label="Prayer review views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    {view === "Visitor requests" && <><p className={styles.approvalIntro}>These visitor submissions are not visible publicly until a moderator clears them.</p><ul className={styles.requestList}>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Visitor · public only</span><h3>Prayer for my family</h3></div><span className={styles.statusPill}>Awaiting review</span></div><p>“Please pray for my family as we walk through a difficult season.”</p><p className={styles.requestMeta}>Visitor submission · No private audience available</p><VisitorClearReview title="Prayer for my family" onOpen={onOpen}/></li>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Visitor · public only</span><h3>Strength during recovery</h3></div><span className={styles.statusPill}>Awaiting review</span></div><p>“Please pray for strength and steady healing.”</p><p className={styles.requestMeta}>Visitor submission · No contact details shown</p><VisitorClearReview title="Strength during recovery" onOpen={onOpen}/></li>
    </ul></>}
    {view === "Member requests" && <><p className={styles.approvalIntro}>Member requests remain with the audience the member selected.</p><ul className={styles.requestList}>
      <li><div className={styles.requestTop}><div><span className={styles.requestLabel}>Member request</span><h3>A difficult week</h3></div><span className={styles.statusPill}>Prayer team only</span></div><p>“I’d appreciate prayer as I work through a difficult week.”</p><p className={styles.requestMeta}>Sample member · Audience chosen by member</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this opens the authorized care workspace. The member’s audience stays unchanged.")}>Open care workspace</button></div></li>
    </ul><p className={styles.ownerRule}>Moderators cannot broaden a member’s sharing choice.</p></>}
    {view === "Cleared public" && <><p className={styles.approvalIntro}>Only cleared public submissions appear here and on the public homepage.</p><ul className={styles.accessList}><li><div><strong>Prayer for my family</strong><span>Visitor request · Cleared for public view</span></div><span className={styles.statusPill}>Public</span></li></ul></>}
    <p className={styles.caption}>Synthetic examples · no real requests, personal details, or moderation changes</p>
  </section>;
}

function VisitorClearReview({ title, onOpen }: { title: string; onOpen: (message: string) => void }) {
  const [reviewing, setReviewing] = useState(false);
  const [publicAudienceConfirmed, setPublicAudienceConfirmed] = useState(false);
  const reset = () => { setReviewing(false); setPublicAudienceConfirmed(false); };
  return reviewing ? <section className={styles.publicClearanceReview} aria-label={`Public clearance review for ${title}`}>
    <p className={styles.requestLabel}>Review public clearance</p>
    <h4>{title}</h4>
    <p>Clearing this visitor request would make its prayer text visible to anyone on the public Prayer page. Visitors do not have a private audience option.</p>
    <label className={styles.decisionCheck}><input type="checkbox" checked={publicAudienceConfirmed} onChange={(event) => setPublicAudienceConfirmed(event.target.checked)} /><span>I confirm this visitor request is appropriate to share publicly after review.</span></label>
    <div className={styles.requestActions}><button className={styles.outlineButton} onClick={reset}>Keep hidden</button><button className={styles.primaryButton} disabled={!publicAudienceConfirmed} onClick={() => { onOpen(`Sample only: “${title}” would be cleared for the public Prayer page. The request remains pending in this preview; no content was published.`); reset(); }}>Confirm sample public clearance</button></div>
    <p className={styles.caption}>No request is cleared or published in this preview.</p>
  </section> : <div className={styles.requestActions}><button className={styles.primaryButton} onClick={() => setReviewing(true)}>Review public clearance</button><button className={styles.outlineButton} onClick={() => onOpen(`Sample only: “${title}” would remain hidden from the public Prayer page. No record changed.`)}>Keep hidden</button></div>;
}

function EventManagement({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("Upcoming");
  const [showPlanner, setShowPlanner] = useState(false);
  const views = ["Upcoming", "Registrations", "Drafts"];
  return <section className={styles.panel} aria-label="Events workspace preview">
    <div className={styles.approvalHeading}><SectionTitle title="Events" help="Manage ministry gatherings, role-based visibility, assignments, and free registration. Payment is not part of the event flow. These examples are synthetic."/><p>Plan gatherings and help people take part</p></div>
    <div className={styles.eventToolbar}><div className={styles.approvalTabs} role="group" aria-label="Event views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div><button className={styles.primaryButton} onClick={() => setShowPlanner(true)}>Plan an event</button></div>
    {view === "Upcoming" && <ul className={styles.eventList}>
      <li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>Men’s Forge · Thu, Nov 19 · 6:00 PM</span><h3>Faith That Shows Up</h3><p>James 1:1–4 · Group study</p></div><span className={styles.statusPill}>Registration open</span></div><div className={styles.eventCardMeta}><span>9 of 15 registered</span><span>Free · Adults 18+</span><span>Shared with: Men’s Forge</span></div><button className={styles.outlineButton} onClick={() => onOpen("Sample event detail: approved group members can register at no cost. This preview includes no live attendee list.")}>Review event</button></li>
      <li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>The Hearth · Sat, Nov 21 · 5:30 PM</span><h3>Faithful Together</h3><p>Ephesians 5:21–33 · Interactive workshop</p></div><span className={styles.statusPill}>Registration open</span></div><div className={styles.eventCardMeta}><span>6 of 12 registered</span><span>Free · Adults 18+</span><span>Assigned: Hearth facilitators</span></div><button className={styles.outlineButton} onClick={() => onOpen("Sample event detail: registration and facilitator assignment are shown for review only. No event changed.")}>Review event</button></li>
      <li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>Prayer ministry · Sun, Nov 22 · 9:00 AM</span><h3>Prayer team gathering</h3><p>Prayer &amp; encouragement</p></div><span className={styles.statusPill}>No registration</span></div><div className={styles.eventCardMeta}><span>Shared with: Prayer team</span><span>Free · Adults 18+</span><span>Assigned: Prayer leaders</span></div><button className={styles.outlineButton} onClick={() => onOpen("Sample event detail: role-limited gathering; no registration or attendee records loaded.")}>Review event</button></li>
    </ul>}
    {view === "Registrations" && <><p className={styles.approvalIntro}>View responses for gatherings that require registration. No payment is collected.</p><ul className={styles.accessList}><li><div><strong>Faith That Shows Up</strong><span>Men’s Forge · registration open</span><div className={styles.registrationCapacity}><div><span>9 of 15 registered</span><strong>6 spaces left</strong></div><progress aria-label="Faith That Shows Up: 9 of 15 places filled" max={15} value={9}>9 of 15 places filled</progress></div></div><span className={styles.statusPill}>Open</span></li><li><div><strong>Faithful Together</strong><span>The Hearth · registration open</span><div className={styles.registrationCapacity}><div><span>6 of 12 registered</span><strong>6 spaces left</strong></div><progress aria-label="Faithful Together: 6 of 12 places filled" max={12} value={6}>6 of 12 places filled</progress></div></div><span className={styles.statusPill}>Open</span></li></ul><p className={styles.ownerRule}>Sample attendee names and contact details are not shown in this overview.</p></>}
    {view === "Drafts" && <ul className={styles.eventList}><li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>Draft · Outreach</span><h3>Serve team preparation</h3><p>Date and assignments still need review.</p></div><span className={styles.statusPill}>Not published</span></div><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this would return to the event planner. No draft was changed.")}>Continue draft</button></li></ul>}
    <p className={styles.caption}>Sample events only · no signups, messages, payments, or schedule changes</p>
    {showPlanner && <EventPlanner onOpen={onOpen} onClose={() => setShowPlanner(false)}/>}
  </section>;
}

function EventPlanner({ onOpen, onClose }: { onOpen: (message: string) => void; onClose: () => void }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [title, setTitle] = useState("");
  const [ministry, setMinistry] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [registration, setRegistration] = useState("Registration required");
  const [registrationLimit, setRegistrationLimit] = useState("");
  const [audienceType, setAudienceType] = useState<"group" | "role" | "all">("group");
  const [audienceScope, setAudienceScope] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const minDate = new Date().toISOString().slice(0, 10);
  const audienceOptions: Record<string, { group: string[]; role: string[] }> = {
    "Men’s Forge": { group: ["Men’s Forge"], role: ["Study facilitator"] },
    "The Hearth": { group: ["The Hearth"], role: ["Ministry leader"] },
    "Prayer ministry": { group: ["Prayer ministry"], role: ["Prayer team", "Ministry leader"] },
    Outreach: { group: ["Outreach Serve Team"], role: ["Serve team"] },
  };
  const scopes = ministry ? audienceOptions[ministry][audienceType === "all" ? "group" : audienceType] : [];
  const valid = Boolean(title.trim() && ministry && date >= minDate && time && location.trim() && (!registrationLimit || (Number.isInteger(Number(registrationLimit)) && Number(registrationLimit) >= 1)) && (audienceType === "all" || audienceScope));
  const audienceSummary = audienceType === "all" ? "All L&F members · adults 18+" : audienceType === "group" ? `Group participants · ${audienceScope}` : `Approved role holders · ${audienceScope}`;
  const resetReview = () => setReviewing(false);
  return <div className={styles.modalBackdrop}><section ref={dialogRef} tabIndex={-1} className={`${styles.eventDialog} ${styles.eventPlanner}`} role="dialog" aria-modal="true" aria-labelledby="event-planner-title">
    <div className={styles.eventCardTop}><div><p className={styles.eyebrow}>Event setup</p><h2 id="event-planner-title">Plan a gathering</h2></div><button className={styles.outlineButton} onClick={onClose}>Close</button></div>
    <p className={styles.eventDialogIntro}>Set the audience and practical details before a gathering is shared. Events are free and adults only.</p>
    {!reviewing ? <>
      <div className={styles.eventFormGrid}>
        <label>Event name<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this gathering"/></label>
        <label>Ministry<select required value={ministry} onChange={(event) => { const next = event.target.value; setMinistry(next); setAudienceScope(next ? audienceOptions[next].group[0] : ""); setAudienceType("group"); resetReview(); }}><option value="">Select a ministry</option>{Object.keys(audienceOptions).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Date<input required type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)}/></label>
        <label>Start time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)}/></label>
        <label>Location or meeting link<input required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Venue or online details"/></label>
        <label>Registration<select value={registration} onChange={(event) => { const next = event.target.value; setRegistration(next); if (next === "No registration") setRegistrationLimit(""); }}><option>Registration required</option><option>No registration</option></select></label>
        {registration === "Registration required" && <label>Registration limit (optional)<input type="number" min="1" step="1" inputMode="numeric" value={registrationLimit} onChange={(event) => setRegistrationLimit(event.target.value)} placeholder="No limit"/><span className={styles.caption}>Leave blank for an event without a set capacity.</span></label>}
        <label>Who can attend?<select value={audienceType} onChange={(event) => { const next = event.target.value as "group" | "role" | "all"; setAudienceType(next); setAudienceScope(next === "role" ? (ministry ? audienceOptions[ministry].role[0] : "") : next === "group" ? (ministry ? audienceOptions[ministry].group[0] : "") : ""); resetReview(); }}><option value="group">Selected group</option><option value="role">Approved role holders</option><option value="all">All L&amp;F members</option></select></label>
        {audienceType !== "all" && <label>{audienceType === "role" ? "Approved role" : "Group audience"}<select required disabled={!ministry} value={audienceScope} onChange={(event) => { setAudienceScope(event.target.value); resetReview(); }}><option value="">Choose ministry first</option>{scopes.map((item) => <option key={item}>{item}</option>)}</select></label>}
      </div>
      <div className={styles.eventAccessNote}><strong>Adults 18+ only</strong><span>{audienceType === "role" ? "Only members with the approved role in this scope can access role-shared details. Assigned event work is shown separately." : audienceType === "group" ? "Only members of the selected group can see this event and register." : "The event is available to L&F members; it remains limited to adults 18+."}</span></div>
      <p className={styles.eventFreeNote}>Free participation · no payment field</p>
      <div className={styles.requestActions}><button className={styles.primaryButton} disabled={!valid} onClick={() => setReviewing(true)}>Review event details</button><button className={styles.outlineButton} onClick={onClose}>Cancel</button></div>
    </> : <section className={styles.eventReviewPanel} aria-labelledby="event-review-title">
      <p className={styles.requestLabel}>Review before saving</p><h3 id="event-review-title">{title}</h3>
      <dl className={styles.eventReviewDetails}><div><dt>Ministry</dt><dd>{ministry}</dd></div><div><dt>Audience</dt><dd>{audienceSummary}</dd></div><div><dt>When</dt><dd>{date} · {time}</dd></div><div><dt>Where</dt><dd>{location}</dd></div><div><dt>Registration</dt><dd>{registration}{registration === "Registration required" ? ` · ${registrationLimit ? `Limit ${registrationLimit}` : "No limit"}` : ""}</dd></div><div><dt>Cost and age</dt><dd>Free · adults 18+ only</dd></div></dl>
      <p>Being assigned event work does not grant access to the event audience. Only authorized roles and memberships control visibility.</p>
      <div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setReviewing(false)}>Edit details</button><button className={styles.primaryButton} onClick={() => { onOpen(`Sample only: “${title}” would be saved as a draft for ${audienceSummary}${registration === "Registration required" ? ` with ${registrationLimit ? `a limit of ${registrationLimit}` : "no registration limit"}` : " without registration"}. It is free and adults-only; no event was created or shared.`); onClose(); }}>Confirm sample draft</button></div>
    </section>}
    <p className={styles.caption}>Sample-only planning · no event, registration, payment, notification, or access change is saved</p>
  </section></div>;
}

function StudyWorkspace({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("Study library");
  const views = ["Study library", "Groups & pacing", "Emmaus connection"];
  return <section className={styles.panel} aria-label="Studies workspace preview">
    <div className={styles.approvalHeading}><SectionTitle title="Studies" help="Organize Scripture-centered series, prepare group sessions, and connect members to Emmaus. This is a design preview; study content and progress are not loaded or changed."/><p>Scripture first · people growing together</p></div>
    <div className={styles.approvalTabs} role="group" aria-label="Studies views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    {view === "Study library" && <><p className={styles.approvalIntro}>Browse studies by series, Scripture passage, and stage of preparation.</p><ul className={styles.studyList}>
      <li><div><span className={styles.requestLabel}>Men’s study · In preparation</span><h3>Faith That Shows Up</h3><p>James 1:1–4 · Session 1</p><small>Designed for shared discovery, Scripture reading, and group discussion.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Study preview only: this opens a sample session. No content or study progress changed.")}>Preview</button></li>
      <li><div><span className={styles.requestLabel}>Book by book · Sample series</span><h3>1 Samuel</h3><p>1 Samuel 1–2 · Passage walkthrough</p><small>Read the passage together, notice what it reveals about God, then discuss faithful response.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Study preview only: this opens a sample passage walkthrough. No content or progress changed.")}>Preview</button></li>
      <li><div><span className={styles.requestLabel}>Couples · Planning</span><h3>The Hearth</h3><p>Ephesians 5:21–33 · Interactive workshop</p><small>Every other week · 90-minute gathering</small></div><button className={styles.outlineButton} onClick={() => onOpen("Study preview only: this opens a sample workshop outline. No content or group schedule changed.")}>Preview</button></li>
    </ul><button className={styles.primaryButton} onClick={() => onOpen("Sample only: a guided study setup would ask for Scripture, session goals, audience, and facilitator. Nothing was created.")}>Plan a study</button></>}
    {view === "Groups & pacing" && <><p className={styles.approvalIntro}>Give each group a clear path through the material and enough time for people to participate.</p><ul className={styles.accessList}><li><div><strong>Men’s Forge</strong><span>Faith That Shows Up · Session 1 · Facilitator-led discussion</span></div><span className={styles.statusPill}>In progress</span></li><li><div><strong>The Hearth</strong><span>Faith &amp; relationships · Every other week · 90 minutes</span></div><span className={styles.statusPill}>Planning</span></li><li><div><strong>Book by Book</strong><span>1 Samuel · Passage-by-passage group study</span></div><span className={styles.statusPill}>Preparing</span></li></ul><p className={styles.ownerRule}>Members’ study progress belongs to their account and is not included in this sample.</p></>}
    {view === "Emmaus connection" && <><p className={styles.approvalIntro}>Keep the existing Emmaus sign-in connection in place while the study experience is rebuilt.</p><div className={styles.delegationCard}><div><span className={styles.requestLabel}>Existing account connection</span><h3>Emmaus login</h3><p>Connected · preserve current sign-in behavior</p></div><span className={styles.statusPill}>Connected</span></div><div className={styles.studyIntegration}><strong>Study sharing and progress</strong><p>Plan how a member can open an Emmaus study from L&amp;F and return to their saved place. Content and progress sync still need a defined integration contract.</p><button className={styles.outlineButton} onClick={() => onOpen("Integration planning preview: sign-in is already connected. Study access and progress sync require a separate design and are not changed here.")}>Review integration plan</button></div></>}
    <p className={styles.caption}>Illustrative study workspace · no Emmaus content, progress, accounts, or group schedules were changed</p>
  </section>;
}


function InsightsWorkspace() {
  const sections = [
    { title: "Age bands", note: "Derived from optional birth dates supplied by members; exact dates are never displayed.", rows: [{ label: "18–29", value: 12 }, { label: "30–44", value: 28 }, { label: "45–59", value: 21 }, { label: "60+", value: 11 }] },
    { title: "Ministry interests", note: "Members may choose more than one interest.", rows: [{ label: "Bible studies", value: 43 }, { label: "Prayer ministry", value: 26 }, { label: "Men’s Forge", value: 18 }, { label: "The Hearth", value: 12 }] },
    { title: "How people heard about L&F", note: "Small categories are hidden in this proposal.", rows: [{ label: "Friend or family", value: 31 }, { label: "Church or ministry partner", value: 20 }, { label: "Online search", value: 13 }, { label: "Event", value: 11 }, { label: "Other small categories", value: "Suppressed" }] },
    { title: "Broad region", note: "State-level answers only; no precise location.", rows: [{ label: "North Carolina", value: 57 }, { label: "Other states", value: 11 }, { label: "Not provided", value: 74 }] },
  ] as const;
  const responseSummary = [["Birth date", "72 of 142"], ["Ministry interests", "98 of 142"], ["Referral source", "84 of 142"], ["Broad region", "68 of 142"]];
  return <section className={styles.panel} aria-label="Aggregate ministry insights sample">
    <div className={styles.approvalHeading}><SectionTitle title="Ministry insights" help="Aggregate planning view only. Do not use these trends to score members, decide role approval, or expose individual answers."/><p>Plan support around the people you serve</p></div>
    <p className={styles.approvalIntro}>Synthetic sample totals only · no member names, individual answers, raw birth dates, or member-level exports appear here.</p>
    <div className={styles.insightSummary}><h2>Optional response coverage</h2><dl>{responseSummary.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
    <div className={styles.insightGrid}>{sections.map((section) => {
      const maximum = Math.max(...section.rows.flatMap((row) => typeof row.value === "number" ? [row.value] : []), 1);
      return <section className={styles.insightSection} key={section.title}><h2>{section.title}</h2><p>{section.note}</p><ul>{section.rows.map((row) => <li key={row.label}><span>{row.label}</span>{typeof row.value === "number" ? <progress value={row.value} max={maximum} aria-label={row.label + " sample responses"}/> : <span className={styles.insightSuppressed}>Suppressed</span>}{typeof row.value === "number" && <strong>{row.value}</strong>}</li>)}</ul></section>;
    })}</div>
    <div className={styles.insightPrivacy}><strong>Privacy guardrail proposal</strong><p>Hide demographic breakdowns with fewer than 10 people, prevent combinations of filters that could identify someone, and retain no individual score or leaderboard. Confirm this threshold and reporting access before implementation.</p></div>
    <p className={styles.caption}>Illustrative data only · aggregate trends cannot grant or remove access</p>
  </section>;
}

function NotificationSettings({ onOpen }: { onOpen: (message: string) => void }) {
  const categories = [
    ["prayer", "Prayer care and updates", "A response or authorized care update about your own prayer requests."],
    ["encouragement", "Praise and encouragement", "Reactions or encouragement on content you have chosen to share."],
    ["groups", "Groups and ministries", "Updates for groups you have joined and ministry roles you hold."],
    ["access", "Roles and group access", "Request decisions, invitations, and access-expiry reminders."],
    ["events", "Events and registrations", "Registration confirmations, schedule changes, or cancellations."],
    ["work", "Assigned work and studies", "Tasks assigned to you and study updates within your approved scope."],
  ] as const;
  const channels = ["In-app", "Email", "Push"] as const;
  type Channel = (typeof channels)[number];
  const [enabled, setEnabled] = useState<Record<string, Record<Channel, boolean>>>(() =>
    Object.fromEntries(categories.map(([id]) => [id, { "In-app": true, Email: true, Push: true }])) as Record<string, Record<Channel, boolean>>
  );
  const [showPrompt, setShowPrompt] = useState(false);
  const [devicePushEnabled, setDevicePushEnabled] = useState(false);
  const hasPushCategories = categories.some(([id]) => enabled[id].Push);
  const pushDialogRef = useDialogAccessibility(() => setShowPrompt(false), showPrompt);
  function toggleChannel(category: string, channel: Channel, checked: boolean) {
    setEnabled((current) => ({ ...current, [category]: { ...current[category], [channel]: checked } }));
  }
  return <section className={styles.panel} aria-label="Notification settings preview">
    <div className={styles.approvalHeading}><SectionTitle title="Notification settings" help="New categories start enabled by channel. Turn off an individual category in-app, email, or push preference without changing the others. Device permission still controls whether push can be delivered." /><p>Choose what reaches you</p></div>
    <p className={styles.approvalIntro}>Each category starts on for in-app, email, and push. Switch off only the channel you do not want. Required account-security notices stay on.</p>
    <div className={styles.notificationList} aria-label="Optional notification categories">{categories.map(([id, title, description]) => <fieldset className={styles.notificationCategory} key={id}>
      <legend>{title}</legend><p>{description}</p><div className={styles.notificationChannels} role="group" aria-label={title + " delivery channels"}>{channels.map((channel) => <label key={channel}><input type="checkbox" checked={enabled[id][channel]} onChange={(event) => toggleChannel(id, channel, event.target.checked)}/><span>{channel}</span></label>)}</div>
    </fieldset>)}</div>
    <div className={styles.requiredNotice}><strong>Account and security notices · Always on</strong><p>Email confirmation, password reset, and essential account-security messages are not controlled by ministry notification preferences.</p></div>
    <div className={styles.notificationPrivacy}><strong>Private details stay private</strong><p>Prayer text, care notes, and meeting links should not appear in email subjects or lock-screen previews. Open L&amp;F to view protected details.</p></div>
    <div className={styles.pushPromptCard}><div><strong>Push notifications for this device</strong><p>{devicePushEnabled ? "This sample device is opted in. Removing it does not change your email or in-app choices." : "The sign-in prompt appears on a device that has not opted in. If permission is declined, in-app and email choices remain available; device permission can be changed in browser settings."}</p></div>{devicePushEnabled ? <button className={styles.outlineButton} onClick={() => { setDevicePushEnabled(false); onOpen("Sample only: push would be unsubscribed on this device. Other devices and channels remain unchanged."); }}>Remove this device</button> : <button className={styles.outlineButton} disabled={!hasPushCategories} onClick={() => setShowPrompt(true)}>Preview sign-in prompt</button>}</div>
    <p className={styles.caption}>Sample preferences · changes stay on this screen and are not saved</p>
    {showPrompt && <div className={styles.modalBackdrop}><section ref={pushDialogRef} tabIndex={-1} className={styles.pushDialog} role="dialog" aria-modal="true" aria-labelledby="push-dialog-title" aria-describedby="push-dialog-description"><p className={styles.eyebrow}>L&amp;F notifications</p><h2 id="push-dialog-title">Stay connected.</h2><p id="push-dialog-description">Choose Enable to ask this device for push permission. Only categories you keep enabled can send push. If you choose Not now or deny permission, your other notification choices stay available.</p><div className={styles.requestActions}><button className={styles.primaryButton} disabled={!hasPushCategories} onClick={() => { setShowPrompt(false); setDevicePushEnabled(true); onOpen("Sample only: after your sign-in gesture, the live app would request browser permission and create this device subscription only if granted. The sample now shows this device as opted in; no permission was requested."); }}>Enable push notifications</button><button className={styles.outlineButton} onClick={() => { setShowPrompt(false); onOpen("Sample only: push setup can be revisited in Settings. No browser permission was requested."); }}>Not now</button></div></section></div>}
  </section>;
}


function ProfileSharing() {
  const fields = [
    ["name", "Directory name", "Your name on the L&F member directory."],
    ["photo", "Profile photo", "Your selected profile image."],
    ["story", "Faith story", "The story you have chosen to share about your faith."],
    ["scripture", "Favorite Scripture", "The passage you selected for your profile."],
    ["salvation", "Date of salvation", "A faith milestone date saved on your profile."],
    ["baptism", "Date of baptism", "A baptism milestone date saved on your profile."],
    ["email", "Email address", "Contact detail · requires an extra confirmation before sharing."],
    ["phone", "Phone number", "Contact detail · requires an extra confirmation before sharing."],
  ] as const;
  const groupOptions = ["Men’s Forge", "Prayer Team", "The Hearth"];
  const [directoryEnabled, setDirectoryEnabled] = useState(false);
  const [shared, setShared] = useState<Record<string, boolean>>({ name: false, photo: false, story: false, scripture: false, salvation: false, baptism: false, email: false, phone: false });
  const [audiences, setAudiences] = useState<Record<string, string>>({
    name: "Selected groups / ministry spaces", photo: "Selected groups / ministry spaces",
    story: "Selected groups / ministry spaces", scripture: "Selected groups / ministry spaces",
    salvation: "Selected groups / ministry spaces", baptism: "Selected groups / ministry spaces",
    email: "Selected groups / ministry spaces", phone: "Selected groups / ministry spaces",
  });
  const [selectedSpaces, setSelectedSpaces] = useState<Record<string, string[]>>({});
  const selectedAudience = (id: string) => audiences[id] === "All L&F members"
    ? "All L&F members"
    : (selectedSpaces[id] ?? []).join(", ");
  const visibleFields = directoryEnabled
    ? fields.filter(([id]) => shared[id] && selectedAudience(id).length > 0)
    : [];
  const toggleSpace = (id: string, space: string, checked: boolean) => setSelectedSpaces((current) => {
    const nextSpaces = new Set(current[id] ?? []);
    if (checked) nextSpaces.add(space); else nextSpaces.delete(space);
    return { ...current, [id]: Array.from(nextSpaces) };
  });
  return <section className={styles.panel} aria-label="Profile sharing preview">
    <div className={styles.approvalHeading}><SectionTitle title="Profile sharing" help="Choose whether your directory profile appears and control each field separately. Birth date is never shared. Group and ministry visibility is limited to people with current access."/><p>Choose what other members can see</p></div>
    <p className={styles.approvalIntro}>Directory inclusion and every field start private. Turn on only what you choose.</p>
    <label className={styles.directoryOptIn}><input type="checkbox" checked={directoryEnabled} onChange={(event) => setDirectoryEnabled(event.target.checked)}/> Include my profile in the L&amp;F member directory</label>
    <div className={styles.profileSharingGrid}><div className={styles.notificationList}>{fields.map(([id, title, description]) => <div className={styles.notificationRow} key={id}>
      <label className={styles.notificationCopy}><strong>{title}</strong><small>{description}</small><span className={styles.profileFieldToggle}><input type="checkbox" checked={shared[id]} disabled={!directoryEnabled} onChange={(event) => setShared((current) => ({ ...current, [id]: event.target.checked }))} aria-label={"Share " + title}/> Share this field</span></label>
      <div className={styles.profileAudienceControl}><label htmlFor={"profile-audience-" + id}>Audience</label>
        <select id={"profile-audience-" + id} value={audiences[id]} disabled={!directoryEnabled || !shared[id]} onChange={(event) => setAudiences((current) => ({ ...current, [id]: event.target.value }))}>
          <option>Selected groups / ministry spaces</option>
          <option>All L&amp;F members</option>
        </select>
        {directoryEnabled && shared[id] && audiences[id] === "Selected groups / ministry spaces" && <fieldset className={styles.profileScopeChoices}>
          <legend>Choose accepted spaces</legend>
          {groupOptions.map((space) => <label key={space}><input type="checkbox" checked={(selectedSpaces[id] ?? []).includes(space)} onChange={(event) => toggleSpace(id, space, event.target.checked)}/>{space}</label>)}
          <small>Only members with current access can see this field.</small>
        </fieldset>}
      </div>
    </div>)}</div>
      <aside className={styles.profilePreview} aria-live="polite"><p className={styles.eyebrow}>Member preview</p><h3>What others can see</h3>{visibleFields.length ? <ul>{visibleFields.map(([id, title]) => <li key={id}><span aria-hidden="true">✓</span><span>{title}<small>Visible to {selectedAudience(id)}</small></span></li>)}</ul> : <p className={styles.emptyProfile}>{directoryEnabled ? "Choose a field and at least one audience to preview what is shared." : "Your profile is not included in the directory."}</p>}<p className={styles.profilePrivacyNote}>Birth date, gender, roles, account status, availability, assignments, and internal notes are not shown in the directory. Group and ministry access is checked again whenever a profile is viewed.</p></aside>
    </div>
    <p className={styles.caption}>Sample privacy choices · no profile changes are saved</p>
  </section>;
}

function AccountDataSettings({ onOpen }: { onOpen: (message: string) => void }) {
  const [showExport, setShowExport] = useState(false);
  const [showRemoval, setShowRemoval] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [retentionAcknowledged, setRetentionAcknowledged] = useState(false);
  const exportDialogRef = useDialogAccessibility(() => setShowExport(false), showExport);
  const removalDialogRef = useDialogAccessibility(() => setShowRemoval(false), showRemoval);
  return <section className={styles.panel} aria-label="Account and data preview">
    <div className={styles.approvalHeading}><SectionTitle title="Account & data" help="Members should be able to take their personal information and content with them when they leave. This preview shows the intended flow; it does not export or delete real data."/><p>Your information stays under your control</p></div>
    <div className={styles.dataActionCard}><div><span className={styles.requestLabel}>Download a copy</span><h3>Export my data</h3><p>Review your profile, prayer requests, study progress, event registrations, and other content linked to your account.</p></div><button className={styles.outlineButton} onClick={() => setShowExport(true)}>Review export contents</button></div>
    <div className={styles.dataRemovalCard}><div><span className={styles.requestLabel}>Leaving L&amp;F</span><h3>Remove my account and data</h3><p>The planned removal covers your profile, authored prayer content, saved study progress, event registrations, preferences, and other personal content linked to your L&amp;F account.</p><p className={styles.requestMeta}>Your membership and ministry roles end with account removal. Connected Emmaus data belongs in the same export and removal checklist.</p></div><button className={styles.dangerButton} onClick={() => {setConfirmation("");setRetentionAcknowledged(false);setShowRemoval(true);}}>Review removal</button></div>
    <p className={styles.caption}>Preview only · no export, account removal, or data changes are performed</p>
    {showExport && <div className={styles.modalBackdrop}><section ref={exportDialogRef} tabIndex={-1} className={`${styles.eventDialog} ${styles.exportDialog}`} role="dialog" aria-modal="true" aria-labelledby="export-title" aria-describedby="export-description"><p className={styles.eyebrow}>Personal data export</p><h2 id="export-title">Review what you’ll receive.</h2><p id="export-description" className={styles.eventDialogIntro}>A real export should include information connected to your L&amp;F account while protecting other people’s private information.</p><div className={styles.exportColumns}><section><h3>Included in the plan</h3><ul><li>Profile and account preferences</li><li>Your authored prayer, praise, and testimony content</li><li>Your group and ministry memberships</li><li>Your study progress and personal responses</li><li>Calendar and registration records when available</li><li>Your own uploads</li><li>Connected Emmaus personal data available through the verified account link</li></ul></section><section><h3>Not included</h3><ul><li>Another person’s private information</li><li>Private care notes or moderator-only content</li><li>Shared studies or resources you do not own</li><li>Personal data from other apps outside this L&amp;F and Emmaus export</li></ul></section></div><div className={styles.exportFormat}><strong>Planned package</strong><p>A ZIP with a readable index and structured JSON/CSV files. A live download would require a recent sign-in and use a short-lived link; it would not be emailed or kept as a permanent archive.</p></div><div className={styles.requestActions}><button className={styles.primaryButton} onClick={() => { setShowExport(false); onOpen("Sample only: a fresh sign-in check and short-lived download would be next. No data was exported."); }}>Continue to sign-in check</button><button className={styles.outlineButton} onClick={() => setShowExport(false)}>Close</button></div><p className={styles.caption}>Design preview only · no account data was read or exported</p></section></div>}
    {showRemoval && <div className={styles.modalBackdrop}><section ref={removalDialogRef} tabIndex={-1} className={`${styles.eventDialog} ${styles.removalDialog}`} role="dialog" aria-modal="true" aria-labelledby="removal-title" aria-describedby="removal-description"><p className={styles.eyebrow}>Account removal</p><h2 id="removal-title">Take your information with you.</h2><p id="removal-description" className={styles.eventDialogIntro}>The goal is to remove your L&amp;F personal data and coordinate removal of your connected Emmaus personal data. The live app must finish its preflight and confirm both systems before calling removal complete.</p><div className={styles.departureColumns}><section><h3>Personal data planned for removal</h3><ul><li>Profile, contact details, and preferences</li><li>Personal prayer activity and reactions</li><li>Group and ministry participation and approved roles</li><li>Study progress, responses, and personal notes</li><li>Event registrations and device push subscriptions</li><li>Connected Emmaus personal data after its system confirms removal</li></ul></section><section><h3>Items that may need separate handling</h3><ul><li>Shared studies or resources other members still use may need an owner transfer or removal of your attribution.</li><li>Public or shared content will be reviewed under the removal policy before deletion or anonymization.</li><li>Financial, safety, or audit records may be retained only when a documented requirement applies.</li><li>Removal must not be marked complete if the Emmaus step fails; the request needs a visible status and retry path.</li></ul></section></div><div className={styles.departureBoundary}><strong>Before a real request is enabled</strong><p>The ministry must approve retention rules and the scope of the shared L&amp;F sign-in across products. A preflight must list anything that cannot be removed, explain why, and give you a way to export your information first.</p></div><label className={styles.departureAcknowledgement}><input type="checkbox" checked={retentionAcknowledged} onChange={(event) => setRetentionAcknowledged(event.target.checked)}/><span>I have reviewed the shared-content and retention notes above.</span></label><label className={styles.confirmRemoval}>Type REMOVE to preview the final step<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off"/></label><div className={styles.requestActions}><button className={styles.dangerButton} disabled={confirmation !== "REMOVE" || !retentionAcknowledged} onClick={() => {setShowRemoval(false);onOpen("Sample only: the export and removal preflight would begin, and completion would wait for both L&F and Emmaus confirmation. No account or content was removed.");}}>Continue to final review</button><button className={styles.outlineButton} onClick={() => setShowRemoval(false)}>Cancel</button></div><p className={styles.caption}>Preview only · no account or content was removed</p></section></div>}
  </section>;
}

function SettingsWorkspace({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("Notifications");
  return <div className={styles.settingsWorkspace}>
    <div className={styles.approvalTabs} role="group" aria-label="Settings views">{["Notifications", "Profile sharing", "Account & data"].map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>
    {view === "Notifications" ? <NotificationSettings onOpen={onOpen}/> : view === "Profile sharing" ? <ProfileSharing/> : <AccountDataSettings onOpen={onOpen}/>}
  </div>;
}

function Calendar({ personal = false }: { personal?: boolean }) {
  const [scope, setScope] = useState<CalendarScope>(personal ? "Personal calendar" : "Master calendar");
  const [filter, setFilter] = useState<CalendarFilter>("All");
  const [ministry, setMinistry] = useState("All ministries");
  const [role, setRole] = useState("All roles");
  const events = filterPreviewEvents(previewEvents, scope, filter, ministry, role);
  return <section className={styles.panel} aria-label="Calendar preview"><div className={styles.calendarHeading}><SectionTitle title={personal ? "My calendar" : "Calendar"} help="Master and personal calendars combine ministry, role, assignment, and sharing filters. In the live app, the server will enforce access from approved roles and event assignments; filters here use sample data only." /><label className={styles.selectLabel}>Calendar view<select value={scope} onChange={(event) => setScope(event.target.value as CalendarScope)}>{!personal && <option>Master calendar</option>}<option>Personal calendar</option></select></label></div><div className={styles.calendarControls}><div className={styles.filterGroup} role="group" aria-label="Calendar filters">{calendarFilters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className={styles.calendarSelects}><label className={styles.selectLabel}>Ministry<select value={ministry} onChange={(event) => setMinistry(event.target.value)}><option>All ministries</option><option>Studies</option><option>Outreach</option><option>Prayer</option></select></label><label className={styles.selectLabel}>Role<select value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option><option>Study facilitator</option><option>Men’s Forge</option><option>Serve team</option><option>Ministry leader</option><option>Prayer team</option></select></label></div></div><details className={styles.calendarAccess}><summary>How role and assignment sharing works</summary><p>Each event is visible only to people with an approved role for that ministry or to people directly assigned to it. Personal events stay private unless the member shares them. The role filter narrows this sample view; it does not grant access.</p></details><div aria-live="polite" aria-atomic="true"><p className={styles.resultCount}>{events.length + (events.length === 1 ? " sample event" : " sample events")}</p>{events.length ? <ul className={styles.agenda}>{events.map((event) => <li key={event.id}><span className={styles.eventDate}>{event.date}</span><time>{event.time}</time><div><strong>{event.title}</strong><span>{event.assigned ? "Assigned to you" : event.shared ? "Shared with your role" : "My event"}<small className={styles.eventAccess}>Roles: {event.roles.join(", ")} · Assigned: {event.assignee}</small></span></div></li>)}</ul> : <p className={styles.empty}>No sample events match these filters. Choose All or another ministry.</p>}</div><p className={styles.caption}>Design preview · sample events, roles, and assignments only</p></section>;
}

function PrayerComposer({ member, onClose, onSubmit }: { member: boolean; onClose: () => void; onSubmit: (message: string) => void }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [request, setRequest] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [audience, setAudience] = useState("Prayer team only");
  const [group, setGroup] = useState("Men’s Bible study");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const visibility = !member ? "public after moderator review" : audience === "One accepted group" ? group : audience;
    onSubmit(`Sample only: prayer request would be shared with ${visibility}. No request was submitted or saved.`);
    onClose();
  }
  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form ref={dialogRef} tabIndex={-1} className={styles.prayerDialog} role="dialog" aria-modal="true" aria-labelledby="prayer-composer-title" onSubmit={submit}><div className={styles.eventCardTop}><div><p className={styles.eyebrow}>{member ? "Member prayer" : "Visitor prayer"}</p><h2 id="prayer-composer-title">Submit a prayer request</h2></div><button type="button" className={styles.outlineButton} onClick={onClose}>Close</button></div><p className={styles.eventDialogIntro}>{member ? "Choose who may see this request. A moderator cannot expand the audience you choose." : "Visitor requests are public-only. They stay hidden from everyone until a moderator clears them for public sharing."}</p>{!member && <div className={styles.visitorPrayerNotice}><strong>Anyone may read this after it is cleared.</strong><p>Leave out names, contact details, and anything you need kept private. You do not need to create an account or share contact information.</p><p>The live form will include a spam check. This sample preview does not submit anything.</p></div>}<label className={styles.prayerField}>Prayer request<textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={5} placeholder="What would you like prayer for?" required /></label>{!member && <label className={styles.prayerCheck}><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} /><span>I confirm I am 18 or older.</span></label>}{member ? <div className={styles.prayerAudience}><label className={styles.selectLabel}>Who may see this?<select value={audience} onChange={(event) => setAudience(event.target.value)}><option>Prayer team only</option><option>One accepted group</option><option>Public after moderator review</option></select></label>{audience === "One accepted group" && <label className={styles.selectLabel}>Accepted group<select value={group} onChange={(event) => setGroup(event.target.value)}><option>Men’s Bible study</option><option>Prayer ministry</option></select></label>}<p>Moderators cannot broaden your selected audience. Public requests appear only after review.</p></div> : <label className={styles.prayerCheck}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>I understand this request may be shared publicly after moderator review.</span></label>}<div className={styles.requestActions}><button type="button" className={styles.outlineButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={!request.trim() || (!member && (!adultConfirmed || !acknowledged))}>{member ? "Submit prayer request" : "Submit for review"}</button></div><p className={styles.caption}>Design preview only · nothing is sent or saved</p></form></div>;
}

function CareCheckIn({ onClose, onSubmit }: { onClose: () => void; onSubmit: (message: string) => void }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit("Sample only: a care check-in would be routed to an authorized, assigned ministry leader. No information was sent or saved.");
    onClose();
  }
  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form ref={dialogRef} tabIndex={-1} className={styles.prayerDialog} role="dialog" aria-modal="true" aria-labelledby="care-checkin-title" onSubmit={submit}><div className={styles.eventCardTop}><div><p className={styles.eyebrow}>Your care matters</p><h2 id="care-checkin-title">How are you doing?</h2></div><button type="button" className={styles.outlineButton} onClick={onClose}>Close</button></div><p className={styles.eventDialogIntro}>This is a private check-in request for an authorized, assigned ministry leader. It does not appear in public Prayer &amp; Praise and does not start a member-to-member chat.</p><fieldset className={styles.careChoices}><legend>Choose what best fits today</legend>{[["doing-well", "I’m doing okay"], ["prayer", "I could use prayer"], ["follow-up", "I’d appreciate a personal check-in"]].map(([value, label]) => <label key={value}><input type="radio" name="care-choice" value={value} checked={choice === value} onChange={() => setChoice(value)}/><span>{label}</span></label>)}</fieldset><label className={styles.prayerField}>Anything you’d like your leader to know? <span className={styles.optionalLabel}>Optional</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Share only what you are comfortable sharing." /></label><label className={styles.prayerCheck}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)}/><span>I understand this would be visible only to authorized leaders assigned to care for me.</span></label><div className={styles.requestActions}><button type="button" className={styles.outlineButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={!choice || !acknowledged}>Request a check-in</button></div><p className={styles.caption}>Design preview only · no response or note is sent or saved</p></form></div>;
}

function MemberGatherings({ onOpen }: { onOpen: (message: string) => void }) {
  const [showRegister, setShowRegister] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const registrationDialogRef = useDialogAccessibility(() => { setShowRegister(false); setAcknowledged(false); }, showRegister);
  function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onOpen("Sample only: your free Men’s Forge registration would be recorded. No registration was created and no payment was collected.");
    setShowRegister(false);
    setAcknowledged(false);
  }
  return <><section className={styles.panel} aria-label="Upcoming gatherings"><div className={styles.approvalHeading}><SectionTitle title="Upcoming gatherings" help="See events shared with groups you have joined. Registration is free; the event’s audience and any capacity limit are shown before you respond."/><p>Take part in your accepted groups</p></div><ul className={styles.eventList}><li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>Men’s Forge · Thu, Nov 19 · 6:00 PM</span><h3>Faith That Shows Up</h3><p>James 1:1–4 · Group Bible study</p></div><span className={styles.statusPill}>Registration open</span></div><div className={styles.eventCardMeta}><span>9 of 15 registered · 6 spaces remain</span><span>Free · Adults 18+</span><span>For accepted Men’s Forge members</span></div><button className={styles.primaryButton} onClick={() => setShowRegister(true)}>View and register</button></li><li><div className={styles.eventCardTop}><div><span className={styles.requestLabel}>Prayer ministry · Sun, Nov 22 · 9:00 AM</span><h3>Prayer team gathering</h3><p>Prayer and encouragement</p></div><span className={styles.statusPill}>No registration</span></div><div className={styles.eventCardMeta}><span>Free · Adults 18+</span><span>Shared with: Prayer ministry</span></div><button className={styles.outlineButton} onClick={() => onOpen("Sample event details: this gathering is visible through your accepted Prayer ministry group. No event or member data was loaded.")}>View details</button></li></ul><p className={styles.caption}>Sample events only · no signups, payments, or calendar changes</p></section>{showRegister && <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowRegister(false); setAcknowledged(false); } }}><form ref={registrationDialogRef} tabIndex={-1} className={styles.eventDialog} role="dialog" aria-modal="true" aria-labelledby="member-event-title" onSubmit={register}><div className={styles.eventCardTop}><div><p className={styles.eyebrow}>Men’s Forge · Free registration</p><h2 id="member-event-title">Faith That Shows Up</h2></div><button type="button" className={styles.outlineButton} onClick={() => {setShowRegister(false);setAcknowledged(false);}}>Close</button></div><p className={styles.eventDialogIntro}>Thursday, November 19 · 6:00 PM<br/>James 1:1–4 · Group Bible study</p><div className={styles.eventFreeNote}>No cost · Adults 18+ · 9 of 15 places registered · 6 spaces remain</div><p className={styles.eventDialogIntro}>This gathering is for accepted Men’s Forge members. Your response is visible to authorized event leaders for planning.</p><label className={styles.prayerCheck}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)}/><span>I’m an accepted Men’s Forge member and want to register for this free gathering.</span></label><div className={styles.requestActions}><button type="button" className={styles.outlineButton} onClick={() => {setShowRegister(false);setAcknowledged(false);}}>Cancel</button><button className={styles.primaryButton} type="submit" disabled={!acknowledged}>Register for free</button></div><p className={styles.caption}>Design preview only · no registration or payment is submitted</p></form></div>}</>;
}

function MemberGroups({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("My groups");
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const views = ["My groups", "Find a group", "Requests & invitations", "Roles & requests"];
  return <section className={styles.panel} aria-label="Member groups and ministries">
    <div className={styles.approvalHeading}><SectionTitle title="My groups & ministries" help="L&F membership is separate from joining a group. Each group sets its own participation rules. Group membership does not grant an additional ministry role."/><p>Belong, grow, and serve together</p></div>
    <p className={styles.approvalIntro}>Your L&amp;F account gives you member access. Groups and ministries have separate access and may be open, approval-required, or invitation-only.</p>
    <div className={styles.approvalTabs} role="group" aria-label="Group views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => { setView(item); setLeaveTarget(null); }}>{item}</button>)}</div>
    {view === "My groups" && <><ul className={styles.memberGroupsList}>
      <li><div><span className={styles.requestLabel}>Accepted group · Men’s Forge</span><h3>Faith That Shows Up</h3><p>Next gathering · Thu, Nov 19 · 6:00 PM</p><small>Group member · no additional leadership role</small></div><div className={styles.groupActions}><button className={styles.outlineButton} onClick={() => onOpen("Sample group details: members see gatherings and study material shared with Men’s Forge. No group records were loaded or changed.")}>View group</button><button className={styles.outlineButton} onClick={() => setLeaveTarget("Men’s Forge")}>Leave group</button></div></li>
      <li><div><span className={styles.requestLabel}>Accepted ministry · Prayer ministry</span><h3>Prayer team gathering</h3><p>Next gathering · Sun, Nov 22 · 9:00 AM</p><small>Member · role access appears only after approval</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample ministry details: joining a group does not approve additional roles. No membership or role changed.")}>View ministry</button></li>
    </ul>{leaveTarget && <section className={styles.groupRemovalReview} aria-labelledby="leave-group-title"><p className={styles.requestLabel}>Sample group leave review</p><h3 id="leave-group-title">Leave {leaveTarget}?</h3><p>This would end your participation in <strong>{leaveTarget}</strong> only. Your L&amp;F account, personal information, other groups, and separately approved ministry roles remain unchanged.</p><p>In the live app, you would review any group-specific effects before confirming. This preview does not remove you or change access.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setLeaveTarget(null)}>Stay in group</button><button className={styles.primaryButton} onClick={() => { setLeaveTarget(null); onOpen(`Sample only: you would leave ${leaveTarget} group participation after confirmation. Your L&F account and other access remain unchanged. No record changed.`); }}>Confirm sample leave</button></div></section>}</>}
    {view === "Find a group" && <ul className={styles.memberGroupsList}>
      <li><div><span className={styles.requestLabel}>Approval required · Couples</span><h3>The Hearth</h3><p>Interactive Bible study · every other week</p><small>A leader reviews requests before group resources are shared.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this would send a group participation request for review. No request was submitted.")}>Request to join</button></li>
      <li><div><span className={styles.requestLabel}>Open group · Book by Book</span><h3>1 Samuel</h3><p>Passage-by-passage study · online group</p><small>Open participation; any facilitator role still requires approval.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this would add you to an open study group. No membership or role changed.")}>Join group</button></li>
      <li><div><span className={styles.requestLabel}>Invitation only · Serve team</span><h3>Outreach Serve Team</h3><p>Training and serving opportunities</p><small>An invitation is needed before joining. Serving roles are approved separately.</small></div><span className={styles.statusPill}>Invitation needed</span></li>
    </ul>}
    {view === "Requests & invitations" && <><p className={styles.approvalIntro}>Check group requests and invitations here. They do not change your L&amp;F account membership or grant a ministry role.</p><ul className={styles.memberGroupsList}>
      <li><div><span className={styles.requestLabel}>Join request · The Hearth</span><h3>Faithful Together</h3><p>Submitted Nov 12 · Awaiting an authorized group reviewer</p><small>Withdrawing a request does not affect your account or other groups.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this would withdraw the pending group request. No request or membership changed.")}>Withdraw request</button></li>
      <li><div><span className={styles.requestLabel}>Invitation · Outreach Serve Team</span><h3>Outreach Serve Team</h3><p>Invited by a sample group leader</p><small>Accepting adds group participation only. Any serving or leadership role requires its own approval.</small></div><div className={styles.groupActions}><button className={styles.primaryButton} onClick={() => onOpen("Sample only: accepting would add group membership, not a serving or leadership role. No record changed.")}>Accept invitation</button><button className={styles.outlineButton} onClick={() => onOpen("Sample only: declining would close this invitation. No record changed.")}>Decline</button></div></li>
    </ul></>}
    {view === "Roles & requests" && <MemberRoleRequests onOpen={onOpen}/>}
    <p className={styles.caption}>Sample groups and rules · no join, request, invitation, or role change is submitted</p>
  </section>;
}

function MemberRoleRequests({ onOpen }: { onOpen: (message: string) => void }) {
  const roleScopes: Record<string, string[]> = {
    "Study facilitator": ["Men’s Forge"],
    "Prayer team": ["Prayer ministry"],
    "Ministry leader": ["Prayer ministry"],
    "Serve team": ["Outreach Serve Team"],
  };
  const [role, setRole] = useState("Study facilitator");
  const [scope, setScope] = useState("Men’s Forge");
  const [reviewingRequest, setReviewingRequest] = useState(false);
  const [reviewingWithdrawal, setReviewingWithdrawal] = useState(false);
  return <div className={styles.memberRoleRequests} aria-label="Member role requests">
    <p className={styles.approvalIntro}>Your L&amp;F account is active after signup. Additional ministry responsibilities require approval for the exact role and ministry scope. Group membership alone never grants a role, and you cannot approve your own request.</p>
    <section className={styles.memberRoleStatus} aria-label="Current access"><h3>Current access</h3><ul className={styles.accessList}><li><div><strong>L&amp;F member</strong><span>Account membership · Active</span></div><span className={styles.statusPill}>Active</span></li><li><div><strong>Men’s Forge</strong><span>Group participation · no leadership role</span></div><span className={styles.statusPill}>Member</span></li></ul></section>
    <section className={styles.memberRoleStatus} aria-label="Pending role requests"><h3>Pending request</h3><div className={styles.roleRequestCard}><div><span className={styles.requestLabel}>Awaiting authorized review</span><strong>Prayer team · Prayer ministry</strong><p>Submitted Nov 12 · Group participation remains separate</p></div>{!reviewingWithdrawal && <button className={styles.outlineButton} onClick={() => setReviewingWithdrawal(true)}>Withdraw request</button>}</div>{reviewingWithdrawal && <section className={styles.groupRemovalReview} aria-labelledby="withdraw-role-request-title"><p className={styles.requestLabel}>Review withdrawal</p><h3 id="withdraw-role-request-title">Withdraw Prayer team request?</h3><p>This will withdraw the request for <strong>Prayer team · Prayer ministry</strong>. Your L&amp;F membership and Men’s Forge group access remain unchanged.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setReviewingWithdrawal(false)}>Keep request</button><button className={styles.primaryButton} onClick={() => { setReviewingWithdrawal(false); onOpen("Sample only: the Prayer team request would be withdrawn. L&F membership and Men’s Forge group access remain unchanged; the pending sample request remains visible."); }}>Confirm sample withdrawal</button></div></section>}</section>
    <section className={styles.memberRoleStatus} aria-label="Request a ministry role"><h3>Request another role</h3><div className={styles.memberRoleForm}><label className={styles.selectLabel}>Role<select value={role} onChange={(event) => { const nextRole = event.target.value; setRole(nextRole); setScope(roleScopes[nextRole][0]); setReviewingRequest(false); }}>{Object.keys(roleScopes).map((item) => <option key={item}>{item}</option>)}</select></label><label className={styles.selectLabel}>Ministry or group<select value={scope} onChange={(event) => { setScope(event.target.value); setReviewingRequest(false); }}>{roleScopes[role].map((item) => <option key={item}>{item}</option>)}</select></label></div><p className={styles.roleRequestScope}>The request will be for <strong>{role}</strong> in <strong>{scope}</strong>. An authorized reviewer with that scope decides; a request does not grant access.</p>{!reviewingRequest ? <button className={styles.primaryButton} onClick={() => setReviewingRequest(true)}>Review role request</button> : <section className={styles.groupRemovalReview} aria-labelledby="role-request-review-title"><p className={styles.requestLabel}>Sample request review</p><h3 id="role-request-review-title">Request {role} in {scope}?</h3><p>This request is for the role and scope shown above. An authorized reviewer must decide; you cannot approve your own request.</p><p>Your account and group memberships stay the same while the request is reviewed. Approval would add role access only after the authorized decision.</p><div className={styles.requestActions}><button className={styles.outlineButton} onClick={() => setReviewingRequest(false)}>Edit request</button><button className={styles.primaryButton} onClick={() => { setReviewingRequest(false); onOpen(`Sample only: a request for ${role} in ${scope} would be submitted to an authorized reviewer. No role or group access changed, and no request was sent.`); }}>Confirm sample request</button></div></section>}<p className={styles.caption}>Role and scope choices are illustrative; training requirements and scoped reviewer authority still need ministry approval.</p></section>
  </div>;
}

function MemberStudyLibrary({ onOpen }: { onOpen: (message: string) => void }) {
  const [view, setView] = useState("My studies");
  const views = ["My studies", "Browse studies", "Emmaus"];
  return <section className={styles.panel} aria-label="Member studies preview"><div className={styles.approvalHeading}><SectionTitle title="Studies" help="Start with Scripture, continue at your own pace, or join a group. Personal notes and progress belong to your account. This preview loads no real studies or progress."/><p>Grow in the Word, one faithful step at a time</p></div><div className={styles.approvalTabs} role="group" aria-label="Member study views">{views.map((item) => <button key={item} aria-pressed={view === item} onClick={() => setView(item)}>{item}</button>)}</div>{view === "My studies" && <><p className={styles.approvalIntro}>Pick up where you left off. Scripture comes first; the guide helps the group notice, discuss, and apply what it says.</p><ul className={styles.studyList}><li><div><span className={styles.requestLabel}>Men’s Forge · Session 1 of 3</span><h3>Faith That Shows Up</h3><p>James 1:1–4 · Continue your group study</p><small>Read the passage, observe what it says, then share an honest response.</small></div><button className={styles.primaryButton} onClick={() => onOpen("Sample only: this opens the saved study session. No passage, notes, or progress was loaded or changed.")}>Continue</button></li><li><div><span className={styles.requestLabel}>Personal reading · Book by Book</span><h3>1 Samuel</h3><p>Continue from 1 Samuel 1</p><small>Your personal reading place is separate from group pacing.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample only: this returns to your saved place in 1 Samuel. No reading progress changed.")}>Continue reading</button></li></ul></>}{view === "Browse studies" && <><p className={styles.approvalIntro}>Choose an approved Scripture-centered study or view a sample before you begin.</p><ul className={styles.studyList}><li><div><span className={styles.requestLabel}>Group study · 3 sessions</span><h3>Faith That Shows Up</h3><p>James 1:1–4 · Faith in action</p><small>Designed for shared discovery, practical application, and prayer.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample preview only: this shows the approved study outline. No study was joined or progress saved.")}>Preview study</button></li><li><div><span className={styles.requestLabel}>Passage study · Book by Book</span><h3>1 Samuel</h3><p>1 Samuel 1–2 · Passage walkthrough</p><small>Follow the story, notice what God reveals, and talk through a faithful response.</small></div><button className={styles.outlineButton} onClick={() => onOpen("Sample preview only: this opens an approved passage guide. No study or progress changed.")}>Preview study</button></li></ul></>}{view === "Emmaus" && <><p className={styles.approvalIntro}>Keep using your existing Emmaus sign-in while L&amp;F and Emmaus study handoffs are planned.</p><div className={styles.delegationCard}><div><span className={styles.requestLabel}>Existing account connection</span><h3>Emmaus login</h3><p>Connected · preserve current sign-in</p></div><span className={styles.statusPill}>Connected</span></div><div className={styles.studyIntegration}><strong>Open a Bible or study in Emmaus</strong><p>The live app can hand you off to Emmaus using your connected login and return you to L&amp;F. This design preview does not open Emmaus or access Bible content, personal notes, or study progress. Cross-app content and progress sync still need a separate plan.</p><button className={styles.outlineButton} onClick={() => onOpen("Sample only: the existing Emmaus login is recognized. This preview does not navigate, read, or change Emmaus data.")}>Preview Emmaus handoff</button></div></>}<p className={styles.caption}>Member study preview · no content, notes, groups, or progress were loaded or changed</p></section>;
}

function MemberHome({ onOpen }: { onOpen: (message: string) => void }) {
  const [showPrayer, setShowPrayer] = useState(false);
  const [showCare, setShowCare] = useState(false);
  return <><header className={styles.pageHeading}><p className={styles.eyebrow}>Your next faithful step</p><h1>Welcome home.</h1><p>Continue in the Word and see what’s coming up.</p></header><section className={styles.studyStrip}><p className={styles.eyebrow}>Continue my study</p><h2>Faith That Shows Up</h2><p>James 1:1–4 · Session 1</p><button className={styles.primaryButton} onClick={() => onOpen("Study preview: the final Continue button will return to your saved place. No study progress changed.")}>Continue study <span aria-hidden="true">→</span></button></section><div className={styles.twoColumns}><Schedule/><section className={styles.panel}><SectionTitle title="My groups & ministries" help="Only your accepted groups and ministries will appear here."/><ul className={styles.simpleList}><li><strong>Men’s Forge</strong><span>Next gathering · Thursday</span></li><li><strong>Prayer ministry</strong><span>Member</span></li></ul></section></div><section className={styles.prayerEntry}><div><p className={styles.eyebrow}>Prayer &amp; care</p><h2>Share what’s on your heart.</h2><p>Choose a private audience or request public sharing after review.</p></div><button className={styles.primaryButton} onClick={() => setShowPrayer(true)}>Share a prayer request</button></section><section className={styles.careCheckInCard}><div><p className={styles.eyebrow}>Support for you</p><h2>You pour into others. Let someone pour into you.</h2><p>Ask an authorized ministry leader for a private check-in.</p></div><button className={styles.outlineButton} onClick={() => setShowCare(true)}>Request a check-in</button></section><MemberGatherings onOpen={onOpen}/><Calendar personal/>{showPrayer && <PrayerComposer member onClose={() => setShowPrayer(false)} onSubmit={onOpen}/>}{showCare && <CareCheckIn onClose={() => setShowCare(false)} onSubmit={onOpen}/>}</>;
}

function SignupPreview({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const dialogRef = useDialogAccessibility(onClose);
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (birthDate) {
      const today = new Date();
      const date = new Date(birthDate + "T00:00:00");
      let age = today.getFullYear() - date.getFullYear();
      const beforeBirthday = today.getMonth() < date.getMonth()
        || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
      if (beforeBirthday) age -= 1;
      if (!Number.isFinite(date.getTime()) || age < 18) {
        setError("This sample signup is for adults 18 and older. No account was created.");
        return;
      }
    }
    onComplete();
  }
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} className={styles.signupDialog} role="dialog" aria-modal="true" aria-labelledby="signup-heading">
      <button className={styles.signupClose} type="button" onClick={onClose} aria-label="Close signup">×</button>
      <p className={styles.eyebrow}>Join Lost &amp; Found</p>
      <h2 id="signup-heading">Create your member account</h2>
      <p className={styles.signupIntro}>Membership begins after signup and email confirmation. Ministry and elevated roles require separate approval.</p>
      <form onSubmit={submit} className={styles.signupForm}>
        <label className={styles.signupField}>Full name <span>Required</span><input name="full_name" autoComplete="name" required maxLength={120}/></label>
        <label className={styles.signupField}>Email address <span>Required</span><input name="email" type="email" autoComplete="email" required/></label>
        <label className={styles.signupField}>Password <span>Required</span><input name="password" type="password" autoComplete="new-password" required minLength={8}/></label>
        <label className={styles.signupCheck}><input type="checkbox" required/> I confirm I am 18 or older.</label>
        <label className={styles.signupCheck}><input type="checkbox" required/> I agree to follow the community guidelines.</label>
        <div className={styles.signupSpamNote}><strong>Spam protection</strong><span>A verification step will appear here in the live signup flow.</span></div>
        <details className={styles.signupOptional}>
          <summary>Optional profile questions <span>Skip any or all</span></summary>
          <p>These answers help Lost &amp; Found plan studies and ministry support. They never determine membership, access, or role approval.</p>
          <label className={styles.signupField}>Date of birth <span>Optional</span><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)}/><small>Used for adult eligibility and broad age-band reporting only. Never shown in the directory.</small></label>
          <label className={styles.signupField}>Phone number <span>Optional</span><input type="tel" autoComplete="tel"/></label>
          <label className={styles.signupField}>Gender <span>Optional</span><select defaultValue=""><option value="">Prefer not to say</option><option>Woman</option><option>Man</option><option>Self-describe</option></select></label>
          <fieldset className={styles.signupInterests}><legend>Ministry interests <span>Optional</span></legend>{["Bible studies", "Men’s Forge", "The Hearth", "Prayer ministry"].map((interest) => <label key={interest}><input type="checkbox"/>{interest}</label>)}</fieldset>
          <label className={styles.signupField}>How did you hear about L&amp;F? <span>Optional</span><select defaultValue=""><option value="">Choose one</option><option>Friend or family</option><option>Church or ministry partner</option><option>Online search</option><option>Social media</option><option>Event</option><option>Other</option></select></label>
          <label className={styles.signupField}>State or broad region <span>Optional</span><input type="text" maxLength={40} placeholder="For example, North Carolina"/><small>Please do not enter a street address or precise location.</small></label>
        </details>
        {error && <p className={styles.signupError} role="alert">{error}</p>}
        <div className={styles.signupActions}><button type="button" className={styles.outlineButton} onClick={onClose}>Cancel</button><button type="submit" className={styles.primaryButton}>Preview signup</button></div>
        <p className={styles.caption}>Sample only · no information is saved and no account is created.</p>
      </form>
    </section>
  </div>;
}

function PublicHome({ onOpen }: { onOpen: (message: string) => void }) {
  const [showPrayer, setShowPrayer] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  return <div className={styles.publicPage}><header className={styles.publicHeader}><span className={styles.brand}>L&amp;F</span><span className={styles.publicName}>The Lost &amp; Found Project</span><button className={styles.primaryButton} onClick={() => setShowSignup(true)}>Join L&amp;F</button></header><section className={styles.scriptureHero}><p className={styles.eyebrow}>The Lost &amp; Found Project</p><h1>“For the Son of Man came to seek and save those who are lost.”</h1><p className={styles.scriptureRef}>Luke 19:10 · NLT</p><p className={styles.invitation}>Find community. Grow in Christ.</p><p>Explore Scripture, share in prayer, and walk alongside others.</p><button className={styles.primaryButton} onClick={() => onOpen("Study library preview: visitors can explore approved previews; members can start personal studies or join eligible groups.")}>Explore Bible studies <span aria-hidden="true">→</span></button></section><section className={styles.publicSteps} aria-label="Find your next step">{[
    ["01", "Study the Word", "Grow through Scripture-centered studies at your own pace or with a group."],
    ["02", "Find your community", "Discover L&F ministries and people to walk alongside."],
    ["03", "Share a prayer request", "Public requests appear only after review. Members also have private options."],
  ].map(([number, title, description]) => <button key={number} onClick={() => number === "03" ? setShowPrayer(true) : onOpen(title + ": sample navigation only. Nothing was submitted or joined.")}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div><span aria-hidden="true">→</span></button>)}</section><section className={styles.publicPrayer}><p className={styles.eyebrow}>Prayer &amp; praise</p><h2>Carry one another in prayer.</h2><p className={styles.prayerScripture}>“Carry each other’s burdens” · Galatians 6:2</p><p>These sample requests represent posts that a moderator has cleared for everyone to see.</p><ul className={styles.publicPrayerList}><li><div><span className={styles.sampleBadge}>Sample · cleared</span><span className={styles.publicPrayerDate}>Shared anonymously</span></div><p>Please pray for wisdom and peace as our family makes an important decision.</p></li><li><div><span className={styles.sampleBadge}>Sample · cleared</span><span className={styles.publicPrayerDate}>Shared anonymously</span></div><p>Pray for strength and encouragement for someone beginning a difficult season.</p></li><li><div><span className={styles.sampleBadge}>Sample · cleared</span><span className={styles.publicPrayerDate}>Praise report</span></div><p>Thankful for friends who keep showing up and pointing one another back to Christ.</p></li></ul><p className={styles.caption}>Illustrative examples only · no real prayer requests or personal details are included.</p></section>{showPrayer && <PrayerComposer member={false} onClose={() => setShowPrayer(false)} onSubmit={onOpen}/>}{showSignup && <SignupPreview onClose={() => setShowSignup(false)} onComplete={() => { setShowSignup(false); onOpen("Sample signup complete: a member profile would be created, then email confirmation is required before app access. No account or data was saved."); }}/>}</div>;
}

export default function RebuildPreview() {
  const [surface, setSurface] = useState<Surface>("Administration");
  const [workspace, setWorkspace] = useState<Workspace>("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function chooseSurface(next: Surface) { setSurface(next); setWorkspace("Home"); setMenuOpen(false); setNotice(""); }
  function chooseWorkspace(next: Workspace) { setWorkspace(next); setMenuOpen(false); setNotice(""); }
  return <div className={styles.preview}><div className={styles.reviewBar}><div><strong>Rebuild design preview</strong><span>Sample data · no live changes</span></div><div className={styles.surfacePicker} role="group" aria-label="Preview screen">{surfaces.map((item) => <button key={item} aria-pressed={surface === item} onClick={() => chooseSurface(item)}>{item}</button>)}</div><a href="/admin">Exit preview <span aria-hidden="true">↗</span></a></div>{surface === "Public homepage" ? <PublicHome onOpen={setNotice}/> : <div className={styles.shell}><div className={styles.mobileBar}><button aria-expanded={menuOpen} aria-controls="rebuild-menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close menu" : "☰ Menu"}</button><span className={styles.brand}>L&amp;F</span><span className={styles.avatar} aria-label="Sample profile">A</span></div><aside id="rebuild-menu" className={[styles.sidebar, menuOpen ? styles.menuOpen : ""].join(" ")}><div className={styles.identity}><span className={styles.brand}>L&amp;F</span><p>{surface === "Administration" ? "Administration" : "My L&F"}</p></div><nav aria-label={surface === "Administration" ? "Preview administration" : "Preview member navigation"}>{(["Home", "My tasks", "Calendars"] as Workspace[]).map((item) => <button key={item} aria-current={workspace === item ? "page" : undefined} onClick={() => chooseWorkspace(item)}><span aria-hidden="true">{item === "Home" ? "⌂" : item === "My tasks" ? "✓" : "▦"}</span>{item}</button>)}<button aria-current={(surface === "Administration" && workspace === "People & roles") || (surface === "Member home" && workspace === "Groups") ? "page" : undefined} onClick={() => surface === "Administration" ? chooseWorkspace("People & roles") : chooseWorkspace("Groups")}><span aria-hidden="true">♧</span>{surface === "Administration" ? "Members" : "My groups"}</button><details className={styles.tools}><summary>Ministry tools</summary><div className={styles.toolLinks}><button onClick={() => chooseWorkspace("Studies")}>Studies</button><button onClick={() => surface === "Administration" ? chooseWorkspace("Events") : setNotice("Event preview: your gatherings and registration options will follow approved group sharing. No event data was loaded.")}>Events</button><button onClick={() => surface === "Administration" ? chooseWorkspace("Prayer review") : setNotice("Prayer requests preview: public requests appear only after review; member requests follow the audience selected by the member.")}>Prayer review</button>{surface === "Administration" && <button onClick={() => chooseWorkspace("Insights")}>Insights</button>}<p>Approved ministry tools appear here according to your role.</p></div></details><button aria-current={workspace === "Settings" ? "page" : undefined} onClick={() => chooseWorkspace("Settings")}><span aria-hidden="true">⚙</span>Settings</button></nav><p className={styles.sidebarNote}>A place to serve.<br/>A clearer way to work.</p></aside><div className={styles.workspace}>{surface === "Member home" && workspace === "Home" ? <MemberHome onOpen={setNotice}/> : <><header className={styles.pageHeading}><p className={styles.eyebrow}>{surface === "Administration" ? "Ministry operations" : "My L&F"}</p><h1>{workspace === "Home" ? "Command Center" : workspace === "Calendars" ? "Calendar" : workspace === "People & roles" ? "People & roles" : workspace === "Groups" ? "My groups & ministries" : workspace === "Prayer review" ? "Prayer review" : workspace === "Events" ? "Events" : workspace === "Studies" ? "Studies" : workspace === "Insights" ? "Insights" : workspace === "Settings" ? "Settings" : "My tasks"}</h1><p>{workspace === "Home" ? "Your ministry at a glance." : workspace === "Calendars" ? "One place for the commitments that matter." : workspace === "People & roles" ? "Membership and ministry access." : workspace === "Groups" ? "Explore your accepted groups and ways to take part." : workspace === "Prayer review" ? "Review public submissions and honor member privacy." : workspace === "Events" ? "Review gatherings, access, and free registration." : workspace === "Studies" ? (surface === "Member home" ? "Continue a study or browse Scripture-centered material." : "Prepare Scripture-centered studies and support group leaders.") : workspace === "Insights" ? "Use aggregate trends to plan ministry support." : workspace === "Settings" ? "Manage your notifications and profile sharing." : "A focused view of what needs your attention."}</p></header>{workspace === "Groups" && surface === "Member home" ? <MemberGroups onOpen={setNotice}/> : workspace === "People & roles" ? <RoleApprovals onOpen={setNotice}/> : workspace === "Prayer review" ? <PrayerReview onOpen={setNotice}/> : workspace === "Events" ? <EventManagement onOpen={setNotice}/> : workspace === "Studies" ? (surface === "Member home" ? <MemberStudyLibrary onOpen={setNotice}/> : <StudyWorkspace onOpen={setNotice}/>) : workspace === "Insights" ? <InsightsWorkspace/> : workspace === "Settings" ? <SettingsWorkspace onOpen={setNotice}/> : <>{workspace === "Home" && <><dl className={styles.metrics}>{[["142", "Members"], ["7", "Open tasks"], ["3", "Prayer requests"], ["5", "Leader requests"]].map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className={styles.twoColumns}><Attention onOpen={setNotice}/><Schedule/></div></>}{workspace === "My tasks" ? <MyTasks onOpen={setNotice} personal={surface === "Member home"}/> : <Calendar personal={surface === "Member home"}/>}</>}</>}</div></div>}{notice && <div className={styles.notice} role="status"><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss preview message">Dismiss</button></div>}</div>;
}
