import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("L&F and Emmaus expose separate sign-in experiences over one Supabase identity",async()=>{
 const[lfp,emmaus,handoff]=await Promise.all([source("app","login","page.tsx"),source("app","emmaus","login","page.tsx"),source("app","auth","emmaus","route.ts")]);
 assert.match(lfp,/L&F Member Sign In/);
 assert.match(lfp,/Sign in to The Lost & Found Project/);
 assert.doesNotMatch(lfp,/Sign In & Open Emmaus/);
 assert.match(emmaus,/Emmaus Sign In/);
 assert.match(emmaus,/Sign In & Open Emmaus/);
 assert.match(emmaus,/createClient/);
 assert.match(emmaus,/signInWithPassword/);
 assert.match(handoff,/\/emmaus\/login\?next=/);
 assert.doesNotMatch(handoff,/\/login\?next=/);
});

test("L&F and Emmaus account creation preserve one account with context-aware return paths",async()=>{
 const[lfp,emmaus]=await Promise.all([source("app","signup","page.tsx"),source("app","emmaus","signup","page.tsx")]);
 assert.match(lfp,/Create your L&F account/);
 assert.match(lfp,/\/emmaus\/signup/);
 assert.match(emmaus,/Create your L&F account for Emmaus/);
 assert.match(emmaus,/\/auth\/emmaus\?next=/);
 assert.match(emmaus,/emailRedirectTo:redirectUrl/);
 assert.match(emmaus,/supabase\.auth\.signUp/);
});
