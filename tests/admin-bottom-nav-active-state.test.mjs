import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("components/BottomNav.tsx", "utf8");
assert.match(source, /item\.href!==\"\/admin\"/);
console.log("admin bottom-nav active state: ok");
