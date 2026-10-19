"use client";

import Link from "next/link";
import {useEffect} from "react";

export default function MeetingsError({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("Meetings workspace error",error);},[error]);
 return <main className="lfp-page min-h-screen pb-24"><div className="lfp-shell max-w-2xl py-12">
  <div role="alert" className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
   <p className="lfp-eyebrow">Meetings</p>
   <h1 className="mt-2 text-2xl font-black text-slate-950">We couldn't load this meeting page</h1>
   <p className="mt-3 text-slate-700">The meeting information may be temporarily unavailable. Try loading it again. If the problem continues, contact an administrator.</p>
   <div className="mt-6 flex flex-wrap gap-3">
    <button type="button" onClick={()=>reset()} className="lfp-button bg-indigo-700 text-white">Try again</button>
    <Link href="/admin/meetings" className="lfp-button border border-slate-300 bg-white text-slate-900">Back to Meetings</Link>
    <Link href="/admin" className="lfp-button border border-slate-300 bg-white text-slate-900">Admin home</Link>
   </div>
  </div>
 </div></main>;
}
