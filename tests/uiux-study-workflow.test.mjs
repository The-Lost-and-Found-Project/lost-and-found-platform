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
  assert.ok(actions.includes('if('+name+')')||actions.includes('if('+name+'||!p||!p.is_active)'),name+" must be checked");
 }
 assert.ok(actions.includes('Only assigned participants can be marked'));
});


test("meeting detail fails closed when role or supervisor lookup fails",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 for(const name of ["profileError","meetingError","facilitatorsError","supervisedError"]){
  assert.ok(page.includes(name),name+" is checked");
 }
 assert.ok(page.includes('if(profileError||!profile||!profile.is_active)throw new Error'));
 assert.ok(page.includes('if(supervisedError)throw new Error'));
});


test("meeting detail reports failures loading participation context",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(page.includes('if(studyError||groupError||facilitatorError||attendeesError||presenceError)throw new Error'));
 assert.ok(page.includes('if(namesError)throw new Error'));
 assert.ok(page.includes('error:attendanceError'));
 assert.ok(page.includes('error:followupError'));
});


test("meeting scheduler does not mistake failed queries for empty scheduling options",()=>{
 const page=read("app/admin/meetings/new/page.tsx");
 assert.ok(page.includes('if(profileError||!profile||!profile.is_active)throw new Error'));
 assert.ok(page.includes('if(studiesError||groupsError||membersError||peopleError||supervisionError)throw new Error'));
});


test("attendance tool errors do not falsely claim a missing migration",()=>{
 const page=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(page.includes('The database updates may not be installed, or a query may have failed'));
 assert.ok(!page.includes('unavailable until their database updates are installed'));
});


test("meetings errors provide an accessible retry path",()=>{
 const page=read("app/admin/meetings/error.tsx");
 assert.ok(page.includes('"use client"'));
 assert.ok(page.includes('role="alert"'));
 assert.ok(page.includes('onClick={()=>reset()}'));
 assert.ok(page.includes('href="/admin/meetings"'));
});


test("meetings dashboard rejects failed role verification",()=>{
 const page=read("app/admin/meetings/page.tsx");
 assert.ok(page.includes('if(profileError||!profile||!profile.is_active)throw new Error'));
});


test("meeting completion prevents late Meet provisioning and limits close transition",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('Completed meetings cannot create new Meet links.'));
 assert.ok(actions.includes('.in("status",["scheduled","live"]).is("ended_at",null)'));
});


test("Meet provisioning handles concurrent meeting completion and failed access lookups",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('if(sessionError)throw new Error("Unable to verify study session access.")'));
 assert.ok(actions.includes('if(facilitatorError)throw new Error("Unable to verify meeting facilitator.")'));
 assert.ok(actions.includes('.is("google_space_name",null).is("ended_at",null).in("status",["scheduled","live"])'));
});


test("study scheduler fails safely on authorization and duplicate lookup errors",()=>{
 const actions=read("app/admin/studies/actions.ts");
 for(const fragment of ['if(profileError||!p||!p.is_active)throw new Error','if(facilitatorsError)throw new Error','if(supervisionError)throw new Error','if(existingError)return{ok:false'])assert.ok(actions.includes(fragment),fragment);
});


test("meeting scheduling rejects malformed end dates",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('scheduledEnd&&(Number.isNaN(Date.parse(scheduledEnd))||new Date(scheduledEnd)<=new Date(scheduledStart))'));
});


test("scheduler enforces published studies and ministry alignment on server",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('if(studyError||!study||!study.is_published)'));
 assert.ok(actions.includes('if(study.ministry_slug&&study.ministry_slug!==ministrySlug)'));
});


test("scheduler filters studies by ministry and clears stale study selection",()=>{
 const form=read("components/LiveStudySessionForm.tsx");
 assert.ok(form.includes('s.ministry_slug===selectedMinistry'));
 assert.ok(form.includes('setSelectedGroup(id);setSelectedStudy("")'));
 assert.ok(form.includes('setSelectedMinistry(e.target.value);setSelectedStudy("")'));
 assert.ok(form.includes('value={selectedStudy}'));
});


test("scheduler checks selected study and group ministry before submission",()=>{
 const form=read("components/LiveStudySessionForm.tsx");
 assert.ok(form.includes('if(!selectedStudy)throw new Error("Choose a Bible study.")'));
 assert.ok(form.includes('if(group&&selectedMinistry!==group.ministry_slug)'));
 assert.ok(form.includes('disabled={pending||!group||!selectedStudy||checked.size===0}'));
});


test("scheduler rejects stale group roster selections instead of silently dropping people",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('participantIds.some(id=>!allowed.has(id))'));
 assert.ok(actions.includes('The participant list has changed. Refresh the page'));
 assert.ok(!actions.includes('participantIds=participantIds.filter(id=>allowed.has(id))'));
});


test("duplicate meeting detection covers scheduled and live sessions",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('.eq("scheduled_start",scheduledStart).in("status",["scheduled","live"]).maybeSingle()'));
});


test("scheduler reports existing meetings and partial notification failures accurately",()=>{
 const form=read("components/LiveStudySessionForm.tsx");
 assert.ok(form.includes('result.existing?"This meeting was already scheduled'));
 assert.ok(form.includes('result.notificationStored===false||result.pushDelivered===false'));
 assert.ok(form.includes('Check with participants directly.'));
});


