import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("James participant-facing lesson has eight discovery steps, without copied Scripture or private notes",()=>{
 const src=read("lib/studies/discovery-pilot.ts");
 for(const id of ["remember","read","observe","pairs","group","clarify","respond","preview"])
  assert.match(src,new RegExp('id:"'+id+'"'));
 assert.match(src,/James 1:5–8/);
 assert.doesNotMatch(src,/leaderNotes|privateAnswers|versesFullText/);
});
test("facilitator uses existing role authorization and feature gate",()=>{
 const src=read("app/studies/discovery-pilot/page.tsx");
 assert.match(src,/auth\.getUser\(\)/);
 assert.match(src,/canManageStudies\(role\)/);
 assert.match(src,/getEffectiveRole/);
 assert.match(src,/LNF_DISCOVERY_PILOT_ENABLED/);
 assert.match(src,/discovery-leader-notes/);
 assert.match(src,/notFound\(\)/);
});
test("projector route excludes private leader notes and is feature gated",()=>{
 const src=read("app/studies/discovery-pilot/projector/page.tsx");
 assert.match(src,/auth\.getUser\(\)/);
 assert.match(src,/LNF_DISCOVERY_PILOT_ENABLED/);
 assert.doesNotMatch(src,/discovery-leader-notes|leaderNotes|createAdminClient/);
});
test("presentation has no participant answer storage, automatic advancement or notes in BroadcastChannel",()=>{
 const src=read("components/DiscoveryStudyPilot.tsx");
 assert.match(src,/BroadcastChannel/);
 assert.match(src,/type:"phase",phase:/);
 assert.match(src,/mode="projector"|mode:"projector"/);
 assert.match(src,/facilitator&&<aside/);
 assert.match(src,/No answers, testimonies or prayer requests are collected/);
 assert.doesNotMatch(src,/localStorage|sessionStorage|setInterval|setTimeout|\.insert\(|\.upsert\(/);
 assert.doesNotMatch(src,/postMessage\(\{[^}]*leaderNotes/);
});
