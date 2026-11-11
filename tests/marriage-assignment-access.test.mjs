import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const migration=read('supabase/migrations/20261111234134_marriage_journey_assignments.sql');
const gate=read('lib/marriage-assignment.ts');
const dashboard=read('app/dashboard/page.tsx');
const admin=read('app/admin/marriage-journey/actions.ts');
test('marriage access requires active assignment and denies unassigned users',()=>{
 assert.match(gate,/\.is\("revoked_at", null\)/);
 assert.match(gate,/if \(error \|\| !data\) redirect/);
 for(const p of ['app/marriage-journey/page.tsx','app/marriage-journey/[session]/page.tsx','app/marriage-journey/[session]/actions.ts','app/marriage-journey/sharing/page.tsx','app/marriage-journey/sharing/actions.ts']) assert.match(read(p),/requireMarriageAssignment\(/);
});
test('RLS restricts private progress to active assignments and revocation clears mentor shares',()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/marriage_journey_progress\.user_id and a\.revoked_at is null/);
 assert.match(migration,/clear_marriage_shares_on_unassignment/);
 assert.match(migration,/delete from public\.marriage_mentor_shares/);
 assert.match(migration,/marriage_mentor_updates\.participant_id and a\.revoked_at is null/);
});
test('assigned studies appear only on member dashboard; admins manage assignment',()=>{
 assert.match(dashboard,/marriageAssignment&&<Link href="\/marriage-journey"/);
 assert.match(admin,/getEffectiveRole\(profile\?\.role,profile\?\.preview_role\)!=="admin"/);
 assert.match(admin,/operation === "assign"/);
 assert.match(admin,/operation === "assign"/);
});
