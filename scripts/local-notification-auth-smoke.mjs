// Disposable local-only end-to-end Supabase Auth + Data API permission smoke.
// Invoke explicitly: node scripts/local-notification-auth-smoke.mjs
// Never connects to hosted Supabase, sends email, or uses a real member account.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const status=spawnSync("supabase",["status","-o","env"],{encoding:"utf8",timeout:15000});
if(status.status!==0)throw Error("Local Supabase must be running.");
const env=Object.fromEntries(status.stdout.split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{
  const at=x.indexOf("=");return [x.slice(0,at),x.slice(at+1).replace(/^["']|["']$/g,"")];
}));
const api=env.API_URL;
if(!api)throw Error("Missing local Supabase API_URL");
const endpoint=new URL(api);
if(endpoint.protocol!=="http:"||!["127.0.0.1","localhost"].includes(endpoint.hostname)
   ||!["54321","59321"].includes(endpoint.port)){
  throw Error("Refusing non-disposable Supabase host or port");
}
assert.ok(env.ANON_KEY&&env.SERVICE_ROLE_KEY,"Missing local credentials");
const service=createClient(api,env.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=()=>createClient(api,env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const nonce=randomUUID();
const password="LocalSmoke-"+randomUUID()+"!9";
const users=[];
const rows=[];
let checks=0;
function ok(condition,label){assert.ok(condition,label);checks++;console.log("PASS "+label);}
try{
  for(let i=0;i<2;i++){
    const {data,error}=await service.auth.admin.createUser({
      email:`synthetic-${i}-${nonce}@example.test`,password,email_confirm:true
    });
    if(error)throw error;
    users.push(data.user.id);
  }
  for(let i=0;i<2;i++){
    const {data,error}=await service.from("notifications")
      .insert({user_id:users[i],type:"test",title:"Synthetic notification "+i})
      .select("id").single();
    if(error)throw error;
    rows.push(data.id);
  }
  const a=anon(),b=anon();
  const signinA=await a.auth.signInWithPassword({email:`synthetic-0-${nonce}@example.test`,password});
  if(signinA.error)throw signinA.error;
  const signinB=await b.auth.signInWithPassword({email:`synthetic-1-${nonce}@example.test`,password});
  if(signinB.error)throw signinB.error;
  const mine=await a.from("notifications").select("id").in("id",rows);
  if(mine.error)throw mine.error;
  ok(mine.data.length===1&&mine.data[0].id===rows[0],"authenticated member reads only own notification");
  const cross=await a.from("notifications").update({read_at:new Date().toISOString()})
    .eq("id",rows[1]).select("id");
  if(cross.error)throw cross.error;
  ok(cross.data.length===0,"member cannot update another member notification");
  const own=await a.from("notifications").update({read_at:new Date().toISOString()})
    .eq("id",rows[0]).select("id,read_at");
  if(own.error)throw own.error;
  ok(own.data.length===1&&!!own.data[0].read_at,"member can mark own notification read");
  const forged=await a.from("notifications").update({push_status:"sent"})
    .eq("id",rows[0]).select("id");
  ok(!!forged.error,"member cannot forge push delivery status");
  const server=await service.from("notifications").select("id,user_id,read_at,push_status")
    .in("id",rows);
  if(server.error)throw server.error;
  const ownState=server.data.find(x=>x.id===rows[0]), otherState=server.data.find(x=>x.id===rows[1]);
  ok(!!ownState.read_at&&ownState.push_status==="pending"&&otherState.read_at===null,
    "trusted readback confirms isolation and intact push state");
  const otherView=await b.from("notifications").select("id").in("id",rows);
  if(otherView.error)throw otherView.error;
  ok(otherView.data.length===1&&otherView.data[0].id===rows[1],
    "second synthetic member reads own notification only");
  console.log(`LOCAL AUTH SMOKE PASS: ${checks}/${checks} checks`);
}finally{
  if(rows.length)await service.from("notifications").delete().in("id",rows);
  for(const id of users)await service.auth.admin.deleteUser(id);
}
