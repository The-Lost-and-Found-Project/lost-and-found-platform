"use client";

import { useEffect,useMemo,useState } from "react";
import { requestInitialLiveExtension } from "@/app/live/actions";

type Props={sessionId:string;startedAt:string|null;facilitator:boolean;initialMaxMinutes?:number};

export default function LfLiveTimingControl({sessionId,startedAt,facilitator,initialMaxMinutes=75}:Props){
 const[startMs]=useState(()=>startedAt?new Date(startedAt).getTime():Date.now());
 const[now,setNow]=useState(Date.now());
 const[maxMinutes,setMaxMinutes]=useState(initialMaxMinutes);
 const[reason,setReason]=useState("");
 const[open,setOpen]=useState(false);
 const[busy,setBusy]=useState(false);
 const[message,setMessage]=useState("");
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id)},[]);
 const elapsedMinutes=Math.max(0,(now-startMs)/60000);
 const remaining=Math.max(0,Math.ceil(maxMinutes-elapsedMinutes));
 const warning=useMemo(()=>elapsedMinutes>=70&&maxMinutes===75?"5 minutes left in the standard study window.":elapsedMinutes>=60&&maxMinutes===75?"15 minutes remain in the standard study window.":maxMinutes===90&&elapsedMinutes>=85?"The 90-minute extension is nearly complete.":"",[elapsedMinutes,maxMinutes]);
 if(!facilitator)return null;
 async function extend(){
  if(reason.trim().length<3){setMessage("Add a short reason for the extension.");return}
  setBusy(true);setMessage("");
  try{const result=await requestInitialLiveExtension(sessionId,reason);if(!result.ok){setMessage(result.message||"Unable to extend the study.");return}setMaxMinutes(90);setOpen(false);setMessage("Extended to 90 minutes. Your supervisor has been notified.");}
  catch{setMessage("Unable to extend the study right now.")}
  finally{setBusy(false)}
 }
 return <div className="fixed right-4 top-20 z-40 w-[min(22rem,calc(100vw-2rem))]">
  <div className="rounded-2xl border border-[#c8a96b]/30 bg-[#091625]/95 p-3 text-white shadow-2xl backdrop-blur">
   <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#d9bd7d]">Study timing</p><p className="mt-1 text-sm font-black">{remaining} min remaining · {maxMinutes} min window</p></div>{maxMinutes===75&&elapsedMinutes>=60&&<button onClick={()=>setOpen(v=>!v)} className="rounded-xl bg-[#d9bd7d] px-3 py-2 text-xs font-black text-[#07111f]">+15 min</button>}</div>
   {warning&&<p className="mt-2 rounded-xl bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200">{warning}</p>}
   {open&&<div className="mt-3 border-t border-white/10 pt-3"><label className="text-xs font-bold text-slate-300">Why does the group need 15 more minutes?</label><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 p-2 text-sm text-white outline-none focus:border-[#d9bd7d]" placeholder="Brief reason..."/><div className="mt-2 flex justify-end gap-2"><button onClick={()=>setOpen(false)} className="rounded-lg px-3 py-2 text-xs font-black text-slate-300">Cancel</button><button disabled={busy} onClick={extend} className="rounded-lg bg-[#d9bd7d] px-3 py-2 text-xs font-black text-[#07111f] disabled:opacity-50">{busy?"Extending...":"Extend to 90"}</button></div></div>}
   {message&&<p className="mt-2 text-xs font-bold text-slate-300">{message}</p>}
  </div>
 </div>;
}
