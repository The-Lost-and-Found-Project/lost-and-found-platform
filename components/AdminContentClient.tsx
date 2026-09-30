"use client";

import { useState } from "react";
import Link from "next/link";

type Author={full_name:string|null;email:string|null}|null;
type ModerationStatus="pending"|"approved"|"denied"|string;

type Testimony={id:string;content_text:string;is_anonymous:boolean;user_id:string;created_at:string;moderation_status:ModerationStatus;author:Author};
type PraiseReport={id:string;content_text:string;user_id:string;prayer_request_id:string|null;created_at:string;moderation_status:ModerationStatus;author:Author};
type Props={testimonies:Testimony[];praiseReports:PraiseReport[]};

function authorLabel(author:Author,isAnonymous?:boolean){if(isAnonymous)return"Anonymous";return author?.full_name||author?.email||"Unknown member";}
function statusClasses(status:string){return status==="approved"?"bg-emerald-50 text-emerald-800":status==="denied"?"bg-rose-50 text-rose-800":"bg-amber-50 text-amber-900";}

export default function AdminContentClient({testimonies:initialTestimonies,praiseReports:initialPraiseReports}:Props){
 const[testimonies,setTestimonies]=useState(initialTestimonies);
 const[praiseReports,setPraiseReports]=useState(initialPraiseReports);
 const[confirmingId,setConfirmingId]=useState<string|null>(null);
 const[pendingId,setPendingId]=useState<string|null>(null);
 const[error,setError]=useState("");

 async function moderate(contentType:"testimony"|"praise",contentId:string,moderationStatus:"approved"|"denied"){
  setError("");setPendingId(contentId);
  try{
   const res=await fetch("/api/admin/community-content/moderate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contentType,contentId,moderationStatus})});
   const body=await res.json().catch(()=>({}));
   if(!res.ok){setError(body?.error??"Failed to update moderation status");return;}
   if(contentType==="testimony")setTestimonies(prev=>prev.map(x=>x.id===contentId?{...x,moderation_status:moderationStatus}:x));
   else setPraiseReports(prev=>prev.map(x=>x.id===contentId?{...x,moderation_status:moderationStatus}:x));
  }catch{setError("Failed to update moderation status");}
  finally{setPendingId(null);}
 }

 async function deleteContent(contentType:"testimony"|"praise",id:string){
  setError("");setPendingId(id);
  const endpoint=contentType==="testimony"?"/api/admin/testimonies/delete":"/api/admin/praise-reports/delete";
  const payload=contentType==="testimony"?{testimonyId:id}:{praiseReportId:id};
  try{
   const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const body=await res.json().catch(()=>({}));
   if(!res.ok){setError(body?.error??"Failed to delete content");return;}
   if(contentType==="testimony")setTestimonies(prev=>prev.filter(x=>x.id!==id));
   else setPraiseReports(prev=>prev.filter(x=>x.id!==id));
  }catch{setError("Failed to delete content");}
  finally{setPendingId(null);setConfirmingId(null);}
 }

 function card(contentType:"testimony"|"praise",item:Testimony|PraiseReport){
  const isTestimony=contentType==="testimony";
  const author=authorLabel(item.author,isTestimony?(item as Testimony).is_anonymous:false);
  const pending=pendingId===item.id;
  const confirming=confirmingId===item.id;
  return <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
   <div className="flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
     <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-black text-gray-900">{author}</p>
      <span className={"rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider "+statusClasses(item.moderation_status)}>{item.moderation_status}</span>
     </div>
     <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.content_text}</p>
     <p className="mt-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
    </div>
    <div className="flex flex-wrap justify-end gap-2">
     <button type="button" disabled={pending||item.moderation_status==="approved"} onClick={()=>moderate(contentType,item.id,"approved")} className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40">Approve</button>
     <button type="button" disabled={pending||item.moderation_status==="denied"} onClick={()=>moderate(contentType,item.id,"denied")} className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 disabled:opacity-40">Deny</button>
     {confirming?<><button type="button" disabled={pending} onClick={()=>deleteContent(contentType,item.id)} className="min-h-11 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Delete</button><button type="button" onClick={()=>setConfirmingId(null)} className="min-h-11 rounded-xl border px-3 py-2 text-xs font-black">Cancel</button></>:contentType==="testimony"?<button type="button" aria-label={`Delete ${author}'s testimony`} onClick={()=>setConfirmingId(item.id)} className="min-h-11 rounded-xl border px-3 py-2 text-xs font-black text-red-700">Remove</button>:<button type="button" aria-label={`Delete ${author}'s praise report`} onClick={()=>setConfirmingId(item.id)} className="min-h-11 rounded-xl border px-3 py-2 text-xs font-black text-red-700">Remove</button>}
    </div>
   </div>
  </article>;
 }

 return <div className="mx-auto max-w-5xl px-4 py-10 pb-28 sm:px-6">
  <div className="flex items-center justify-between gap-4"><div><p className="lfp-eyebrow">Community Moderation</p><h1 className="mt-2 text-3xl font-black text-gray-900">Praise & Testimony Review</h1></div><Link href="/admin" className="inline-flex min-h-11 items-center text-sm font-black text-indigo-700">← Admin Center</Link></div>
  <p className="mt-3 max-w-3xl text-gray-600">Approve, deny, or remove member submissions. Approved content is eligible for the public Community projections; denied content remains preserved but unpublished.</p>
  {error&&<p role="alert" aria-live="assertive" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
  <section className="mt-8"><h2 className="text-xl font-black text-gray-900">Testimonies ({testimonies.length})</h2><div className="mt-4 space-y-3">{testimonies.length?testimonies.map(x=>card("testimony",x)):<p className="text-sm text-gray-500">No testimonies yet.</p>}</div></section>
  <section className="mt-10"><h2 className="text-xl font-black text-gray-900">Praise Reports ({praiseReports.length})</h2><div className="mt-4 space-y-3">{praiseReports.length?praiseReports.map(x=>card("praise",x)):<p className="text-sm text-gray-500">No praise reports yet.</p>}</div></section>
 </div>;
}
