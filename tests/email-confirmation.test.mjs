import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("signup and resend use the canonical confirmation redirect", async () => {
  const [signup, resend, helper] = await Promise.all([
    readFile(path.join(root, "app", "signup", "page.tsx"), "utf8"),
    readFile(path.join(root, "components", "ResendConfirmationForm.tsx"), "utf8"),
    readFile(path.join(root, "lib", "auth", "confirmation.ts"), "utf8"),
  ]);

  assert.match(signup, /emailRedirectTo: getConfirmationRedirectUrl/);
  assert.match(resend, /type: "signup"/);
  assert.match(resend, /emailRedirectTo: getConfirmationRedirectUrl/);
  assert.match(helper, /NEXT_PUBLIC_SITE_URL/);
  assert.match(helper, /https:\/\/app\.lostandfoundproject\.org/);
});

test("token hash and legacy code confirmation routes expose safe outcomes", async () => {
  const [confirm, callback, statusPage] = await Promise.all([
    readFile(path.join(root, "app", "auth", "confirm", "route.ts"), "utf8"),
    readFile(path.join(root, "app", "auth", "callback", "route.ts"), "utf8"),
    readFile(path.join(root, "app", "auth", "confirmation", "page.tsx"), "utf8"),
  ]);

  assert.match(confirm, /verifyOtp/);
  assert.match(confirm, /type !== "email"/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /getConfirmationStatusUrl/);
  assert.match(statusPage, /invalid, expired, or has already been used/);
  assert.match(statusPage, /ResendConfirmationForm/);
});

test("confirmation destinations reject external redirects", async () => {
  const helper = await readFile(
    path.join(root, "lib", "auth", "confirmation.ts"),
    "utf8"
  );

  assert.match(helper, /!value\.startsWith\("\/\/"\)/);
  assert.match(helper, /!value\.includes\("\\\\"\)/);
  assert.match(helper, /return "\/dashboard"/);
});
