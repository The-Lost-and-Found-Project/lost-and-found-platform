"use client";

import { useMemo, useState } from "react";

type Question={question:string;options:string[];answer:number;explanation?:string;scripture?:string};

export default function TriviaPlayer({questions}:{questions:Question[]}){
 const safe=useMemo(()=>questions.filter(q=>q?.question&&Array.isArray(q.options)&&q.options.length>=2),[questions]);
 const [index,setIndex]=useState(0),[selected,setSelected]=useState<number|null>(null),[score,setScore]=useState(0),[done,setDone]=useState(false);
 if(!safe.length)return <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-slate-600">Trivia questions have not been added yet.</div>;
 const q=safe[index]; const correct=selected===q.answer;
 function choose(i:number){if(selected!==null)return;setSelected(i);if(i===q.answer)setScore(s=>s+1)}
 function next(){if(index===safe.length-1){setDone(true);return}setIndex(i=>i+1);setSelected(null)}
 if(done)return <div className="rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white"><p className="text-xs font-black uppercase tracking-[.16em] text-sky-300">Round complete</p><h2 className="mt-2 text-4xl font-black">{score}/{safe.length}</h2><p className="mt-3 text-slate-300">Review what you missed, then play again. Trivia is meant to reinforce Scripture knowledge, not just reward speed.</p><button onClick={()=>{setIndex(0);setSelected(null);setScore(0);setDone(false)}} className="lfp-button mt-5 bg-white text-slate-950">Play again</button></div>;
 return <section className="rounded-[2rem] bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8"><div className="flex items-center justify-between gap-4"><p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">Question {index+1} of {safe.length}</p><p className="text-sm font-black text-slate-500">Score {score}</p></div><h2 className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{q.question}</h2><div className="mt-6 grid gap-3">{q.options.map((option,i)=>{const isAnswer=i===q.answer; const active=selected===i; let style="border-slate-200 bg-white hover:border-blue-300"; if(selected!==null&&isAnswer)style="border-emerald-300 bg-emerald-50"; else if(active&&!correct)style="border-rose-300 bg-rose-50"; return <button key={option} onClick={()=>choose(i)} className={`rounded-2xl border p-4 text-left font-bold text-slate-800 transition ${style}`}>{option}</button>})}</div>{selected!==null&&<div className={`mt-5 rounded-2xl p-4 ${correct?"bg-emerald-50 text-emerald-900":"bg-amber-50 text-amber-950"}`}><p className="font-black">{correct?"Correct":"Not quite"}</p>{q.explanation&&<p className="mt-1 leading-7">{q.explanation}</p>}{q.scripture&&<p className="mt-2 text-sm font-black">{q.scripture}</p>}<button onClick={next} className="lfp-button lfp-button-primary mt-4">{index===safe.length-1?"See results":"Next question"}</button></div>}</section>
}
