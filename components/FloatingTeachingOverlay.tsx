"use client";
import {useEffect,useRef,useState} from "react";

export type LiveOverlay={kind:"scripture"|"point"|"question"|"word";title:string;body:string}|null;
export default function FloatingTeachingOverlay({overlay,facilitator,onChange}:{overlay:LiveOverlay;facilitator:boolean;onChange:(value:LiveOverlay)=>void}){
 const [position,setPosition]=useState({x:16,y:16});
 const [expanded,setExpanded]=useState(true);
 const [draft,setDraft]=useState({kind:"scripture" as NonNullable<LiveOverlay>["kind"],title:"",body:""});
 const area=useRef<HTMLDivElement>(null);
 const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 useEffect(()=>{setPosition({x:16,y:16})},[overlay?.title]);
 function move(e:React.PointerEvent<HTMLDivElement>){
  if(!drag.current||!area.current)return;
  const bounds=area.current.getBoundingClientRect();
  const width=Math.min(440,bounds.width-24);
  setPosition({x:Math.max(0,Math.min(bounds.width-width,drag.current.left+e.clientX-drag.current.x)),y:Math.max(0,Math.min(bounds.height-75,drag.current.top+e.clientY-drag.current.y))});
 }
 return <section className="mt-3 rounded-2xl border border-amber-200/20 bg-[#101e30] p-3" aria-label="Teaching overlays">
  {facilitator&&<details className="mb-3 rounded-xl bg-white/5 p-3"><summary className="cursor-pointer text-sm font-semibold">Teaching overlay controls</summary>
   <div className="mt-3 grid gap-2 sm:grid-cols-2">
    <label className="text-xs">Content type<select className="mt-1 w-full rounded-lg bg-[#25384d] p-2 text-white" value={draft.kind} onChange={e=>setDraft({...draft,kind:e.target.value as NonNullable<LiveOverlay>["kind"]})}><option value="scripture">Scripture</option><option value="point">Teaching point</option><option value="question">Discussion question</option><option value="word">Word insight</option></select></label>
    <label className="text-xs">Title or Scripture reference<input className="mt-1 w-full rounded-lg bg-[#25384d] p-2 text-white" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} maxLength={120}/></label>
    <label className="text-xs sm:col-span-2">Content<textarea className="mt-1 w-full rounded-lg bg-[#25384d] p-2 text-white" rows={3} maxLength={1800} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/></label>
   </div>
   <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-lg bg-amber-200 px-4 py-2 font-semibold text-slate-950 disabled:opacity-40" disabled={!draft.body.trim()} onClick={()=>onChange({kind:draft.kind,title:draft.title.trim(),body:draft.body.trim()})}>Show to room</button><button className="rounded-lg border border-white/30 px-4 py-2" onClick={()=>onChange(null)}>Clear overlay</button></div>
  </details>}
  <div ref={area} className="relative min-h-56 overflow-hidden rounded-xl border border-white/10 bg-[#07111f] sm:min-h-64">
   <div className="p-4 text-sm text-slate-400">The video tiles remain visible above. Drag the teaching card within this overlay area; it does not replace the video feed.</div>
   {overlay&&<div className="absolute z-10 w-[min(440px,calc(100%-24px))] max-w-[calc(100%-24px)] rounded-xl border border-amber-200/40 bg-[#f6f0e4] text-slate-900 shadow-xl" style={{left:position.x,top:position.y}}>
    <div className="flex touch-none cursor-move items-center justify-between gap-2 rounded-t-xl bg-[#e9dfca] px-3 py-2" onPointerDown={e=>{if((e.target as HTMLElement).closest("button"))return;drag.current={x:e.clientX,y:e.clientY,left:position.x,top:position.y};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={move} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
     <strong className="text-xs uppercase tracking-wider">{overlay.kind} · {overlay.title}</strong><button className="rounded border border-slate-500/30 px-2 py-1 text-xs" onClick={()=>setExpanded(!expanded)} aria-label={expanded?"Collapse overlay":"Expand overlay"}>{expanded?"−":"+"}</button>
    </div>
    {expanded&&<p className="max-h-64 overflow-y-auto whitespace-pre-wrap p-4 text-base leading-relaxed">{overlay.body}</p>}
   </div>}
  </div>
  <p className="mt-2 text-xs text-slate-400">Each participant can move or collapse this card locally. Only the facilitator changes its content.</p>
 </section>;
}
