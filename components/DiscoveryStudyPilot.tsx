"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import {JAMES_DISCOVERY_CARDS} from "@/lib/studies/discovery-pilot";

type Props={mode:"facilitator"|"projector";leaderNotes?:Readonly<Record<string,string>>;initialPhase?:number};
const CHANNEL="lnf:discovery-pilot:james-002";
const clamp=(i:number)=>Math.max(0,Math.min(JAMES_DISCOVERY_CARDS.length-1,i));
const bibleHref="https://emmaus.lostandfoundproject.org/study/bible?book=James&chapter=1&verse=5&endVerse=8&intent=study";

export default function DiscoveryStudyPilot({mode,leaderNotes,initialPhase=0}:Props){
 const facilitator=mode==="facilitator";
 const [index,setIndex]=useState(()=>clamp(initialPhase));
 const [hold,setHold]=useState(false);
 const [connected,setConnected]=useState(false);
 const channel=useRef<BroadcastChannel|null>(null);
 const indexRef=useRef(index);
 const phase=JAMES_DISCOVERY_CARDS[index];
 const advance=useCallback((delta:number)=>{if(!hold)setIndex(i=>clamp(i+delta));},[hold]);

 useEffect(()=>{
  if(typeof BroadcastChannel==="undefined")return;
  const bus=new BroadcastChannel(CHANNEL);channel.current=bus;setConnected(true);
  bus.onmessage=(event:MessageEvent<{type?:string;phase?:number}>)=>{
   const msg=event.data;
   if(!msg||typeof msg!=="object")return;
   if(!facilitator&&msg.type==="phase"&&Number.isInteger(msg.phase))setIndex(clamp(msg.phase!));
   if(facilitator&&msg.type==="request")bus.postMessage({type:"phase",phase:indexRef.current});
  };
  if(!facilitator)bus.postMessage({type:"request"});
  return()=>{bus.close();channel.current=null};
 // Initial sync only; facilitator phase updates are sent below.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[facilitator]);
 useEffect(()=>{indexRef.current=index;if(facilitator)channel.current?.postMessage({type:"phase",phase:index});},[facilitator,index]);

 useEffect(()=>{
  if(!facilitator)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.altKey||event.ctrlKey||event.metaKey)return;
   const el=event.target as HTMLElement|null;
   if(el?.closest("input,textarea,select,[contenteditable=true]"))return;
   if(event.key==="ArrowRight"||event.key==="PageDown"){event.preventDefault();advance(1);}
   if(event.key==="ArrowLeft"||event.key==="PageUp"){event.preventDefault();advance(-1);}
  };
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[facilitator,advance]);

 const projectorUrl=`/studies/discovery-pilot/projector?phase=${index+1}`;
 return <main className="min-h-screen bg-[#F5F7F4] text-slate-900">
  <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-10">
   <div><p className="text-xs font-black uppercase tracking-[.18em] text-teal-800">The Lost &amp; Found Project · Faith That Shows Up</p><h1 className="mt-2 text-xl font-bold sm:text-2xl">Where Do I Find Wisdom?</h1><p className="mt-1 text-sm text-slate-600">James 1:5–8 · Discussion-first pilot</p></div>
   <span className="rounded-full border border-teal-300 px-4 py-2 text-xs font-bold uppercase tracking-wider">{facilitator?"Facilitator":"Group screen"}</span>
  </header>
  <div className={facilitator?"mx-auto grid max-w-[1600px] gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-7":"mx-auto max-w-[1500px] p-4 sm:p-8"}>
   <section aria-live="polite" aria-label="Current group discussion prompt" className="flex min-h-[65vh] flex-col rounded-3xl border border-slate-200 bg-white px-7 py-9 shadow-sm sm:px-14 sm:py-12">
    <div className="flex flex-wrap justify-between gap-3 text-sm font-semibold text-slate-500"><span>DISCOVERY {index+1} / {JAMES_DISCOVERY_CARDS.length}</span><span>{phase.minutes} minutes suggested</span></div>
    <div className="my-auto py-12">
     <p className="text-base font-black uppercase tracking-[.16em] text-teal-700">{phase.phase}</p>
     <h2 className="mt-6 max-w-[1050px] text-[clamp(2.25rem,5vw,5.3rem)] font-extrabold leading-[1.08] tracking-tight">{phase.question}</h2>
     <p className="mt-8 max-w-[950px] text-[clamp(1.1rem,2vw,1.7rem)] leading-relaxed text-slate-600">{phase.detail}</p>
     {phase.passage&&<a href={bibleHref} target="_blank" rel="noopener noreferrer" className="mt-7 inline-block rounded-xl border border-teal-700 px-5 py-3 font-semibold text-teal-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-teal-500">Open James 1:5–8 in Emmaus</a>}
    </div>
    <p className="text-xs font-medium text-slate-500">Scripture first · Everyone may participate · Sharing is optional</p>
   </section>
   {facilitator&&<aside className="rounded-3xl border border-teal-100 bg-[#E7F1EB] p-6" aria-label="Private facilitator guidance">
    <h3 className="font-bold text-teal-950">Facilitator notes</h3>
    <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-800">{leaderNotes?.[phase.id]??"Open your facilitator playbook for additional guidance."}</p>
    <div className="mt-7 flex flex-col gap-3"><a href={projectorUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-900 underline underline-offset-4">Open group screen in another tab</a><a href={bibleHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-900 underline underline-offset-4">Open the Scripture passage</a></div>
    <p className="mt-8 text-xs leading-5 text-slate-600">The group screen never receives these notes. Same-browser tabs may synchronize phase numbers only; different devices do not synchronize yet. No answers, testimonies or prayer requests are collected.</p>
   </aside>}
  </div>
  {facilitator&&<nav aria-label="Facilitator presentation controls" className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 shadow-sm sm:px-10">
   <div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setIndex(0)} disabled={index===0} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold disabled:opacity-40">First</button><button type="button" onClick={()=>advance(-1)} disabled={index===0||hold} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold disabled:opacity-40">Previous</button><button type="button" aria-pressed={hold} onClick={()=>setHold(v=>!v)} className="rounded-xl border border-teal-700 px-4 py-3 font-semibold text-teal-900">{hold?"Resume navigation":"Hold discussion"}</button><button type="button" onClick={()=>advance(1)} disabled={index===JAMES_DISCOVERY_CARDS.length-1||hold} className="rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white disabled:opacity-40">Next</button></div>
   <p className="text-xs text-slate-500">{connected?"Same-browser phase channel active":"Use projector link to open at current phase"} · No automatic progression</p>
  </nav>}
 </main>;
}
