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

test("Emmaus-specific sign-in and sign-up preserve the requested destination without redirecting into L&F auth",()=>{
 const login=read("app/emmaus/login/page.tsx");
 const signup=read("app/emmaus/signup/page.tsx");
 assert.match(login,/\/auth\/emmaus\?next=/);
 assert.match(signup,/\/auth\/emmaus\?next=/);
 assert.match(login,/Sign in to Emmaus/);
 assert.match(signup,/Create Emmaus account/);
 assert.doesNotMatch(login,/redirect\(\`\/login\?source=emmaus/);
 assert.doesNotMatch(signup,/redirect\(\`\/signup\?source=emmaus/);
});

test("L&F owns primary password recovery for the shared identity",()=>{
 const account=read("components/AccountClient.tsx");
 assert.match(account,/resetPasswordForEmail/);
 assert.match(account,/Send password reset email/);
});


test("Emmaus auth keeps L&F as quiet attribution and avoids community-only signup fields",()=>{
 const login=read("app/emmaus/login/page.tsx");
 const signup=read("app/emmaus/signup/page.tsx");
 assert.match(login,/A ministry of The Lost &amp; Found Project/);
 assert.match(signup,/A ministry of The Lost &amp; Found Project/);
 assert.doesNotMatch(signup,/Gender<select/);
 assert.doesNotMatch(signup,/community guidelines/);
 assert.doesNotMatch(signup,/Phone Number/);
});
