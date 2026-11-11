import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

// Run the actual server-side sender using an isolated in-memory database and
// a mocked Resend HTTP endpoint; never send donor email or touch Production.
async function harness() {
  const source=await readFile(new URL("../lib/giving-email.ts",import.meta.url),"utf8");
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const rows=[];
  let failures=0,sends=0,failSentRecord=false,networkFail=false,serverFail=false;
  const outbound=[];
  function query(table,operation,payload){
    const filters=[];
    const result={
      eq(k,v){filters.push([k,v]);return this;},
      select(){return this;},
      async maybeSingle(){return execute(true);},
      async single(){return execute(false);},
      then(resolve,reject){return Promise.resolve(execute(false)).then(resolve,reject)}
    };
    function matches(row){return filters.every(([key,value])=>row[key]===value)}
    function execute() {
      if(table!=="giving_communications")throw Error("Unexpected table "+table);
      if(operation==="select")return {data:rows.find(matches)||null,error:null};
      if(operation==="insert") {
        if(rows.some(r=>r.related_transaction_id===payload.related_transaction_id&&r.communication_type==="thank_you"))return {data:null,error:{code:"23505",message:"duplicate"}};
        const row={...payload,id:"test-row-"+(rows.length+1),status:"pending"};rows.push(row);return {data:{id:row.id},error:null};
      }
      if(operation==="update"){
        if(payload.status==="sent"&&failSentRecord)return {data:null,error:{message:"mock database outage"}};
        const row=rows.find(matches);
        if(!row)return {data:null,error:null};
        Object.assign(row,payload);
        return {data:{id:row.id},error:null};
      }
      throw Error("Unexpected operation");
    }
    return result;
  }
  const db={from(table){return {
    select(){return query(table,"select");},
    insert(row){return query(table,"insert",row);},
    update(row){return query(table,"update",row);}
  }}};
  const mockModule={exports:{}};
  const sandbox={
    module:mockModule,exports:mockModule.exports,
    require(spec){
      if(spec==="server-only")return {};
      if(spec==="@/lib/supabase/admin")return {createAdminClient:()=>db};
      throw Error("Unexpected import "+spec);
    },
    process:{env:{RESEND_API_KEY:"test-only",NEXT_PUBLIC_APP_URL:"https://example.test"}},
    fetch:async(url,options)=>{outbound.push({url,headers:options.headers,body:options.body});sends++;if(networkFail)throw Error("simulated connection lost");if(serverFail)return {ok:false,status:503,json:async()=>({message:"mock ambiguous server error"})};if(failures-->0)return {ok:false,status:400,json:async()=>({message:"mock provider failure"})};return {ok:true,json:async()=>({id:"mock-provider-"+sends})};},
    console:{error(){}},
    Date,Error,Promise,JSON,String,Boolean
  };
  vm.runInNewContext(code,sandbox,{filename:"giving-email.mocked.js"});
  return {
    send:mockModule.exports.sendGivingEmail,
    rows,
    failOnce:()=>{failures=1;},
    failNetwork:()=>{networkFail=true;},
    failServer:()=>{serverFail=true;},
    failSuccessRecording:()=>{failSentRecord=true;},
    sendCount:()=>sends,
    outbound:()=>outbound
  };
}
const message={to:"synthetic-donor@example.test",userId:null,kind:"thank_you",subject:"Thank you",heading:"Thanks",body:"Synthetic gift",transactionId:"00000000-0000-4000-8000-000000000991"};

test("provider failure persists failed status and retry succeeds exactly once",async()=>{
 const h=await harness();h.failOnce();
 await assert.rejects(h.send(message),/mock provider failure/);
 assert.equal(h.rows.length,1);
 assert.equal(h.rows[0].status,"failed");
 const r=await h.send(message);
 assert.equal(r.sent,true);
 assert.equal(h.sendCount(),2);
 assert.equal(h.rows[0].status,"sent");
 const duplicate=await h.send(message);
 assert.equal(duplicate.skipped,true);
 assert.equal(h.sendCount(),2);
 assert.equal(h.rows.length,1);
});

test("already pending thank-you never resends without verified retry state",async()=>{
 const h=await harness();
 h.rows.push({id:"existing",communication_type:"thank_you",related_transaction_id:message.transactionId,status:"pending"});
 const result=await h.send(message);
 assert.equal(result.skipped,true);
 assert.equal(h.sendCount(),0);
});

test("overlapping webhook and manual sync attempts produce only one provider send",async()=>{
 const h=await harness();
 const outcomes=await Promise.all([h.send(message),h.send(message)]);
 assert.equal(h.rows.length,1);
 assert.equal(h.sendCount(),1);
 assert.equal(outcomes.filter(x=>x.sent===true).length,1);
 assert.equal(outcomes.filter(x=>x.skipped===true).length,1);
});

test("thank-you retries reuse the same provider idempotency key and payload",async()=>{
 const h=await harness();
 h.failOnce();
 await assert.rejects(h.send(message),/mock provider failure/);
 await h.send(message);
 const requests=h.outbound();
 assert.equal(requests.length,2);
 assert.equal(requests[0].headers["Idempotency-Key"],"giving-thank-you/"+message.transactionId);
 assert.equal(requests[1].headers["Idempotency-Key"],requests[0].headers["Idempotency-Key"]);
 assert.equal(requests[1].body,requests[0].body);
});

test("provider success followed by database failure remains pending for reconciliation",async()=>{
 const h=await harness();
 h.failSuccessRecording();
 await assert.rejects(h.send(message),/delivery state could not be recorded/);
 assert.equal(h.sendCount(),1);
 assert.equal(h.rows.length,1);
 assert.equal(h.rows[0].status,"pending");
 const repeat=await h.send(message);
 assert.equal(repeat.skipped,true);
 assert.equal(h.sendCount(),1);
});

test("network transport failure remains pending and is never automatically retried",async()=>{
 const h=await harness();
 h.failNetwork();
 await assert.rejects(h.send(message),/outcome uncertain after network failure/);
 assert.equal(h.rows[0].status,"pending");
 assert.equal(h.sendCount(),1);
 const r=await h.send(message);
 assert.equal(r.skipped,true);
 assert.equal(h.sendCount(),1);
});

test("provider 5xx response stays pending rather than becoming retryable",async()=>{
 const h=await harness();
 h.failServer();
 await assert.rejects(h.send(message),/outcome uncertain after provider server error/);
 assert.equal(h.rows[0].status,"pending");
 const r=await h.send(message);
 assert.equal(r.skipped,true);
 assert.equal(h.sendCount(),1);
});
