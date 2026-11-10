// Local-only Auth + PostgREST acceptance smoke for Bible-study privacy.
// Uses synthetic accounts in a disposable Supabase stack; NEVER a hosted DB.
// Requires 'supabase start'; GitHub CI runs it after isolated migration tests.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";

const status=spawnSync("supabase",["status","-o","env"],{encoding:"utf8",timeout:15000});
if(status.status!==0)throw Error("A disposable local Supabase instance is required.");
const env=Object.fromEntries(status.stdout.split(/\r?\n/).filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{
 const at=x.indexOf("=");return [x.slice(0,at),x.slice(at+1).replace(/^["']|["']$/g,"")];
}));
const api=env.API_URL;
if(!api)throw Error("Local API_URL not found.");
const endpoint=new URL(api);
if(endpoint.protocol!=="http:" || !["127.0.0.1","localhost"].includes(endpoint.hostname)
 || !["54321","59321"].includes(endpoint.port) || endpoint.pathname!=="/")
 throw Error("Refusing to connect to non-disposable Supabase endpoint.");
assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY,"Local API keys missing.");
// The fresh repository baseline intentionally does not grant server-side DML on
// every curriculum table. Give ONLY this disposable stack test-fixture access;
// do not alter application migrations or hosted project grants to seed tests.
const db=env.DB_URL;
if(!db)throw Error("Local DB_URL not found.");
const dbEndpoint=new URL(db);
if(!["postgres:","postgresql:"].includes(dbEndpoint.protocol)
 || !["127.0.0.1","localhost"].includes(dbEndpoint.hostname)
 || dbEndpoint.port!=="54322" || dbEndpoint.pathname!=="/postgres")
 throw Error("Refusing non-disposable local Postgres endpoint.");
const grants=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-d",db,
 "-c",`GRANT SELECT, INSERT, DELETE ON TABLE
 public.bible_studies,
 public.study_sessions,
 public.study_session_participants,
 public.study_daily_responses,
 public.study_daily_progress TO service_role;`],{encoding:"utf8",timeout:15000});
if(grants.status!==0)throw Error("Local-only fixture grant failed: "+grants.stderr);


