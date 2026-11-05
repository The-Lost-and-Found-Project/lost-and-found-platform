import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const sourcePath=new URL("../app/admin/ministries/actions.ts",import.meta.url);

test("ministry follower dispatch only uses server admin client after scoped manager authorization",async()=>{
 const source=await readFile(sourcePath,"utf8");
 assert.match(source,/import\s*\{\s*createAdminClient\s*\}\s*from\s*"@\/lib\/supabase\/admin"/);
 assert.match(source,/await requireManager\(ministry_slug\)/);
 assert.match(source,/async function notifyFollowers\(slug:string,title:string,contentType:string\)/);
 assert.match(source,/const admin=createAdminClient\(\)/);
 assert.match(source,/admin\.from\("ministry_memberships"\)\.select\("user_id"\)\.eq\("ministry_slug",slug\)/);
 assert.match(source,/admin\.from\("notifications"\)\.insert\(rows\)/);
 assert.doesNotMatch(source,/notifyFollowers\(supabase,/);
});

test("notifications are dispatched only after successful publish actions",async()=>{
 const source=await readFile(sourcePath,"utf8");
 assert.match(source,/if\(error\)throw new Error\(error\.message\);if\(publish\)await dispatchFollowerNotice\(ministry_slug,title,contentType\)/);
 assert.match(source,/if\(error\)throw new Error\(error\.message\);if\(!is_published&&item\)await dispatchFollowerNotice\(ministry_slug,item\.title,item\.content_type\)/);
 assert.match(source,/if\(memberError\)throw new Error/);
 assert.match(source,/try\{await notifyFollowers\(slug,title,contentType\);\}/);
 assert.match(source,/catch\(error\)/);
});
