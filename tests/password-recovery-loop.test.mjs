import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("both sign-in doors expose password recovery while preserving destination",()=>{
 const login=read("app/login/page.tsx");
 const emmaus=read("app/emmaus/login/page.tsx");
 assert.match(login,/Forgot password\?/);
 assert.match(login,/\/forgot-password\?next=/);
 assert.match(emmaus,/Forgot password\?/);
 assert.match(emmaus,/\/forgot-password\?next=/);
});

test("password recovery uses a dedicated callback instead of the signup confirmation callback",()=>{
 const forgot=read("app/forgot-password/page.tsx");
 const recovery=read("app/auth/recovery/route.ts");
 assert.match(forgot,/resetPasswordForEmail/);
 assert.match(forgot,/\/auth\/recovery\?next=/);
 assert.match(recovery,/exchangeCodeForSession/);
 assert.doesNotMatch(recovery,/send-welcome-email/);
 assert.match(recovery,/startsWith\("\/"\)/);
 assert.match(recovery,/startsWith\("\/\/"\)/);
 assert.match(recovery,/includes\("\\\\"\)/);
});

test("reset completion updates the canonical password and returns to a safe destination",()=>{
 const reset=read("app/reset-password/page.tsx");
 assert.match(reset,/updateUser\(\{password\}\)/);
 assert.match(reset,/minLength=\{10\}/);
 assert.match(reset,/window\.location\.replace\(safeNext\(\)\)/);
 assert.match(reset,/startsWith\("\/"\)/);
 assert.match(reset,/startsWith\("\/\/"\)/);
});

test("signed-in account reset also uses the dedicated recovery callback",()=>{
 const account=read("components/AccountClient.tsx");
 assert.match(account,/resetPasswordForEmail/);
 assert.match(account,/\/auth\/recovery\?next=/);
 assert.match(account,/\/reset-password\?next=%2Faccount/);
});
