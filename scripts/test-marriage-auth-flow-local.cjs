// Local-only authenticated API acceptance test. Uses disposable synthetic users.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(execFileSync('supabase', ['status','-o','env'], {encoding:'utf8'}).split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
const url = 'http://127.0.0.1:54321';
const admin = createClient(url,env.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const clients = [];
const ids = [];
const check = (result,label) => {if(result.error)throw new Error(`${label}: ${result.error.message}`);return result.data;};
(async()=>{
 try {
  for(const role of ['participant-a','participant-b','mentor']) {
   const email=`marriage-${role}-${Date.now()}@test.invalid`;
   const password=`LocalOnly!${crypto.randomUUID()}Z9`;
   const created=check(await admin.auth.admin.createUser({email,password,email_confirm:true}),`create ${role}`);
   ids.push(created.user.id);
   const client=createClient(url,env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
   check(await client.auth.signInWithPassword({email,password}),`sign in ${role}`);
   clients.push(client);
  }
  const [a,b,mentor]=clients;
  const [aid,bid,mid]=ids;
  check(await a.from('marriage_journey_progress').upsert({user_id:aid,session_number:1,private_reflection:'LOCAL PRIVATE JOURNAL',shared_commitment:'Practice listening',completed_at:new Date().toISOString()}),'save session');
  assert.equal(check(await a.from('marriage_journey_progress').select('private_reflection').eq('user_id',aid),'owner read').length,1);
  assert.equal(check(await b.from('marriage_journey_progress').select('*').eq('user_id',aid),'other participant read').length,0);
  assert.equal(check(await mentor.from('marriage_journey_progress').select('*').eq('user_id',aid),'mentor journal read').length,0);
  check(await a.from('marriage_mentor_shares').insert({participant_id:aid,mentor_id:mid,share_progress:true,share_commitments:false,status:'active'}),'grant mentor');
  check(await a.from('marriage_mentor_updates').insert({participant_id:aid,mentor_id:mid,session_number:1,completed:true,commitment:''}),'share update');
  const seen=check(await mentor.from('marriage_mentor_updates').select('completed,commitment').eq('participant_id',aid),'mentor read');
  assert.equal(seen.length,1);assert.equal(seen[0].completed,true);assert.equal(seen[0].commitment,'');
  assert.equal(check(await b.from('marriage_mentor_updates').select('*').eq('participant_id',aid),'other participant shared read').length,0);
  const blocked=await mentor.from('marriage_mentor_shares').update({share_commitments:true}).eq('participant_id',aid).select();
  assert.ok(blocked.error || blocked.data.length===0,'mentor cannot broaden consent');
  check(await a.from('marriage_mentor_shares').delete().eq('participant_id',aid).eq('mentor_id',mid),'revoke mentor');
  assert.equal(check(await mentor.from('marriage_mentor_updates').select('*').eq('participant_id',aid),'read after revoke').length,0);
  console.log('PASS: authenticated save, journal isolation, grant, share, consent isolation, and revoke');
 } finally {
  for(const id of ids) {const r=await admin.auth.admin.deleteUser(id);if(r.error)console.error('Cleanup failed:',r.error.message)}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
