import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

// Execute the real server action with synthetic identities and in-memory clients.
// No network requests, production records, or actual member notifications.
async function createHarness({authorized,failNotification=false}){
 const source=await readFile(new URL("../app/admin/ministries/actions.ts",import.meta.url),"utf8");
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const events=[];
 let adminClients=0;
 const identity="00000000-0000-4000-8000-000000000c11";
 const roster=[{user_id:"synthetic-a"},{user_id:"synthetic-b"}];
 function chain(table,kind,values,service){
  const predicates=[];
  const q={
   eq(column,value){predicates.push([column,value]);return this;},
   select(){return this;},
   single:async()=>result(),
   maybeSingle:async()=>result(),
   then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)}
  };
  function result(){
   events.push({table,kind,service,predicates,values});
   if(table==="profiles"&&kind==="select")return {data:{role:"member"},error:null};
   if(table==="ministry_memberships"&&kind==="select"){
    if(service==="admin")return {data:roster,error:null};
    return {data:authorized?{id:"self-leader"}:null,error:null};
   }
   if(table==="ministry_content"&&kind==="insert")return {data:null,error:null};
   if(table==="notifications"&&kind==="insert")return {data:null,error:failNotification?{message:"synthetic delivery failure"}:null};
   throw Error("Unexpected operation "+table+" "+kind);
  }
  return q;
 }
 function client(service){return {
  auth:{getUser:async()=>({data:{user:{id:identity}}})},
  from(table){return {
   select(){return chain(table,"select",null,service)},
   insert(values){return chain(table,"insert",values,service)},
   update(values){return chain(table,"update",values,service)},
   delete(){return chain(table,"delete",null,service)}
  }}
 }}
 const exportsRef={};
 const context={
  exports:exportsRef,
  require(id){
   if(id==="next/cache")return {revalidatePath(){}};
   if(id==="next/navigation")return {redirect(url){throw new Error("REDIRECT:"+url)}};
   if(id==="@/lib/supabase/server")return {createClient:async()=>client("member")};
   if(id==="@/lib/supabase/admin")return {createAdminClient:()=>{adminClients++;return client("admin")}};
   throw Error("Unexpected import "+id);
  },
  console:{error:()=>{}},
  Error,String,Date,Promise
 };
 vm.runInNewContext(compiled,context,{filename:"ministries-actions-mock.js"});
 const form={get(key){return {
  ministry_slug:"hearth",title:"Synthetic announcement",content_type:"announcement",is_published:"on"
 }[key]??null}};
 return {publish:()=>exportsRef.createMinistryContent(form),events,adminCount:()=>adminClients};
}

test("unauthorized member cannot invoke privileged follower lookup",async()=>{
 const h=await createHarness({authorized:false});
 await assert.rejects(h.publish(),/REDIRECT:\/dashboard/);
 assert.equal(h.adminCount(),0);
 assert.equal(h.events.some(x=>x.table==="notifications"),false);
});

test("authorized ministry leader uses server-only scoped follower fanout",async()=>{
 const h=await createHarness({authorized:true});
 await h.publish();
 assert.equal(h.adminCount(),1);
 const rosterRead=h.events.find(x=>x.table==="ministry_memberships"&&x.service==="admin");
 assert.ok(rosterRead);
 assert.equal(rosterRead.predicates.some(([k,v])=>k==="ministry_slug"&&v==="hearth"),true);
 const delivered=h.events.find(x=>x.table==="notifications");
 assert.ok(delivered);
 assert.equal(delivered.service,"admin");
 assert.equal(delivered.values.length,2);
 assert.ok(delivered.values.every(x=>x.link==="/ministries/hearth"));
});

test("post-publication delivery failure does not request publishing retry",async()=>{
 const h=await createHarness({authorized:true,failNotification:true});
 await assert.doesNotReject(h.publish());
 assert.equal(h.events.filter(x=>x.table==="ministry_content"&&x.kind==="insert").length,1);
 assert.equal(h.events.filter(x=>x.table==="notifications"&&x.kind==="insert").length,1);
});
