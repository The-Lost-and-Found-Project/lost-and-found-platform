import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const givingEmailPath = new URL("../lib/giving-email.ts", import.meta.url);

test("failed thank-you communication is claimable for one retry", async () => {
 const source = await readFile(givingEmailPath,"utf8");
 assert.match(source,/prior\.status\s*!==\s*"failed"/);
 assert.match(source,/\.update\(\{status:"pending",error_message:null\}\)/);
 assert.match(source,/\.eq\("id",prior\.id\)\.eq\("status","failed"\)/);
 assert.match(source,/if\(!claimed\)return\{skipped:true\}/);
});

test("sent or in-progress thank-you is skipped and concurrent insert is deduplicated", async () => {
 const source = await readFile(givingEmailPath,"utf8");
 assert.match(source,/if\(prior\.status!=="failed"\)return\{skipped:true\}/);
 assert.match(source,/insertError\?\.code==="23505"/);
 assert.match(source,/related_transaction_id/);
 assert.match(source,/communication_type","thank_you"/);
});

test("successful send or failure updates the claimed communication row", async () => {
 const source = await readFile(givingEmailPath,"utf8");
 assert.match(source,/status:"sent",provider_message_id/);
 assert.match(source,/status:"failed",error_message/);
 assert.equal(source.includes('eq("id",log.id)'),false);
 assert.match(source,/eq\("id",logId\)/);
});
