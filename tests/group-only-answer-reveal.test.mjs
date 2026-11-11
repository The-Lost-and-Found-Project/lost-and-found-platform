import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261111235017_group_only_daily_path_discussions.sql');
const page=read('app/study-path/[sessionId]/[day]/page.tsx');
const actions=read('app/study-path/[sessionId]/[day]/actions.ts');
test('individual sessions and inactive groups cannot share group answers',()=>{
 assert.match(sql,/join public\.study_groups g on g\.id=ss\.group_id and g\.status='active'/);
 assert.match(sql,/ss\.facilitator_user_id is not null/);
 assert.match(sql,/leader\.group_role='facilitator' and leader\.membership_status='active'/);
 assert.match(sql,/gm\.membership_status='active'/);
 assert.match(sql,/sp\.study_session_id=ss\.id and sp\.user_id=uid/);
});
test('database denies unassigned group submissions and enforces answer-to-unlock',()=>{
 assert.match(sql,/response_type <> 'group_response' or public\.is_active_administered_study_group_member/);
 assert.match(sql,/public\.has_locked_group_response/);
 assert.match(sql,/response_type='group_response' and locked_at is not null/);
});
test('group UI and actions are both gated; private journals stay independent',()=>{
 assert.match(page,/\{groupAllowed&&<section/);
 assert.match(actions,/if\(!allowed\)throw new Error/);
 assert.match(page,/Save private journal/);
 assert.match(actions,/savePrivateJournal/);
});
