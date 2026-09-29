import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("Gatherings combines assigned sessions with the public ministry calendar",()=>{
 const page=read("app/events/page.tsx");
 assert.match(page,/login\?next=%2Fevents/);
 assert.match(page,/Your invitations/);
 assert.match(page,/study_session_participants/);
 assert.match(page,/Public gatherings/);
 assert.match(page,/Ministry Space/);
 assert.match(page,/Join L&F Live now|Open gathering/);
});

test("members can RSVP without receiving broad participant-table update access",()=>{
 const migration=read("supabase/migrations/20260929214000_study_session_rsvp.sql");
 const action=read("app/events/actions.ts");
 assert.match(migration,/rsvp_status/);
 assert.match(migration,/respond_to_study_session/);
 assert.match(migration,/security definer/);
 assert.match(migration,/where study_session_id = p_session_id[\s\S]*user_id = auth\.uid\(\)/);
 assert.match(migration,/grant execute on function public\.respond_to_study_session/);
 assert.doesNotMatch(migration,/create policy[\s\S]*for update[\s\S]*study_session_participants/i);
 assert.match(action,/supabase\.rpc\("respond_to_study_session"/);
 for(const status of ["going","maybe","declined"])assert.match(action,new RegExp(status));
});

test("Ministry Spaces expose the approved operating sections and personal gatherings",()=>{
 const page=read("app/ministries/[slug]/page.tsx");
 for(const section of ["Home","Updates","Gatherings","Resources","People"])assert.match(page,new RegExp(`>${section}<`));
 assert.match(page,/study_session_participants/);
 assert.match(page,/Assigned to you/);
 assert.match(page,/RSVP &amp; details/);
 assert.match(page,/Belonging is more than following a page/);
});

test("ending sessions remains separate from Daily Path release",()=>{
 const liveEnd=read("app/api/live/session/[sessionId]/end/route.ts");
 const actions=read("app/admin/studies/actions.ts");
 assert.doesNotMatch(liveEnd,/daily_path_released_at\s*:/);
 assert.match(actions,/export async function releaseDailyPath/);
 assert.match(actions,/export async function endStudySession/);
});
