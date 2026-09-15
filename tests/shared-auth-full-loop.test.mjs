import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("L&F Emmaus handoff requires an authenticated canonical user",()=>{
 const source=read("app/auth/emmaus/route.ts");
 assert.match(source,/supabase\.auth\.getUser\(\)/);
 assert.match(source,/if \(!user\)/);
 assert.match(source,/\/emmaus\/login\?next=/);
});

test("L&F signs a short-lived audience-bound Emmaus assertion",()=>{
 const source=read("app/auth/emmaus/route.ts");
 assert.match(source,/createHmac\("sha256"/);
 assert.match(source,/iss: "lost-and-found-project"/);
 assert.match(source,/aud: "emmaus"/);
 assert.match(source,/sub: user\.id/);
 assert.match(source,/exp: now \+ 120/);
 assert.match(source,/EMMAUS_SSO_SECRET/);
});

test("Emmaus-specific sign-in and sign-up preserve the requested destination",()=>{
 const login=read("app/emmaus/login/page.tsx");
 const signup=read("app/emmaus/signup/page.tsx");
 assert.match(login,/\/auth\/emmaus\?next=/);
 assert.match(login,/Same account/);
 assert.match(signup,/auth\/callback\?next=/);
 assert.match(signup,/Create Account & Continue to Emmaus/);
});

test("L&F owns primary password recovery for the shared identity",()=>{
 const account=read("components/AccountClient.tsx");
 assert.match(account,/resetPasswordForEmail/);
 assert.match(account,/Send password reset email/);
});
