import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Emmaus entry routes through the canonical L&F identity before secure handoff",async()=>{
 const[lfp,emmaus,handoff]=await Promise.all([source("app","login","page.tsx"),source("app","emmaus","login","page.tsx"),source("app","auth","emmaus","route.ts")]);
 assert.match(lfp,/Two experiences\. One account\./);
 assert.match(lfp,/Sign In & Open Emmaus/);
 assert.match(emmaus,/\/login\?source=emmaus&next=/);
 assert.match(emmaus,/\/auth\/emmaus\?next=/);
 assert.match(handoff,/EMMAUS_SSO_SECRET/);
 assert.match(handoff,/exp: now \+ 120/);
});

test("Emmaus signup preserves one L&F account and returns through the handoff",async()=>{
 const[lfp,emmaus]=await Promise.all([source("app","signup","page.tsx"),source("app","emmaus","signup","page.tsx")]);
 assert.match(lfp,/Create your L&F account for Emmaus/);
 assert.match(lfp,/Sign in & open Emmaus/);
 assert.match(lfp,/user_already_exists/);
 assert.match(emmaus,/\/signup\?source=emmaus&next=/);
 assert.match(emmaus,/\/auth\/emmaus\?next=/);
});
