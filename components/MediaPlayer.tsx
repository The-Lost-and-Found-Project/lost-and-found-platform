"use client";

import { useEffect, useRef, useState } from "react";

type MediaItem={title:string;url:string;source?:string;artwork?:string};

declare global { interface Window { __lfpPlayMedia?: (item:MediaItem)=>void } }

export default function MediaPlayer(){
 const [item,setItem]=useState<MediaItem|null>(null); const audioRef=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{window.__lfpPlayMedia=(next)=>{setItem(next);localStorage.setItem("lfp-media",JSON.stringify(next))}; const raw=localStorage.getItem("lfp-media"); if(raw){try{setItem(JSON.parse(raw))}catch{}} return()=>{delete window.__lfpPlayMedia}},[]);
 if(!item)return null;
 return <div className="fixed bottom-[5.2rem] left-3 right-3 z-[85] mx-auto max-w-2xl rounded-2xl border border-white/60 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">▶</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-xs text-slate-400">{item.source||"Watch & Listen"}</p></div><button aria-label="Close player" onClick={()=>{setItem(null);localStorage.removeItem("lfp-media")}} className="rounded-full px-3 py-2 text-slate-300 hover:bg-white/10">×</button></div><audio ref={audioRef} src={item.url} controls autoPlay className="mt-2 h-9 w-full"/></div>
}

export function MediaPlayButton({title,url,source}:{title:string;url:string;source?:string}){
 return <button onClick={()=>window.__lfpPlayMedia?.({title,url,source})} className="lfp-button lfp-button-primary">▶ Play in L&F</button>
}
