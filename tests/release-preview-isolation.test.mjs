import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function runProxy(env) {
  const source=await readFile(new URL("../proxy.ts",import.meta.url),"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const calls=[];
  class FakeResponse {
    constructor(body,opts){this.body=body;this.status=opts.status;this.headers=opts.headers;}
  }
  const exportsRef={};
  vm.runInNewContext(js,{
    exports:exportsRef,
    process:{env}, URL,
    require(id){
      if(id==="@/lib/supabase/middleware")return {updateSession:async(req)=>{calls.push(req);return {status:200}}};
      if(id==="next/server")return {NextResponse:FakeResponse};
      throw Error("Unexpected import: "+id);
    },
  });
  const response=await exportsRef.proxy({url:"https://test.example.test/account"});
  return {response,calls};
}

const release="release/lfp-security-ministry-giving-20261110";
test("release preview denies requests before touching auth when isolation is unverified",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:release});
 assert.equal(response.status,503);
 assert.equal(calls.length,0);
 assert.equal(response.headers["Cache-Control"],"no-store");
});
test("release preview remains denied with explicit false staging flag",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:release,LFP_RELEASE_PREVIEW_ISOLATED:"false"});
 assert.equal(response.status,503);
 assert.equal(calls.length,0);
});
test("release preview can pass only after isolated staging is explicitly enabled",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:release,LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:"https://synthetic-staging.supabase.co"});
 assert.equal(response.status,200);
 assert.equal(calls.length,1);
});
test("production remains unchanged by release preview guard",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"production",VERCEL_GIT_COMMIT_REF:release});
 assert.equal(response.status,200);
 assert.equal(calls.length,1);
});
test("other preview branches using this release code remain fail-closed",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:"feat/unrelated"});
 assert.equal(response.status,503);
 assert.equal(calls.length,0);
});

test("missing Vercel branch metadata cannot bypass the preview lock",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview"});
 assert.equal(response.status,503);
 assert.equal(calls.length,0);
});

test("release preview rejects Production Supabase even when isolation flag is true",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:"https://lsxaadzyonvvdbzewpql.supabase.co"});
 assert.equal(response.status,503);
 assert.equal(calls.length,0);
});
test("release preview rejects missing or malformed Supabase URL even when flagged isolated",async()=>{
 for(const url of ["", "not-a-url", "http://synthetic-staging.supabase.co", "https://example.com"]){
  const {response,calls}=await runProxy({VERCEL_ENV:"preview",LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:url});
  assert.equal(response.status,503);
  assert.equal(calls.length,0);
 }
});


test("release preview blocks all existing organization projects, not just L&F Production",async()=>{
 for(const ref of [
  "lsxaadzyonvvdbzewpql",
  "mlsxnknanhyhqxebrfwz",
  "abqakvjrtshslvnddinl",
  "mnrwybmsalvnyloquvan",
  "iypbqzoudnamjsrmairh"
 ]){
  const {response,calls}=await runProxy({VERCEL_ENV:"preview",LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:"https://"+ref+".supabase.co"});
  assert.equal(response.status,503,"existing project "+ref+" must never be used as L&F preview staging");
  assert.equal(calls.length,0);
 }
});
test("release preview rejects Supabase URLs with extra paths, queries, fragments or credentials",async()=>{
 for(const url of [
  "https://synthetic-staging.supabase.co/rest/v1",
  "https://synthetic-staging.supabase.co/?foo=bar",
  "https://synthetic-staging.supabase.co/#fragment",
  "https://user:password@synthetic-staging.supabase.co",
  "https://synthetic-staging.supabase.co:8443/"
 ]){
  const {response,calls}=await runProxy({VERCEL_ENV:"preview",LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:url});
  assert.equal(response.status,503,"non-origin-only staging URL must be rejected: "+url);
  assert.equal(calls.length,0);
 }
});

test("release preview blocks live outbound credentials even with an explicit staging flag",async()=>{
 const base={VERCEL_ENV:"preview",LFP_RELEASE_PREVIEW_ISOLATED:"true",NEXT_PUBLIC_SUPABASE_URL:"https://synthetic-staging.supabase.co"};
 for(const key of [
  "RESEND_API_KEY","VAPID_PRIVATE_KEY","DAILY_API_KEY","DAILY_DOMAIN",
  "ZEFFY_API_KEY","OPENAI_API_KEY","TURNSTILE_SECRET_KEY",
  "INTERNAL_API_SECRET","CRON_SECRET"
 ]){
  const {response,calls}=await runProxy({...base,[key]:"synthetic-but-present"});
  assert.equal(response.status,503,"configured outbound credential "+key+" must block release Preview");
  assert.equal(calls.length,0);
 }
});
test("production is not blocked by the release Preview provider-credential guard",async()=>{
 const {response,calls}=await runProxy({VERCEL_ENV:"production",RESEND_API_KEY:"synthetic-but-present",DAILY_API_KEY:"synthetic-but-present"});
 assert.equal(response.status,200);
 assert.equal(calls.length,1);
});
