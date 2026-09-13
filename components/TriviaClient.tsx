"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Difficulty = "beginner" | "intermediate" | "advanced";
type Category = { id:string; name:string; description:string; approvedCount:number };
type Question = { id:string; question:string; choices:string[]; correct:string; ref:string; note:string; difficulty?:Difficulty };
type BestScore = { score:number; totalQuestions:number };
type EntryMode = "browse"|"daily"|"category";
type Props = { userId:string; categories:Category[]; bestScores:Record<string,BestScore>; initialMode?:EntryMode; initialCategoryId?:string|null };
type Screen = "categories" | "loading" | "quiz" | "results";

const ACCENTS=["bg-blue-600","bg-emerald-600","bg-violet-600","bg-amber-600","bg-rose-600","bg-cyan-600"];
const DIFFICULTIES:Difficulty[]=["beginner","intermediate","advanced"];

function shuffle<T>(items:T[]){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function dailyIndex(length:number){const day=new Date().toISOString().slice(0,10);let hash=0;for(const c of day)hash=(hash*31+c.charCodeAt(0))>>>0;return length?hash%length:0}

export default function TriviaClient({userId,categories,bestScores:initialBestScores,initialMode="browse",initialCategoryId=null}:Props){
 const [screen,setScreen]=useState<Screen>("categories");
 const [categoryId,setCategoryId]=useState<string|null>(null);
 const [questions,setQuestions]=useState<Question[]>([]);
 const [questionIndex,setQuestionIndex]=useState(0);
 const [score,setScore]=useState(0);
 const [selectedChoice,setSelectedChoice]=useState<string|null>(null);
 const [difficulty,setDifficulty]=useState<Difficulty|"mixed">("mixed");
 const [daily,setDaily]=useState(false);
 const [saving,setSaving]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [bestScores,setBestScores]=useState(initialBestScores);
 const initialized=useRef(false);
 const playable=useMemo(()=>categories.filter(c=>c.approvedCount>0),[categories]);
 const category=categories.find(c=>c.id===categoryId)||null;
 const question=questions[questionIndex]||null;
 const accent=ACCENTS[Math.max(0,categories.findIndex(c=>c.id===categoryId))%ACCENTS.length];

 async function loadCategory(id:string,opts?:{daily?:boolean;difficulty?:Difficulty|"mixed"}){
  const modeDifficulty=opts?.difficulty??difficulty; setCategoryId(id); setDaily(Boolean(opts?.daily)); setLoadError(""); setScreen("loading");
  try{
   const supabase=createClient();
   let {data,error}=await supabase.rpc("get_quiz_questions_v2",{p_category_id:id,p_limit:opts?.daily?7:10,p_difficulty:modeDifficulty==="mixed"?null:modeDifficulty});
   if(error){const fallback=await supabase.rpc("get_quiz_questions",{p_category_id:id,p_limit:opts?.daily?7:10});data=fallback.data;error=fallback.error}
   if(error)throw error;
   const fetched:Question[]=(data??[]).map((row:any)=>({...row,choices:shuffle(row.choices as string[])}));
   if(!fetched.length){setLoadError("No approved questions match that challenge yet. Try Mixed difficulty.");setScreen("categories");return}
   setQuestions(fetched);setQuestionIndex(0);setScore(0);setSelectedChoice(null);setScreen("quiz");
  }catch{setLoadError("Couldn't load questions right now. Please try again.");setScreen("categories")}
 }
 function startDaily(){if(!playable.length){setLoadError("The Daily Challenge needs approved questions before it can start.");return}const preferred=playable.filter(c=>c.id!=="language-insights");const pool=preferred.length?preferred:playable;loadCategory(pool[dailyIndex(pool.length)].id,{daily:true,difficulty:"mixed"})}
 useEffect(()=>{if(initialized.current)return;initialized.current=true;if(initialMode==="daily")startDaily();else if(initialMode==="category"&&initialCategoryId)loadCategory(initialCategoryId,{difficulty:"mixed"})},[]);
 function selectChoice(choice:string){if(selectedChoice)return;setSelectedChoice(choice);if(question&&choice===question.correct)setScore(s=>s+1)}
 async function saveAttempt(){if(!category)return;setSaving(true);try{const supabase=createClient();await supabase.from("quiz_attempts").insert({user_id:userId,category:daily?`daily:${category.id}`:category.id,score,total_questions:questions.length});setBestScores(prev=>{const key=category.id;const existing=prev[key];if(existing&&existing.score>=score)return prev;return{...prev,[key]:{score,totalQuestions:questions.length}}})}finally{setSaving(false)}}
 async function nextQuestion(){if(questionIndex===questions.length-1){await saveAttempt();setScreen("results")}else{setQuestionIndex(i=>i+1);setSelectedChoice(null)}}
 function reset(){setScreen("categories");setCategoryId(null);setQuestions([]);setQuestionIndex(0);setSelectedChoice(null);setDaily(false)}

 if(screen==="categories"||!category)return <div className="mt-6">
  {loadError&&<p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{loadError}</p>}
  <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
   <button onClick={startDaily} disabled={!playable.length} className="rounded-[1.8rem] bg-slate-950 p-6 text-left text-white shadow-xl transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50"><p className="text-[11px] font-black uppercase tracking-[.18em] text-sky-300">Daily Challenge</p><h3 className="mt-2 text-3xl font-black">Seven questions. One focused rhythm.</h3><p className="mt-3 leading-7 text-slate-300">A rotating challenge from the approved L&F question bank. Each answer includes Scripture and an After the Answer teaching point.</p><span className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950">Play today's challenge →</span></button>
   <div className="lfp-card p-6"><p className="lfp-eyebrow">Difficulty</p><h3 className="mt-2 text-2xl font-black text-slate-950">Choose your depth.</h3><div className="mt-4 grid grid-cols-2 gap-2">{(["mixed",...DIFFICULTIES] as const).map(level=><button key={level} onClick={()=>setDifficulty(level)} className={`rounded-xl px-3 py-3 text-sm font-black capitalize ${difficulty===level?"bg-blue-700 text-white":"bg-slate-100 text-slate-700"}`}>{level}</button>)}</div><p className="mt-4 text-sm leading-6 text-slate-500">Mixed is best for normal play. Difficulty filters let you focus without turning biblical learning into a status score.</p></div>
  </div>
  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((c,i)=>{const best=bestScores[c.id];const isLanguage=c.id==="language-insights";return <button key={c.id} disabled={!c.approvedCount} onClick={()=>loadCategory(c.id)} className="lfp-card p-5 text-left disabled:opacity-50"><div className="flex items-start justify-between gap-3"><div className={`h-1.5 w-12 rounded-full ${ACCENTS[i%ACCENTS.length]}`}/>{isLanguage&&<span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-violet-700">Context first</span>}</div><h3 className="mt-4 text-xl font-black text-slate-950">{c.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{c.description}</p><div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500"><span>{c.approvedCount} questions</span>{best&&<span>Best {best.score}/{best.totalQuestions}</span>}</div></button>})}</div>
 </div>;

 if(screen==="loading")return <div className="mt-6 lfp-card p-10 text-center"><p className="font-black text-slate-800">Building your challenge…</p><p className="mt-2 text-sm text-slate-500">Loading approved questions and shuffling answer choices.</p></div>;

 if(screen==="quiz"&&question){const answered=selectedChoice!==null;const isLast=questionIndex===questions.length-1;return <div className="mt-6">
  <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={reset} className="font-black text-slate-500">← Challenges</button><div className="flex items-center gap-2 text-sm font-black text-slate-500"><span>{daily?"Daily Challenge":category.name}</span><span>•</span><span>{questionIndex+1}/{questions.length}</span><span>•</span><span>{score} correct</span></div></div>
  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${accent} transition-all`} style={{width:`${((questionIndex+(answered?1:0))/questions.length)*100}%`}}/></div>
  <section className="lfp-card mt-5 p-6 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">{category.name}</p>{question.difficulty&&<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-600">{question.difficulty}</span>}</div><h3 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{question.question}</h3><div className="mt-6 grid gap-3">{question.choices.map(choice=>{const correct=choice===question.correct;const selected=choice===selectedChoice;let cls="border-slate-200 bg-white";if(answered&&correct)cls="border-emerald-300 bg-emerald-50";else if(answered&&selected&&!correct)cls="border-rose-300 bg-rose-50";return <button key={choice} disabled={answered} onClick={()=>selectChoice(choice)} className={`rounded-2xl border px-4 py-4 text-left font-bold text-slate-800 transition ${cls}`}>{choice}</button>})}</div>
   {answered&&<div className="mt-6 rounded-[1.4rem] bg-blue-50 p-5"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">After the Answer · {question.ref}</p><p className="mt-2 leading-7 text-slate-700">{question.note}</p>{category.id==="language-insights"&&<p className="mt-3 text-sm font-bold leading-6 text-violet-800">Language guardrail: semantic range is not a menu of simultaneous meanings. Read the word in its sentence, grammar, author, genre, and wider context.</p>}<div className="mt-4 flex flex-wrap gap-3"><Link href="/memory" className="font-black text-blue-700">Remember Scripture →</Link><Link href="/library?type=study" className="font-black text-blue-700">Understand with an L&F Study →</Link><Link href={`/auth/emmaus?next=${encodeURIComponent("/study/bible")}`} className="font-black text-blue-700">Dig deeper in Emmaus →</Link></div></div>}
   {answered&&<button onClick={nextQuestion} disabled={saving} className={`mt-5 w-full rounded-2xl px-5 py-3 font-black text-white ${accent}`}>{isLast?(saving?"Saving…":"See Results"):"Next Question →"}</button>}
  </section>
 </div>}

 const pct=questions.length?score/questions.length:0;return <div className="mt-6 lfp-card p-8 text-center"><p className="lfp-eyebrow">{daily?"Daily Challenge complete":category.name}</p><div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-3xl font-black text-blue-700">{score}/{questions.length}</div><h3 className="mt-5 text-3xl font-black text-slate-950">{pct===1?"Perfect round.":pct>=.7?"Strong work.":"Keep building."}</h3><p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">The score closes the round; it does not close the lesson. Move one step further so the truth becomes something you remember, understand, and apply.</p><div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3"><Link href="/memory" className="rounded-2xl bg-blue-50 p-4 text-left"><span className="text-[10px] font-black uppercase tracking-[.13em] text-blue-700">Remember</span><span className="mt-1 block font-black text-slate-950">Practice a memory verse →</span></Link><Link href="/library?type=study" className="rounded-2xl bg-emerald-50 p-4 text-left"><span className="text-[10px] font-black uppercase tracking-[.13em] text-emerald-700">Understand</span><span className="mt-1 block font-black text-slate-950">Open an L&F Study →</span></Link><Link href="/auth/emmaus?next=/study" className="rounded-2xl bg-violet-50 p-4 text-left"><span className="text-[10px] font-black uppercase tracking-[.13em] text-violet-700">Dig deeper</span><span className="mt-1 block font-black text-slate-950">Continue in Emmaus →</span></Link></div><div className="mt-6 flex flex-wrap justify-center gap-3"><button onClick={()=>loadCategory(category.id,{daily,difficulty})} className="lfp-button lfp-button-primary">Play again</button><button onClick={reset} className="lfp-button lfp-button-secondary">Choose another challenge</button></div></div>
}
