"use client";

import { useState, type ReactNode } from "react";
import { filterPreviewEvents, previewEvents, type CalendarFilter, type CalendarScope } from "@/lib/rebuild-preview";
import styles from "./RebuildPreview.module.css";

type Surface = "Administration" | "Public homepage" | "Member home";
type Workspace = "Home" | "My tasks" | "Calendars";
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

function Calendar({ personal = false }: { personal?: boolean }) {
  const [scope, setScope] = useState<CalendarScope>(personal ? "Personal calendar" : "Master calendar");
  const [filter, setFilter] = useState<CalendarFilter>("All");
  const [ministry, setMinistry] = useState("All ministries");
  const events = filterPreviewEvents(previewEvents, scope, filter, ministry);
  return <section className={styles.panel} aria-label="Calendar preview"><div className={styles.calendarHeading}><SectionTitle title="Calendar" help="The final calendar will enforce role and assignment permissions. These controls filter synthetic events only; they do not grant access." /><label className={styles.selectLabel}>Calendar view<select value={scope} onChange={(event) => setScope(event.target.value as CalendarScope)}>{!personal && <option>Master calendar</option>}<option>Personal calendar</option></select></label></div><div className={styles.calendarControls}><div className={styles.filterGroup} role="group" aria-label="Calendar filters">{calendarFilters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><label className={styles.selectLabel}>Ministry<select value={ministry} onChange={(event) => setMinistry(event.target.value)}><option>All ministries</option><option>Studies</option><option>Outreach</option><option>Prayer</option></select></label></div><div aria-live="polite" aria-atomic="true"><p className={styles.resultCount}>{events.length + (events.length === 1 ? " sample event" : " sample events")}</p>{events.length ? <ul className={styles.agenda}>{events.map((event) => <li key={event.id}><span className={styles.eventDate}>{event.date}</span><time>{event.time}</time><div><strong>{event.title}</strong><span>{event.assigned ? "Assigned to you" : event.shared ? "Shared with your role" : "My event"}</span></div></li>)}</ul> : <p className={styles.empty}>No sample events match these filters. Choose All or another ministry.</p>}</div><p className={styles.caption}>Design preview · sample events, not your live calendar</p></section>;
}

function MemberHome({ onOpen }: { onOpen: (message: string) => void }) {
  return <><header className={styles.pageHeading}><p className={styles.eyebrow}>Your next faithful step</p><h1>Welcome home.</h1><p>Continue in the Word and see what’s coming up.</p></header><section className={styles.studyStrip}><p className={styles.eyebrow}>Continue my study</p><h2>Faith That Shows Up</h2><p>James 1:1–4 · Session 1</p><button className={styles.primaryButton} onClick={() => onOpen("Study preview: the final Continue button will return to your saved place. No study progress changed.")}>Continue study <span aria-hidden="true">→</span></button></section><div className={styles.twoColumns}><Schedule/><section className={styles.panel}><SectionTitle title="My groups & ministries" help="Only your accepted groups and ministries will appear here."/><ul className={styles.simpleList}><li><strong>Men’s Bible study</strong><span>Next gathering · Friday</span></li><li><strong>Prayer ministry</strong><span>Member</span></li></ul></section></div><Calendar personal/></>;
}

function PublicHome({ onOpen }: { onOpen: (message: string) => void }) {
  return <div className={styles.publicPage}><header className={styles.publicHeader}><span className={styles.brand}>L&amp;F</span><span className={styles.publicName}>The Lost &amp; Found Project</span><button className={styles.primaryButton} onClick={() => onOpen("Signup preview: membership is immediate after signup; additional roles require approval. No account was created.")}>Join L&amp;F</button></header><section className={styles.scriptureHero}><p className={styles.eyebrow}>The Lost &amp; Found Project</p><h1>“For the Son of Man came to seek and save those who are lost.”</h1><p className={styles.scriptureRef}>Luke 19:10 · NLT</p><p className={styles.invitation}>Find community. Grow in Christ.</p><p>Explore Scripture, share in prayer, and walk alongside others.</p><button className={styles.primaryButton} onClick={() => onOpen("Study library preview: visitors can explore approved previews; members can start personal studies or join eligible groups.")}>Explore Bible studies <span aria-hidden="true">→</span></button></section><section className={styles.publicSteps} aria-label="Find your next step">{[
    ["01", "Study the Word", "Grow through Scripture-centered studies at your own pace or with a group."],
    ["02", "Find your community", "Discover L&F ministries and people to walk alongside."],
    ["03", "Share a prayer request", "Public requests appear only after review. Members also have private options."],
  ].map(([number, title, description]) => <button key={number} onClick={() => onOpen(title + ": sample navigation only. Nothing was submitted or joined.")}><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div><span aria-hidden="true">→</span></button>)}</section><section className={styles.publicPrayer}><p className={styles.eyebrow}>Prayer &amp; praise</p><h2>Carry one another in prayer.</h2><p>Approved public requests, praise reports, and testimonies will appear here.</p><p className={styles.caption}>No real community submissions are included in this preview.</p></section></div>;
}

export default function RebuildPreview() {
  const [surface, setSurface] = useState<Surface>("Administration");
  const [workspace, setWorkspace] = useState<Workspace>("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function chooseSurface(next: Surface) { setSurface(next); setWorkspace("Home"); setMenuOpen(false); setNotice(""); }
  function chooseWorkspace(next: Workspace) { setWorkspace(next); setMenuOpen(false); setNotice(""); }
  return <div className={styles.preview}><div className={styles.reviewBar}><div><strong>Rebuild design preview</strong><span>Sample data · no live changes</span></div><div className={styles.surfacePicker} role="group" aria-label="Preview screen">{surfaces.map((item) => <button key={item} aria-pressed={surface === item} onClick={() => chooseSurface(item)}>{item}</button>)}</div><a href="/admin">Exit preview <span aria-hidden="true">↗</span></a></div>{surface === "Public homepage" ? <PublicHome onOpen={setNotice}/> : <div className={styles.shell}><div className={styles.mobileBar}><button aria-expanded={menuOpen} aria-controls="rebuild-menu" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Close menu" : "☰ Menu"}</button><span className={styles.brand}>L&amp;F</span><span className={styles.avatar} aria-label="Sample profile">A</span></div><aside id="rebuild-menu" className={[styles.sidebar, menuOpen ? styles.menuOpen : ""].join(" ")}><div className={styles.identity}><span className={styles.brand}>L&amp;F</span><p>{surface === "Administration" ? "Administration" : "My L&F"}</p></div><nav aria-label={surface === "Administration" ? "Preview administration" : "Preview member navigation"}>{(["Home", "My tasks", "Calendars"] as Workspace[]).map((item) => <button key={item} aria-current={workspace === item ? "page" : undefined} onClick={() => chooseWorkspace(item)}><span aria-hidden="true">{item === "Home" ? "⌂" : item === "My tasks" ? "✓" : "▦"}</span>{item}</button>)}<button onClick={() => { setMenuOpen(false); setNotice("People workspace preview: member profiles, sharing choices, and approved roles will appear here. No account information was loaded."); }}><span aria-hidden="true">♧</span>{surface === "Administration" ? "Members" : "My groups"}</button><details className={styles.tools}><summary>Ministry tools</summary><p>Studies, people, prayer, and settings will use this same menu. Their live workspaces are unchanged.</p></details><button onClick={() => { setMenuOpen(false); setNotice("Settings preview: privacy, notification categories, and account preferences will appear here. No preference changed."); }}><span aria-hidden="true">⚙</span>Settings</button></nav><p className={styles.sidebarNote}>A place to serve.<br/>A clearer way to work.</p></aside><div className={styles.workspace}>{surface === "Member home" && workspace === "Home" ? <MemberHome onOpen={setNotice}/> : <><header className={styles.pageHeading}><p className={styles.eyebrow}>{surface === "Administration" ? "Ministry operations" : "My L&F"}</p><h1>{workspace === "Home" ? "Command Center" : workspace === "Calendars" ? "Calendar" : "My tasks"}</h1><p>{workspace === "Home" ? "Your ministry at a glance." : workspace === "Calendars" ? "One place for the commitments that matter." : "A focused view of what needs your attention."}</p></header>{workspace === "Home" && <><dl className={styles.metrics}>{[["142", "Members"], ["7", "Open tasks"], ["3", "Prayer requests"], ["5", "Leader requests"]].map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className={styles.twoColumns}><Attention onOpen={setNotice}/><Schedule/></div></>}{workspace === "My tasks" ? <Attention onOpen={setNotice} personal={surface === "Member home"}/> : <Calendar personal={surface === "Member home"}/>}</>}</div></div>}{notice && <div className={styles.notice} role="status"><p>{notice}</p><button onClick={() => setNotice("")} aria-label="Dismiss preview message">Dismiss</button></div>}</div>;
}
