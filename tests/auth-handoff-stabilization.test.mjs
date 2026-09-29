import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("deep Studio pages preserve their exact destination through authentication",()=>{
  const routes=[
    ["app/studio/directory/page.tsx","%2Fstudio%2Fdirectory"],
    ["app/studio/directory/review/page.tsx","%2Fstudio%2Fdirectory%2Freview"],
    ["app/studio/directory/partnerships/page.tsx","%2Fstudio%2Fdirectory%2Fpartnerships"],
    ["app/studio/giving/budget/page.tsx","%2Fstudio%2Fgiving%2Fbudget"],
    ["app/studio/giving/transactions/page.tsx","%2Fstudio%2Fgiving%2Ftransactions"],
    ["app/studio/giving/communications/page.tsx","%2Fstudio%2Fgiving%2Fcommunications"],
    ["app/studio/giving/compliance/page.tsx","%2Fstudio%2Fgiving%2Fcompliance"],
    ["app/studio/giving/stories/page.tsx","%2Fstudio%2Fgiving%2Fstories"],
    ["app/studio/giving/campaigns/page.tsx","%2Fstudio%2Fgiving%2Fcampaigns"],
    ["app/help/manual/admin/page.tsx","%2Fhelp%2Fmanual%2Fadmin"],
  ];
  for(const [path,next] of routes){
    assert.match(read(path),new RegExp(`login\\?next=${next}`),path);
  }
});

test("shared capability guards can preserve a caller-supplied destination",()=>{
  const guard=read("lib/role-access.ts");
  const groups=read("app/admin/studies/groups/page.tsx");
  assert.match(guard,/nextPath = "\/dashboard"/);
  assert.match(guard,/encodeURIComponent\(nextPath\)/);
  assert.match(groups,/requireAppCapability\("study_groups", "\/admin\/studies\/groups"\)/);
});


test("Studio cards lead to operational management surfaces instead of member-facing browse pages",()=>{
  const page=read("app/studio/page.tsx");
  assert.match(page,/href:"\/admin\/studies"[\s\S]*title:"Studies"/);
  assert.match(page,/href:"\/admin\/ministries"[\s\S]*title:"Ministries"/);
  assert.match(page,/href:"\/studio\/directory"[\s\S]*title:"Directory"/);
  assert.doesNotMatch(page,/href:"\/studies"[\s\S]*title:"Studies"/);
  assert.doesNotMatch(page,/href:"\/ministries"[\s\S]*title:"Ministries"/);
  assert.doesNotMatch(page,/href:"\/directory"[\s\S]*title:"Directory"/);
});
