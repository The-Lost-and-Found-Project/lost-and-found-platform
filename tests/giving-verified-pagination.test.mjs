import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function harness(pages){
 const source=await readFile(new URL("../lib/zeffy.ts",import.meta.url),"utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 let saved=null;
 let calls=[];
 const admin={
  auth:{admin:{async listUsers(args){calls.push(args);return pages[args.page-1]??{data:{users:[]},error:null}}}},
  from(table){
   if(table!=="giving_transactions")throw Error("Unexpected table: "+table);
   return {upsert(row){saved=row;return {select(){return {single:async()=>({data:{id:"synthetic-transaction"},error:null})}}}}};
  }
 };
 const exportsRef={};
 vm.runInNewContext(compiled,{
  exports:exportsRef,
  require(id){
   if(id==="server-only")return {};
   if(id==="@/lib/supabase/admin")return {createAdminClient:()=>admin};
   if(id==="@/lib/giving-email")return {sendGivingEmail:async()=>{throw Error("unexpected email")},givingLinks:{myGiving:"/account/giving"}};
   throw Error("Unexpected import "+id);
  },
  process:{env:{}},
  console:{error(){}},
  fetch:async()=>{throw Error("unexpected network access")},
  Date,URL,Number,String,Promise,Error,Math
 });
 const payment={id:"synthetic-payment",email:"verified@example.test",status:"refunded"};
 return {run:()=>exportsRef.upsertVerifiedZeffyPayment(payment),calls:()=>calls,saved:()=>saved};
}
const filler=Array.from({length:1000},(_,i)=>({id:"filler-"+i,email:"other"+i+"@example.test",email_confirmed_at:"2026-01-01"}));

test("verified donor beyond first Auth page still receives correct link",async()=>{
 const h=await harness([{data:{users:filler},error:null},{data:{users:[{id:"verified-id",email:" VERIFIED@example.test ",email_confirmed_at:"2026-01-01",email_change:"",is_anonymous:false}]},error:null}]);
 await h.run();
 assert.equal(h.saved().user_id,"verified-id");
 assert.equal(h.calls().length,2);
 assert.deepEqual(h.calls().map(x=>x.page),[1,2]);
});

test("unconfirmed donor never receives account ownership",async()=>{
 const h=await harness([{data:{users:[{id:"unconfirmed-id",email:"verified@example.test",email_confirmed_at:null}]},error:null}]);
 await h.run();
 assert.equal(h.saved().user_id,null);
 assert.equal(h.calls().length,1);
});

test("Auth lookup failure records donation without account assignment",async()=>{
 const h=await harness([{data:null,error:{message:"synthetic outage"}}]);
 await h.run();
 assert.equal(h.saved().user_id,null);
 assert.equal(h.calls().length,1);
});
