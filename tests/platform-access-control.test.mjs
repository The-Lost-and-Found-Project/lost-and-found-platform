import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const root=process.cwd();const source=(...p)=>readFile(path.join(root,...p),"utf8");

test("legacy admin does not implicitly become owner",async()=>{const sql=await source("supabase","migrations","20260914020000_platform_access_roles.sql");assert.match(sql,/p\.role='admin' and 'admin'=any\(p_roles\)/);assert.doesNotMatch(sql,/p\.role='admin'.*'owner'=any\(p_roles\)/s)});

test("owner grant is not exposed through normal role RPC",async()=>{const sql=await source("supabase","migrations","20260914020000_platform_access_roles.sql");assert.match(sql,/Owner role must be provisioned out-of-band/);assert.match(sql,/Admins may only grant content editor/);assert.match(sql,/Ministry leaders cannot grant leader/)});

test("initial owner bootstrap is one-time and legacy-admin constrained",async()=>{const sql=await source("supabase","migrations","20260914021000_owner_bootstrap.sql");assert.match(sql,/Platform Owner already exists/);assert.match(sql,/role='admin'/);assert.match(sql,/lock table public\.platform_role_assignments/)});

test("facilitator center uses scoped access rather than global admin",async()=>{const page=await source("app","facilitator","studies","page.tsx");const actions=await source("app","facilitator","studies","actions.ts");assert.match(page,/canAccessFacilitatorCenter/);assert.match(page,/ministry assignments/i);assert.match(actions,/hasMinistryRole/);assert.match(actions,/Not authorized for this ministry/)});

test("ministry leaders can only manage participant and facilitator",async()=>{const actions=await source("app","ministry","access","actions.ts");assert.match(actions,/\["participant","facilitator"\]/);assert.match(actions,/Ministry leaders may assign Participant or Facilitator only/);assert.doesNotMatch(actions,/grant.*leader/i)});

test("admin access center protects owner and separates role types",async()=>{const page=await source("app","admin","access","page.tsx");assert.match(page,/Platform role/);assert.match(page,/Ministry assignment/);assert.match(page,/Owner is not assignable or revocable/);assert.match(page,/Claim Initial Owner Role/)});
