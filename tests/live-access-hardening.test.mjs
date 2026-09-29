import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("L&F Live page enforces assigned access before rendering the room",()=>{
 const page=read("app/live/[sessionId]/page.tsx");
 assert.match(page,/study_session_participants/);
 assert.match(page,/facilitator_supervision/);
 assert.match(page,/!participant&&!facilitator&&!supervisor/);
 assert.match(page,/redirect\("\/events"\)/);
 assert.match(page,/is_active/);
 assert.match(page,/session\.status==="completed"\|\|session\.status==="cancelled"\|\|session\.live_ended_at/);
});

test("participant presence cannot start the live session clock",()=>{
 const presence=read("app/api/live/session/[sessionId]/presence/route.ts");
 assert.match(presence,/if\(facilitator&&!ss\.live_started_at\)/);
 assert.doesNotMatch(presence,/if\(!ss\.live_started_at\)await db\.from\("study_sessions"\)\.update\(\{live_started_at:now,status:"live"/);
});

test("assigned supervisors have consistent observer access without facilitator control",()=>{
 const join=read("app/api/live/session/[sessionId]/route.ts");
 const state=read("app/api/live/session/[sessionId]/state/route.ts");
 const presence=read("app/api/live/session/[sessionId]/presence/route.ts");
 for(const source of [join,state,presence]){
  assert.match(source,/facilitator_supervision/);
  assert.match(source,/supervisor/);
 }
 assert.match(state,/if\(!ctx\?\.facilitator\)return NextResponse\.json\(\{error:"Facilitator access required"/);
});
