import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261112001027_marriage_couple_assignments.sql');
test('only two distinct active spouses belong to a couple',()=>{
 assert.match(sql,/marriage_couples_distinct check\(spouse_one <> spouse_two\)/);
 assert.match(sql,/prevent_overlapping_marriage_couples/);
 assert.match(sql,/revoked_at is null/);
});
test('partner answers unlock only after own submission, journals remain private',()=>{
 assert.match(sql,/has_submitted_marriage_couple_answer\(couple_id,session_number\)/);
 assert.match(sql,/user_id=\(select auth.uid\(\)\)/);
 assert.match(sql,/public.has_active_marriage_couple/);
 assert.doesNotMatch(sql,/create policy .*spouse.*marriage_journey_progress.*spouse/i);
});
test('couple assignments gate routes and dashboard and use paired admin workflow',()=>{
 assert.match(read('lib/marriage-assignment.ts'),/getMarriageCouple/);
 assert.match(read('app/dashboard/page.tsx'),/marriageCouple&&<Link/);
 assert.match(read('app/admin/marriage-journey/actions.ts'),/spouse_one:target,spouse_two:partner/);
 assert.match(read('app/marriage-journey/[session]/page.tsx'),/submitMarriageCoupleAnswer/);
});
