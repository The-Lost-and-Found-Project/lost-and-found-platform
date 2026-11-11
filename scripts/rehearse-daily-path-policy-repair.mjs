// #182: Read-only-to-production rehearsal against disposable local Supabase.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const sql=readFileSync(join(root,"supabase/migrations/20261110224156_restore_daily_path_release_gate.sql"),"utf8");
const status=spawnSync("supabase",["status","-o","env"],{
 cwd:process.env.LFP_LOCAL_SUPABASE_CWD||root,encoding:"utf8",timeout:15000
});
if(status.status!==0)throw Error("Disposable local Supabase required.");
const line=status.stdout.split(/\r?\n/).find(x=>x.startsWith("DB_URL="));
if(!line)throw Error("Local DB_URL missing");
const db=line.slice(7).replace(/^["']|["']$/g,"");
const url=new URL(db);
assert.ok(["postgres:","postgresql:"].includes(url.protocol));
assert.ok(["localhost","127.0.0.1"].includes(url.hostname),"Hosted database forbidden");
assert.equal(url.port,"54322");assert.equal(url.pathname,"/postgres");
function run(name,body){
 const p=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q","-d",db],{
  input:body,encoding:"utf8",timeout:30000
 });
 if(p.status!==0)throw Error(name+": "+(p.stderr||p.stdout).slice(-3000));
 console.log("PASS "+name);
}
const check=`
DO $assert$
BEGIN
 IF to_regprocedure('public.is_daily_path_day_unlocked(uuid,uuid,integer)') IS NULL
 OR (select count(*) from pg_policies where schemaname='public'
     and tablename='study_daily_progress') <> 1
 OR (select count(*) from pg_policies where schemaname='public'
     and tablename='study_daily_responses') <> 3
 OR EXISTS(select 1 from pg_policies where schemaname='public'
     and policyname in ('participants manage own daily progress',
       'participants insert own daily responses',
       'participants read own or revealed group responses'))
 OR has_function_privilege('anon',
     'public.is_daily_path_day_unlocked(uuid,uuid,integer)','EXECUTE')
 THEN RAISE EXCEPTION 'Failed #182 repair postflight'; END IF;
END $assert$;`;
const legacy=`
BEGIN;
DROP POLICY IF EXISTS "participants manage own unlocked daily progress" ON public.study_daily_progress;
DROP POLICY IF EXISTS "participants insert own unlocked daily responses" ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants update own unlocked responses" ON public.study_daily_responses;
DROP POLICY IF EXISTS "participants read unlocked own or revealed group responses" ON public.study_daily_responses;
DROP FUNCTION IF EXISTS public.is_daily_path_day_unlocked(uuid,uuid,integer);
CREATE POLICY "participants manage own daily progress" ON public.study_daily_progress FOR ALL TO authenticated
 USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "participants insert own daily responses" ON public.study_daily_responses FOR INSERT TO authenticated
 WITH CHECK (user_id=auth.uid());
CREATE POLICY "participants update own unlocked responses" ON public.study_daily_responses FOR UPDATE TO authenticated
 USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE POLICY "participants read own or revealed group responses" ON public.study_daily_responses FOR SELECT TO authenticated
 USING (user_id=auth.uid());
${sql}
${check}
ROLLBACK;`;
run("legacy policy drift corrects in a rolled-back transaction",legacy);
run("modern baseline repair is idempotent",`BEGIN;\n${sql}\n${check}\nROLLBACK;`);
const rejection=spawnSync("psql",["-X","-v","ON_ERROR_STOP=1","-q","-d",db],{
 input:`BEGIN;
CREATE POLICY "unexpected permissive probe" ON public.study_daily_progress
FOR SELECT TO authenticated USING (true);
${sql}
ROLLBACK;`,
 encoding:"utf8",timeout:30000
});
assert.notEqual(rejection.status,0,"Unexpected permissive policy must block migration");
assert.match(rejection.stderr||"",/unexpected Daily Path RLS policy inventory/,"Expected deliberate preflight rejection");
console.log("PASS unexpected permissive policy fails closed (transaction discarded)");
console.log("No hosted connection; no permanent data or history changes.");
