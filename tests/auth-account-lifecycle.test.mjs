import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("account security is directly reachable from the signed-in account menu", () => {
  const source = read("components/AuthControls.tsx");
  assert.match(source, /href: "\/account", label: "Account & Security"/);
});

test("all L&F sign-out controls terminate on an intentional signed-out login state", () => {
  for (const path of ["components/AuthControls.tsx", "components/SignOutButton.tsx"]) {
    const source = read(path);
    assert.match(source, /supabase\.auth\.signOut\(\)/);
    assert.match(source, /router\.replace\("\/login\?signedOut=1"\)/);
    assert.doesNotMatch(source, /router\.push\("\/"\)/);
  }
});

test("account password recovery remains canonical for both L&F and Emmaus", () => {
  const account = read("components/AccountClient.tsx");
  const recovery = read("app/auth/recovery/route.ts");
  const reset = read("app/reset-password/page.tsx");
  assert.match(account, /resetPasswordForEmail/);
  assert.match(account, /\/auth\/recovery/);
  assert.match(account, /both L&amp;F and Emmaus/);
  assert.match(recovery, /exchangeCodeForSession/);
  assert.match(reset, /supabase\.auth\.updateUser\(\{password\}\)/);
  assert.match(reset, /both L&F and Emmaus/);
});

test("self-delete authenticates the member and only deletes that authenticated user", () => {
  const source = read("app/api/account/delete-self/route.ts");
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /if \(!user\)/);
  assert.match(source, /admin\.auth\.admin\.deleteUser\(user\.id\)/);
  assert.match(source, /only remaining admin/);
});
