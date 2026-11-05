import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("member giving pages rely on database RLS rather than interpolated email filters", async () => {
 for(const page of ["app/account/giving/page.tsx","app/account/giving/annual/page.tsx"]) {
  const source=await readFile(new URL(page,root),"utf8");
  assert.match(source,/auth\.getUser\(\)/,page);
  assert.match(source,/\.from\("giving_transactions"\)/,page);
  assert.doesNotMatch(source,/contact_email\.ilike|\.or\(`user_id\.eq\./,page);
 }
});

test("Zeffy email-to-account matching requires verified and stable account email",async()=>{
 const source=await readFile(new URL("lib/zeffy.ts",root),"utf8");
 assert.match(source,/!!u\.email_confirmed_at/);
 assert.match(source,/!u\.email_change/);
 assert.match(source,/!u\.is_anonymous/);
});