const opts={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(api,env.SERVICE_ROLE_KEY,opts);
const anon=()=>createClient(api,env.ANON_KEY,opts);
const nonce=randomUUID(), password="LocalStudy-"+randomUUID()+"!9";
const userIds=[], sessionIds=[], studyIds=[];
let passed=0;
const check=(condition,label)=>{assert.ok(condition,label);passed++;console.log("PASS "+label)};
async function insertOne(table,row){
 const {data,error}=await service.from(table).insert(row).select("id").single();
 if(error)throw Error("Synthetic setup "+table+": "+error.message);
 return data.id;
}
async function insert(table,row){
 const {error}=await service.from(table).insert(row);
 if(error)throw Error("Synthetic setup "+table+": "+error.message);
}
async function signIn(index){
 const client=anon();
 const {error}=await client.auth.signInWithPassword({email:"lfp-study-"+index+"-"+nonce+"@example.test",password});
 if(error)throw Error("Local synthetic sign-in failed: "+error.message);
 return client;
}
try{
 for(let i=0;i<4;i++){
  const {data,error}=await service.auth.admin.createUser({
   email:"lfp-study-"+i+"-"+nonce+"@example.test",password,email_confirm:true
  });
  if(error)throw Error("Local synthetic user creation failed: "+error.message);
  userIds.push(data.user.id);
 }
 const [alice,bob,facilitator,outsider]=userIds;
 const studyId=await insertOne("bible_studies",{
  title:"Synthetic study privacy acceptance",is_published:true,devotional_cards:[{day:1}]
 });studyIds.push(studyId);
 const released=await insertOne("study_sessions",{
  bible_study_id:studyId,ministry_slug:"hearth",facilitator_user_id:facilitator,
  scheduled_start:new Date().toISOString(),
  daily_path_released_at:new Date(Date.now()-3600000).toISOString()
 });sessionIds.push(released);
 const unreleased=await insertOne("study_sessions",{
  bible_study_id:studyId,ministry_slug:"hearth",facilitator_user_id:facilitator,
  scheduled_start:new Date().toISOString()
 });sessionIds.push(unreleased);
 await insert("study_session_participants",[
  {study_session_id:released,user_id:alice},
  {study_session_id:released,user_id:bob},
  {study_session_id:unreleased,user_id:alice}
 ]);
 const alicePrivate=await insertOne("study_daily_responses",{
  study_session_id:released,user_id:alice,day_number:1,
  response_type:"private_journal",response_text:"Synthetic private A"
 });
 const bobPrivate=await insertOne("study_daily_responses",{
  study_session_id:released,user_id:bob,day_number:1,
  response_type:"private_journal",response_text:"Synthetic private B"
 });
 const bobGroup=await insertOne("study_daily_responses",{
  study_session_id:released,user_id:bob,day_number:1,
  response_type:"group_response",response_text:"Synthetic shared B",
  locked_at:new Date().toISOString()
 });
 const a=await signIn(0), b=await signIn(1), f=await signIn(2), o=await signIn(3);
 const ids=[alicePrivate,bobPrivate,bobGroup];
 const aliceBefore=await a.from("study_daily_responses").select("id").in("id",ids);
 if(aliceBefore.error)throw aliceBefore.error;
 check(aliceBefore.data.length===1 && aliceBefore.data[0].id===alicePrivate,
  "member cannot read another private journal or shared answer before locking own");
 const bobView=await b.from("study_daily_responses").select("id").in("id",ids);
 if(bobView.error)throw bobView.error;
 check(bobView.data.length===2 && bobView.data.some(x=>x.id===bobPrivate)
   && bobView.data.some(x=>x.id===bobGroup),
   "second participant can read own private and locked group responses");
 const facilitatorView=await f.from("study_daily_responses").select("id").in("id",ids);
 if(facilitatorView.error)throw facilitatorView.error;
 check(facilitatorView.data.length===1 && facilitatorView.data[0].id===bobGroup,
  "facilitator reads locked shared response but neither member private journal");
 const outsiderView=await o.from("study_daily_responses").select("id").in("id",ids);
 if(outsiderView.error)throw outsiderView.error;
 check(outsiderView.data.length===0,"unassigned user cannot read study responses");
 const forbidden=await a.from("study_daily_responses")
  .update({response_text:"Unauthorized edit"}).eq("id",bobPrivate).select("id");
 check(!forbidden.error && forbidden.data.length===0,
  "member cannot edit another member private journal");
 const premature=await a.from("study_daily_progress").insert({
  study_session_id:unreleased,user_id:alice,day_number:1
 });
 check(!!premature.error,"participant cannot start unreleased Daily Path");
 const forged=await a.from("study_daily_progress").insert({
  study_session_id:released,user_id:bob,day_number:1
 });
 check(!!forged.error,"participant cannot write another member daily progress");
 const outsideWrite=await o.from("study_daily_responses").insert({
  study_session_id:released,user_id:outsider,day_number:1,
  response_type:"private_journal",response_text:"Unauthorized"
 });
 check(!!outsideWrite.error,"nonparticipant cannot create study journal");
 const ownProgress=await a.from("study_daily_progress").insert({
  study_session_id:released,user_id:alice,day_number:1
 });
 check(!ownProgress.error,"assigned participant can start released Daily Path");
 const ownGroup=await a.from("study_daily_responses").insert({
  study_session_id:released,user_id:alice,day_number:1,
  response_type:"group_response",response_text:"Synthetic shared A",
  locked_at:new Date().toISOString()
 }).select("id").single();
 if(ownGroup.error)throw ownGroup.error;
 const aliceAfter=await a.from("study_daily_responses").select("id").eq("study_session_id",released);
 if(aliceAfter.error)throw aliceAfter.error;
 check(aliceAfter.data.length===3 && aliceAfter.data.some(x=>x.id===bobGroup)
   && !aliceAfter.data.some(x=>x.id===bobPrivate),
  "own locked response unlocks group answers without exposing private journals");
 const unsigned=anon();
 const anonymous=await unsigned.from("study_daily_responses").select("id").eq("study_session_id",released);
 check(!!anonymous.error || anonymous.data.length===0,
  "anonymous visitor cannot read study response records");
 console.log("LOCAL STUDY AUTH SMOKE PASS: "+passed+"/"+passed+" checks");
}finally{
 // This instance is disposable; still clean up in foreign-key order.
 for(const id of sessionIds.reverse()){
  const {error}=await service.from("study_sessions").delete().eq("id",id);
  if(error)console.warn("Synthetic study-session cleanup warning: "+error.message);
 }
 for(const id of studyIds){
  const {error}=await service.from("bible_studies").delete().eq("id",id);
  if(error)console.warn("Synthetic Bible-study cleanup warning: "+error.message);
 }
 for(const id of userIds)await service.auth.admin.deleteUser(id);
}
