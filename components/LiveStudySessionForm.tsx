"use client";

import { useMemo, useState } from "react";
import { createLiveSession } from "@/app/admin/studies/actions";

type Study={id:string;title:string;ministry_slug:string|null};
type Person={id:string;full_name:string|null;email:string|null};
type Ministry={slug:string;title:string};
type Group={id:string;name:string;ministry_slug:string;memberIds:string[];facilitatorIds:string[]};

export default function LiveStudySessionForm({studies,facilitators,participants,ministries,groups}:{studies:Study[];facilitators:Person[];participants:Person[];ministries:Ministry[];groups:Group[]}){
 const[pending,setPending]=useState(false);const[message,setMessage]=useState<string|null>(null);const[selectedGroup,setSelectedGroup]=useState("");const[selectedMinistry,setSelectedMinistry]=useState("");const[checked,setChecked]=useState<Set<string>>(new Set());const[selectedFacilitator,setSelectedFacilitator]=useState("");
 const group=useMemo(()=>groups.find(g=>g.id===selectedGroup)||null,[groups,selectedGroup]);
 const visibleParticipants=useMemo(()=>group?participants.filter(p=>group.memberIds.includes(p.id)):participants,[group,participants]);
 const visibleFacilitators=useMemo(()=>group?facilitators.filter(p=>group.facilitatorIds.includes(p.id)):facilitators,[group,facilitators]);
 function chooseGroup(id:string){setSelectedGroup(id);const g=groups.find(x=>x.id===id);setChecked(new Set(g?.memberIds||[]));setSelectedFacilitator(g?.facilitatorIds?.[0]||"");setSelectedMinistry(g?.ministry_slug||"");}
 function toggle(id:string){setChecked(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n})}
 async function submit(formData:FormData){setPending(true);setMessage(null);try{const startLocal=String(formData.get("scheduled_start_local")||"");const endLocal=String(formData.get("scheduled_end_local")||"");if(!startLocal)throw new Error("Choose a start date and time.");formData.set("scheduled_start",new Date(startLocal).toISOString());if(endLocal)formData.set("scheduled_end",new Date(endLocal).toISOString());formData.delete("participant_user_id");checked.forEach(id=>formData.append("participant_user_id",id));await createLiveSession(formData);setMessage("Live study scheduled. Selected participants have been notified and will see it on My Path.");(document.getElementById("live-study-session-form") as HTMLFormElement|null)?.reset();setSelectedGroup("");setSelectedMinistry("");setSelectedFacilitator("");setChecked(new Set());}catch(error){setMessage(error instanceof Error?error.message:"Unable to schedule the live study.");}finally{setPending(false)}}
 return <form id="live-study-session-form" action={submit} className="lfp-card mt-6 grid gap-4 p-6 sm:grid-cols-2">
  <label className="text-sm font-bold sm:col-span-2">Bible study<select required name="bible_study_id" className="mt-1 w-full rounded-xl border p-3"><option value="">Choose a study</option>{studies.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
  <label className="text-sm font-bold">Study group<select name="group_id" value={selectedGroup} onChange={e=>chooseGroup(e.target.value)} className="mt-1 w-full rounded-xl border p-3"><option value="">No saved group</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Choosing a group preselects its active roster. Uncheck anyone who is not participating in this session.</span></label>
  <label className="text-sm font-bold">Ministry<select required name="ministry_slug" value={selectedMinistry} onChange={e=>setSelectedMinistry(e.target.value)} className="mt-1 w-full rounded-xl border p-3"><option value="">Choose ministry</option>{ministries.map(m=><option key={m.slug} value={m.slug}>{m.title}</option>)}</select></label>
  <label className="text-sm font-bold">Facilitator<select name="facilitator_user_id" value={selectedFacilitator} onChange={e=>setSelectedFacilitator(e.target.value)} className="mt-1 w-full rounded-xl border p-3"><option value="">Organizer only</option>{visibleFacilitators.map(p=><option key={p.id} value={p.id}>{p.full_name||p.email||"L&F member"}{p.email?` · ${p.email}`:""}</option>)}</select></label>
  <label className="text-sm font-bold">Starts<input required name="scheduled_start_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3"/></label>
  <label className="text-sm font-bold">Ends<input name="scheduled_end_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3"/></label>
  <fieldset className="sm:col-span-2"><legend className="text-sm font-black">Participants for this session</legend><p className="mt-1 text-xs text-slate-500">Only the final checked roster receives notifications, sees the meeting on My Path, receives Daily Path, and participates in answer sharing.</p><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-2xl border bg-white p-3 sm:grid-cols-2">{visibleParticipants.map(p=><label key={p.id} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-slate-50"><input type="checkbox" name="participant_user_id" value={p.id} checked={checked.has(p.id)} onChange={()=>toggle(p.id)}/><span><strong>{p.full_name||"L&F member"}</strong>{p.email&&<small className="block text-slate-500">{p.email}</small>}</span></label>)}{visibleParticipants.length===0&&<p className="p-3 text-sm font-bold text-slate-500">This group has no active members yet.</p>}</div></fieldset>
  {message&&<p className="rounded-xl bg-slate-50 p-3 text-sm font-bold sm:col-span-2">{message}</p>}
  <button disabled={pending||checked.size===0} className="lfp-button bg-slate-950 text-white sm:col-span-2 disabled:opacity-60">{pending?"Scheduling…":"Schedule & Notify Participants"}</button>
 </form>;
}
