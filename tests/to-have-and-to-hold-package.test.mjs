import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import test from "node:test";
const root=process.cwd();
const sql=()=>readFile(path.join(root,"supabase","migrations","20260915010000_seed_to_have_and_to_hold.sql"),"utf8");

test("To Have and To Hold is an approved deployable study",async()=>{const s=await sql();for(const text of ["'to-have-and-to-hold'","'To Have and To Hold'","'Maintaining What God Has Given Us'","array['general','hearth','foundry']",'"live_target_minutes":60',"'approved'"])assert.ok(s.includes(text),`missing ${text}`)});

test("To Have and To Hold contains exactly one Day 1 through Day 14 journey",async()=>{const s=await sql();const days=[...s.matchAll(/^\s*\(v_study_id,(\d+),(\d+),'([^']+)'/gm)];assert.equal(days.length,14);assert.deepEqual(days.map(x=>Number(x[1])),Array.from({length:14},(_,i)=>i+1));assert.deepEqual(days.map(x=>Number(x[2])),Array.from({length:14},(_,i)=>i+1))});

test("journey follows the approved alternating formation rhythm",async()=>{const s=await sql();for(const kind of ['dig_deeper','live_it','scripture_focus','reflect','real_life','prayer','sabbath_reset','go_deeper','prepare','bridge'])assert.ok(s.includes(`'${kind}'`),`missing ${kind}`);assert.match(s,/Rest from catch-up/i)});

test("study package preserves the source study's core Scripture and metaphors",async()=>{const s=await sql();for(const text of ['1 Thessalonians 5:21','Hebrews 10:23','Mark 10:9','Proverbs 4:23','Galatians 6:9','Matthew 6:24','The Washing Machine','Rehabilitation'])assert.ok(s.includes(text),`missing ${text}`)});
