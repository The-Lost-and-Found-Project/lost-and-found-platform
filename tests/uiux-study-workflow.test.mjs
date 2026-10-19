import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("facilitator workflow separates ending a session from releasing Daily Path",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 const actions=read("app/admin/studies/actions.ts");
 assert.match(page,/End meeting/);
 assert.match(page,/Release Daily Path/);
 assert.doesNotMatch(page,/End Study & Release Daily Path/);
 assert.match(actions,/export async function endStudySession/);
 assert.match(actions,/export async function releaseDailyPath/);
 assert.match(actions,/Add at least one Daily Path devotional before releasing it/);
});

test("completed sessions remain visible so Daily Path can be released later",()=>{
 const dashboard=read("app/admin/meetings/page.tsx");
 const detail=read("app/admin/meetings/[id]/page.tsx");
 assert.match(dashboard,/status==="completed"/);
 assert.match(dashboard,/Recent completed meetings/);
 assert.match(detail,/No devotionals available for release/);
 assert.match(detail,/Release Daily Path/);
 assert.match(detail,/attendees/);
});

test("study deletion preserves session history",()=>{
 const actions=read("app/admin/studies/actions.ts");
 const button=read("components/StudyDeleteButton.tsx");
 assert.match(actions,/This study has session history\. Unpublish it instead/);
 assert.match(actions,/from\("bible_studies"\)\.delete\(\)/);
 assert.match(button,/window\.confirm/);
 assert.match(button,/Delete/);
});

test("Home preserves its destination through authentication",()=>{
 const dashboard=read("app/dashboard/page.tsx");
 assert.match(dashboard,/redirect\("\/login\?next=%2Fdashboard"\)/);
});


test("ending L&F Live does not release Daily Path", async () => {
  const liveEnd = read("app/api/live/session/[sessionId]/end/route.ts");
  assert.match(liveEnd, /live_ended_at:ended/);
  assert.match(liveEnd, /status:"completed"/);
  assert.doesNotMatch(liveEnd, /daily_path_released_at\s*:/);
  assert.doesNotMatch(liveEnd, /Day 1 is ready/);
  assert.doesNotMatch(liveEnd, /dailyPathReleased:true/);
});


test("facilitators and supervisors can reach their study workspace from Home",()=>{
 const dashboard=read("app/dashboard/page.tsx");
 assert.match(dashboard,/canManageStudies/);
 assert.match(dashboard,/Study Leadership/);
 assert.match(dashboard,/href="\/admin\/studies"/);
 assert.match(dashboard,/Open Study Workspace/);
});


test("Meetings navigation and compact overview are wired to their new locations",()=>{
 const frame=read("components/AppFrame.tsx");
 const nav=read("components/BottomNav.tsx");
 const page=read("app/admin/studies/page.tsx");
 assert.ok(frame.includes("8.5rem+env(safe-area-inset-bottom)"));
 assert.ok(nav.includes('label:"Meetings"'));
 assert.ok(nav.includes('label:"Studies"'));
 assert.ok(nav.includes('item.href!=="/admin"'));
 assert.ok(page.includes("Meeting overview"));
 assert.ok(page.includes('href="/admin/meetings"'));
 assert.ok(!page.includes("Create Meet fallback"));
 assert.ok(!page.includes("sessions.map(session"));
});


test("meeting follow-up writes only the selected checklist field",()=>{
 const actions=read("app/admin/meetings/attendance-actions.ts");
 assert.ok(actions.includes('ignoreDuplicates:true'));
 assert.ok(actions.includes('.update({[field]:form.get("completed")==="true"'));
 assert.ok(!actions.includes('...next,updated_by:user.id'));
 assert.ok(actions.includes('authorizeMeeting(sessionId)'));
});


test("completed meeting details hide live-room entry but retain resources and follow-up",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(page.includes('meeting.status!=="completed"&&<Link href={`/live/${id}`}'));
 assert.ok(page.includes('meeting.status!=="completed"&&meeting.google_meeting_uri'));
 assert.ok(page.includes('Meeting resources'));
 assert.ok(page.includes('Follow-up checklist'));
});


test("Meetings dashboard no longer sends managers back to the legacy sessions anchor",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(!page.includes('/admin/studies#sessions'));
 assert.ok(page.includes('href="/admin/meetings/new"'));
 assert.ok(page.includes('Study publishing'));
});


test("meeting overview sorts overdue and completed meetings and shows their dates",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('const recentlyCompleted=[...past].sort('));
 assert.ok(page.includes('const overdue=visible.filter('));
 assert.ok(page.includes('getTime()-new Date(b.scheduled_start!)'));
 assert.ok(page.includes('Older history may not appear in this overview'));
});


test("meeting overview warns when query limits may hide meetings",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('activeLimitReached=(activeRows||[]).length===250'));
 assert.ok(page.includes('completedLimitReached=(pastRows||[]).length===50'));
 assert.ok(page.includes('Some meetings may not appear here'));
});


test("Meetings workspace does not display false zero counts when database reads fail",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('error:activeError'));
 assert.ok(page.includes('error:pastError'));
 assert.ok(page.includes('if(activeError||pastError)throw new Error'));
});


test("Meetings workspace reports study and group lookup failures",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('error:studyError'));
 assert.ok(page.includes('error:groupError'));
 assert.ok(page.includes('if(studyError||groupError)throw new Error'));
});


test("Meetings workspace fails closed if role-scoping lookups fail",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('error:membershipError'));
 assert.ok(page.includes('error:supervisedError'));
 assert.ok(page.includes('error:supervisedGroupsError'));
 assert.ok(page.includes('if(membershipError||supervisedError||supervisedGroupsError)throw new Error'));
});


test("meeting attendance and follow-up actions reject failed permission lookups",()=>{
 const actions=read("app/admin/meetings/attendance-actions.ts");
 for(const name of ["profileError","sessionError","facilitatorsError","supervisedError","assignedError"]){
  assert.ok(actions.includes('if('+name+')')||actions.includes('if('+name+'||!p)'),name+" must be checked");
 }
 assert.ok(actions.includes('Only assigned participants can be marked'));
});


test("meeting detail fails closed when role or supervisor lookup fails",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 for(const name of ["profileError","meetingError","facilitatorsError","supervisedError"]){
  assert.ok(page.includes(name),name+" is checked");
 }
 assert.ok(page.includes('if(profileError||!profile)throw new Error'));
 assert.ok(page.includes('if(supervisedError)throw new Error'));
});
