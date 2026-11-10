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
    process:{env},
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
 const {response,calls}=await runProxy({VERCEL_ENV:"preview",VERCEL_GIT_COMMIT_REF:release,LFP_RELEASE_PREVIEW_ISOLATED:"true"});
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
