// Static, no-network release-file integrity guard. NEVER applies SQL.
// Supabase hosted history diverges from this repository: #181.
// Keep the release bundle allowlist narrow; do not automate a bulk db push.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const directory=join(root,"supabase","migrations");
// The offline bundle contains only these nine reviewed candidate migrations.
const expected=[
["20261105170653_restrict_anon_emmaus_table_grants.sql","9bde78e0509c4185a16defffa79052c8c99e69fb73e1c8bedfe40eb934b176d0"],
["20261105173628_verify_donor_email_before_history_access.sql","03e722ef5cd709c397c1726642cf411815a231b5689a7c16a9d2b806497a8fec"],
["20261105174247_grant_authenticated_ministry_access.sql","5f47224f22e92e543e3bbe765b72a4b8948b597b37641f4ecfa213ac9ba7440d"],
["20261105182138_grant_authenticated_study_path_access.sql","b5598e63776610ca7ad6f993ea7585c567538b3959deb11b52ebdc79ec542069"],
["20261105195229_restrict_study_auth_helper_rpc_visibility.sql","694990ef7335d61f28426a7df8a6bcf010936a2eb567c0be653e102c611d16c6"],
["20261110153802_atomic_ministry_publication_notifications.sql","8fe0660acfc3c8e94dddb3a33467b3ab4f7b7e41cc4af79563d3b2c9ceb5f515"],
["20261110181936_restore_notifications_schema_baseline.sql","1664fa8b04b51fc47e08ef76f53b374c9d21270e7632e23dc633a615abf48478"],
["20261110194736_restrict_notification_member_update_columns.sql","b0797f2e9519bb9ad6c5b15387bcf3cf3b047866d9f2679212822a5a6f1b169c"],
["20261124113000_add_notification_push_retry_claims.sql","1632357bec2c481a57742dd0ac33fa90d6540b0e2012ca8c35e41366f2c5ea15"]
];
// Exact current-main migrations are recognized and hash-pinned, but never
// included in the nine-file targeted bundle. Any new migration or edit
// forces review rather than silently broadening the deployment scope.
const currentBase=[
["20261111182457_marriage_journey_private_progress.sql","49a03ddf4071ae1ffeb092ad9783600e54f7bc0db5d7d2beded4609f5da96bed"],
["20261111184730_marriage_mentor_consent.sql","2ee8724b5b46fa4025baeb40382a32d875014c3e3220b072591bb8fd8ceaf717"],
["20261111234134_marriage_journey_assignments.sql","cd9d60d80277f1dbfcd9819157943bbd8d2d58d9837b0d5c32376e00053dc3f7"],
["20261111235017_group_only_daily_path_discussions.sql","9d5ff4e82d4f43b0c4906d4c1f4e20f29f8bbf38376122aa0563fa4ae4728197"],
["20261112001027_marriage_couple_assignments.sql","3bfd3c45d06fa459051914a226755a14482a890760f208c921545e292d084981"],
["20261112013759_bind_rls_helpers_to_caller.sql","0745e57895e9d6d488cae3361785786df3b3d8bccd0264c35eccbbcf8f89fd85"],
["20261112014942_pin_trigger_search_paths.sql","d5675617c79690dc57cc7592973ade45e9b09f8fc092b0deb4a2c5782d668442"],
["20261112090000_harden_prayer_request_member_guard.sql","435e6f9d922d94a809a27487d774651b0ba97d916cc1629b838bb95f540a14a4"],
["20261112093000_harden_sensitive_table_anon_privileges.sql","7efa291e33eca6bfe6f4355a92d507f6c6738727bb928f8c3c0fbac8a3c21ec9"],
["20261112110000_live_study_interactive_feed.sql","7789d02c91cd1029b31c768258defd0b519b0565d15f56de4cd32913a84e122d"],
["20261124100000_disable_public_directory_rpc.sql","0f41c1294188c7c73e6050bbe1078d8a7ace2350ee67bb92b44d074612583ec3"]
];
// #182 is a separately reviewed prerequisite, never part of this bundle.
const prerequisite=[
 "20261110224156_restore_daily_path_release_gate.sql",
 "4bc279783ab850f2eccb704b10b2db3c9a35a42f2ed15b1aa68aa436468b6bfe"
];
const actual=readdirSync(directory).filter(x=>/^202611\d{8}_.*\.sql$/.test(x)).sort();
const allowed=[...expected,...currentBase].map(x=>x[0]);
const hasPrerequisite=actual.includes(prerequisite[0]);
if(hasPrerequisite)allowed.push(prerequisite[0]);
assert.deepEqual(actual,allowed.sort(),"Unexpected November migration file or version. Review #181 and amend the allowlist before release.");
for(const [name,hash] of [...expected,...currentBase,...(hasPrerequisite?[prerequisite]:[])]){
 const actualHash=createHash("sha256").update(readFileSync(join(directory,name))).digest("hex");
 assert.equal(actualHash,hash,`Migration changed without review: ${name}. Re-review the SQL and update the manifest deliberately.`);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 console.log("RELEASE SCOPE VALID: 9 reviewed release migrations and 11 pinned current-base migrations match.");
 console.log("Only the 9 reviewed release migrations enter the offline bundle.");
 console.log("NO DATABASE ACTION TAKEN. Hosted history differs from repository (#181).");
 console.log("DO NOT run unrestricted 'supabase db push' against L&F Production.");
}
export {expected, currentBase, directory};