test("Daily Path can be released only after the meeting is completed",()=>{
 const actions=read("app/admin/studies/actions.ts");
 const detail=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(actions.includes('if(session.status!=="completed"||!session.ended_at)'));
 assert.ok(actions.includes('.eq("status","completed").not("ended_at","is",null).is("daily_path_released_at",null)'));
 assert.ok(detail.includes('meeting.status!=="completed"||!meeting.ended_at?'));
});


test("Daily Path warns about nonstandard devotional lengths without blocking legacy studies",()=>{
 const detail=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(detail.includes('cards.length>0&&cards.length!==7&&!meeting.daily_path_released_at'));
 assert.ok(detail.includes('The standard Daily Path is seven days.'));
 assert.ok(detail.includes('Review the study content before release.'));
});


test("scheduler reports an incomplete meeting when participant rollback fails",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('const{error:cleanupError}=await db.from("study_sessions").delete().eq("id",session.id)'));
 assert.ok(actions.includes('the incomplete meeting could not be removed'));
 assert.ok(actions.includes('Contact an administrator before scheduling again.'));
});


test("Daily Path release atomically claims the session before notifying participants",()=>{
 const actions=read("app/admin/studies/actions.ts");
 const start=actions.indexOf("export async function releaseDailyPath(");
 const end=actions.indexOf("export async function deleteStudy(",start);
 const release=actions.slice(start,end);
 const claim=release.indexOf('.is("daily_path_released_at",null).select("id").maybeSingle()');
 const guard=release.indexOf("if(!claimed)return;");
 const notify=release.indexOf('db.from("notifications").insert(');
 const push=release.indexOf("sendPushToUsers(ids,");
 assert.ok(claim>=0&&guard>claim&&notify>guard&&push>notify);
 assert.ok(release.includes('.eq("status","completed").not("ended_at","is",null)'));
});


test("meeting detail fails visibly when its linked study or group is missing",()=>{
 const detail=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(detail.includes('if(!study)throw new Error("The Bible study linked to this meeting is missing.'));
 assert.ok(detail.includes('if(meeting.group_id&&!group)throw new Error("The group linked to this meeting is missing.'));
});


test("meeting detail flags missing assigned facilitator profile",()=>{
 const detail=read("app/admin/meetings/[id]/page.tsx");
 assert.ok(detail.includes('if(meeting.facilitator_user_id&&!facilitator)throw new Error("The assigned facilitator profile is missing.'));
});


test("live meeting access fails closed on authorization and supervision query errors",()=>{
 const live=read("app/live/[sessionId]/page.tsx");
 assert.ok(live.includes('if(profileError||sessionError||extensionsError||participantError)throw new Error("Unable to verify live meeting access.")'));
 assert.ok(live.includes('if(supervisionError)throw new Error("Unable to verify supervisor access.")'));
 assert.ok(live.includes('session.status==="completed"'));
 assert.ok(live.includes('session.live_ended_at'));
});


test("live room honors active group facilitators and their supervisors",()=>{
 const live=read("app/live/[sessionId]/page.tsx");
 assert.ok(live.includes('.eq("group_role","facilitator").eq("membership_status","active")'));
 assert.ok(live.includes('if(membersError)throw new Error("Unable to verify active group facilitators.")'));
 assert.ok(live.includes('.in("facilitator_user_id",facilitatorIds)'));
 assert.ok(live.includes('groupFacilitator=Boolean(members?.some(m=>m.user_id===user.id))'));
});


test("meeting management pages and actions require an active account",()=>{
 for(const path of ["app/admin/meetings/page.tsx","app/admin/meetings/new/page.tsx","app/admin/meetings/[id]/page.tsx","app/admin/meetings/attendance-actions.ts"]){
  const source=read(path);
  assert.ok(source.includes('select("role,preview_role,is_active")'),path);
  assert.ok(source.includes('!profile.is_active')||source.includes('!p.is_active'),path);
 }
});


test("attendance and follow-up actions reject malformed UUIDs",()=>{
 const actions=read("app/admin/meetings/attendance-actions.ts");
 assert.ok(actions.includes('const validUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)'));
 assert.ok(actions.includes('!validUuid(sessionId)'));
 assert.ok(actions.includes('!validUuid(userId)'));
});


test("study scheduling and lifecycle writes require active accounts and valid IDs",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('select("role,preview_role,is_active")'));
 assert.ok(actions.includes('if(profileError||!p||!p.is_active)throw new Error("Unable to verify an active account.")'));
 assert.ok(actions.includes('if(!validUuid(groupId))'));
 assert.ok(actions.includes('if(!validUuid(bibleStudyId))'));
 assert.equal((actions.match(/if\(!validUuid\(sessionId\)\)throw new Error\("Invalid study session\."\)/g)||[]).length,3);
});


test("scheduler validates participant and facilitator identifiers before saving",()=>{
 const actions=read("app/admin/studies/actions.ts");
 assert.ok(actions.includes('participantIds.some(id=>!validUuid(id))'));
 assert.ok(actions.includes('facilitatorUserId&&!validUuid(facilitatorUserId)'));
});
