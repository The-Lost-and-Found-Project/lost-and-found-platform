import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Emmaus sign-in uses the canonical L&F identity without exposing L&F auth UI",async()=>{
 const[emmaus,handoff]=await Promise.all([source("app","emmaus","login","page.tsx"),source("app","auth","emmaus","route.ts")]);
 assert.match(emmaus,/Sign in to Emmaus/);
 assert.match(emmaus,/signInWithPassword/);
 assert.match(emmaus,/\/auth\/emmaus\?next=/);
 assert.match(emmaus,/A ministry of The Lost & Found Project/);
 assert.doesNotMatch(emmaus,/source=emmaus/);
 assert.match(handoff,/EMMAUS_SSO_SECRET/);
 assert.match(handoff,/exp: now \+ 120/);
});

test("Emmaus signup creates the canonical identity through an Emmaus-first form",async()=>{
 const emmaus=await source("app","emmaus","signup","page.tsx");
 assert.match(emmaus,/Create Emmaus account/);
 assert.match(emmaus,/auth\.signUp/);
 assert.match(emmaus,/\/auth\/emmaus\?next=/);
 assert.match(emmaus,/user_already_exists/);
 assert.doesNotMatch(emmaus,/Gender<select/);
 assert.doesNotMatch(emmaus,/Phone Number/);
 assert.doesNotMatch(emmaus,/community guidelines/);
});
