import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root=process.cwd();
const source=(...parts)=>readFile(path.join(root,...parts),"utf8");

test("Learning Lab exposes active distinct entry modes",async()=>{const learn=await source("app","learn","page.tsx");assert.match(learn,/\/trivia\?mode=daily/);assert.match(learn,/\/trivia\?mode=trivia/);assert.match(learn,/\/trivia\?category=language-insights/);assert.match(learn,/\/memory/);assert.match(learn,/\/library\?type=study/);assert.match(learn,/Play → Learn → Remember → Understand → Apply/);assert.match(learn,/Learning Lab is active/)});

test("Trivia accepts direct Daily Challenge and Language Insights entry",async()=>{const page=await source("app","trivia","page.tsx");const client=await source("components","TriviaClient.tsx");assert.match(page,/searchParams:Promise<SearchParams>/);assert.match(page,/params\.mode==="daily"/);assert.match(page,/params\.category/);assert.match(client,/initialMode/);assert.match(client,/initialCategoryId/);assert.match(client,/initialMode==="daily"/);assert.match(client,/initialMode==="category"/)});

test("Language Insights preserves context-first semantic guardrails",async()=>{const [page,client,migration]=await Promise.all([source("app","trivia","page.tsx"),source("components","TriviaClient.tsx"),source("supabase","migrations","20260912195700_add_member_learning_modes.sql")]);assert.match(page,/semantic sense/);assert.match(client,/semantic range is not a menu of simultaneous meanings/);assert.match(client,/sentence, grammar, author, genre, and wider context/);assert.match(migration,/Context determines meaning/)});

test("Learning rounds continue beyond the score",async()=>{const client=await source("components","TriviaClient.tsx");assert.match(client,/After the Answer/);assert.match(client,/Remember Scripture/);assert.match(client,/Understand with an L&F Study/);assert.match(client,/Dig deeper in Emmaus/);assert.match(client,/Practice a memory verse/);assert.match(client,/Open an L&F Study/)});

test("Memory Verse mode remains member progress based and WEB sourced",async()=>{const [page,migration]=await Promise.all([source("app","memory","page.tsx"),source("supabase","migrations","20260912195700_add_member_learning_modes.sql")]);assert.match(page,/memory_verse_progress/);assert.match(page,/mastery/);assert.match(migration,/translation text not null default 'WEB'/);assert.match(migration,/Users manage own verse progress/)});
