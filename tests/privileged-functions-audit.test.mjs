import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const doc=readFileSync(new URL('../docs/security/privileged-functions-audit.md',import.meta.url),'utf8');
test('audit documents sensitive caller identity and explicit safe release gates',()=>{
 for(const name of ['is_lfp_admin(uid uuid)','has_locked_group_response','is_daily_path_day_unlocked','is_study_group_facilitator','auth.uid()','synthetic identities','pg_policies']) assert.ok(doc.includes(name),name);
});
