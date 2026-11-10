// Static, no-network release-file integrity guard. NEVER applies SQL.
// Supabase hosted history diverges from this repository: #181.
// Keep this allowlist narrow; do not automate a bulk db push.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join,resolve} from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const directory=join(root,"supabase","migrations");
const expected=[
["20261105170653_restrict_anon_emmaus_table_grants.sql","9bde78e0509c4185a16defffa79052c8c99e69fb73e1c8bedfe40eb934b176d0"],
["20261105173628_verify_donor_email_before_history_access.sql","03e722ef5cd709c397c1726642cf411815a231b5689a7c16a9d2b806497a8fec"],
["20261105174247_grant_authenticated_ministry_access.sql","5f47224f22e92e543e3bbe765b72a4b8948b597b37641f4ecfa213ac9ba7440d"],
["20261105182138_grant_authenticated_study_path_access.sql","b5598e63776610ca7ad6f993ea7585c567538b3959deb11b52ebdc79ec542069"],
["20261105195229_restrict_study_auth_helper_rpc_visibility.sql","694990ef7335d61f28426a7df8a6bcf010936a2eb567c0be653e102c611d16c6"],
["20261110153802_atomic_ministry_publication_notifications.sql","8fe0660acfc3c8e94dddb3a33467b3ab4f7b7e41cc4af79563d3b2c9ceb5f515"],
["20261110181936_restore_notifications_schema_baseline.sql","1664fa8b04b51fc47e08ef76f53b374c9d21270e7632e23dc633a615abf48478"],
["20261110194736_restrict_notification_member_update_columns.sql","b0797f2e9519bb9ad6c5b15387bcf3cf3b047866d9f2679212822a5a6f1b169c"]
];
const actual=readdirSync(directory).filter(x=>/^202611\d{8}_.*\.sql$/.test(x)).sort();
assert.deepEqual(actual,expected.map(x=>x[0]),"Unexpected November migration file or version. Review #181 and amend the allowlist before release.");
for(const [name,hash] of expected){
 const actualHash=createHash("sha256").update(readFileSync(join(directory,name))).digest("hex");
 assert.equal(actualHash,hash,`Migration changed without review: ${name}. Re-review the SQL and update the manifest deliberately.`);
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 console.log("RELEASE SCOPE VALID: 8 reviewed November migration files and SHA-256 hashes match.");
 console.log("NO DATABASE ACTION TAKEN. Hosted history differs from repository (#181).");
 console.log("DO NOT run unrestricted 'supabase db push' against L&F Production.");
}

// Reuse the single reviewed allowlist for offline bundle preparation.
export {expected, directory};
