import assert from "node:assert/strict";
import fs from "node:fs";

const frame = fs.readFileSync("components/AppFrame.tsx", "utf8");
const page = fs.readFileSync("app/admin/page.tsx", "utf8");
const command = fs.readFileSync("components/AdminCommandCenter.tsx", "utf8");

assert.match(frame, /!p\.startsWith\("\/admin"\)&&<BottomNav\/>/);
assert.doesNotMatch(page, /Administration Center/);
assert.doesNotMatch(page, /AdminStat/);
assert.match(command, /Ministry signals and next actions/);
console.log("admin home de-duplication: ok");
