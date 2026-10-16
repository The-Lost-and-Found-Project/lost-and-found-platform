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


test("Meetings navigation remains reachable without covering the end of app pages",()=>{
 const frame=read("components/AppFrame.tsx");
 const nav=read("components/BottomNav.tsx");
 assert.match(frame,/pb-\\[calc\\(8\\.5rem\\+env\\(safe-area-inset-bottom\\)\\)\\]/);
 assert.match(nav,/label:"Meetings"/);
 assert.match(nav,/label:"Studies"/);
 assert.match(nav,/item.href!=="\\/admin"/);
});

test("legacy studies page delegates meeting management without crowded completed-session controls",()=>{
 const page=read("app/admin/studies/page.tsx");
 assert.match(page,/Meeting overview/);
 assert.match(page,/href="\\/admin\\/meetings"/);
 assert.doesNotMatch(page,/Create Meet fallback/);
 assert.doesNotMatch(page,/sessions\\.map\\(session/);
});
