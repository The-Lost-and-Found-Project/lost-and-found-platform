import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const sql = read('supabase/migrations/20261111184730_marriage_mentor_consent.sql');
const actions = read('app/marriage-journey/sharing/actions.ts');
const dashboard = read('app/marriage-journey/mentor/page.tsx');
test('mentors receive only explicitly copied snapshots and never private journal table access', () => {
 assert.match(sql,/marriage_mentor_updates/);
 assert.doesNotMatch(sql,/grant.*marriage_journey_progress.*mentor/i);
 assert.match(sql,/and s.status = 'active'/);
 assert.match(sql,/marriage_mentor_shares.*on delete cascade/s);
});
test('participant owns sharing, consent is reversible, and flag changes clear previous snapshots', () => {
 assert.match(sql,/Participant grants access/);
 assert.match(sql,/Participant removes grant/);
 assert.match(sql,/clear_marriage_updates_on_permission_change/);
 assert.match(sql,/old.share_commitments is distinct from new.share_commitments/);
 assert.match(actions,/operation === "revoke"/);
 assert.match(actions,/participant_id: user.id/);
});
test('mentor dashboard queries only mentor-scoped shared updates', () => {
 assert.match(dashboard,/marriage_mentor_updates/);
 assert.match(dashboard,/\.eq\("mentor_id",user.id\)/);
 assert.doesNotMatch(dashboard,/marriage_journey_progress/);
});
test('new grants require explicit confirmation of mentor identity', () => {
 const page = read('app/marriage-journey/sharing/page.tsx');
 assert.match(page,/name="verifiedMentor" required/);
 assert.match(actions,/formData.get\("verifiedMentor"\) !== "on"/);
 assert.match(page,/independently confirmed/);
});

test('sharing rejects grants with no authorized categories', () => {
 assert.match(actions,/Choose at least one category to share/);
 assert.match(actions,/No sharing categories are enabled/);
});

test('sharing never manufactures an update for an unsaved session', () => {
 assert.match(actions,/if \(!progress\) throw new Error/);
});
