"use client";

import { useState } from "react";

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
 const[testimonyStatus,setTestimonyStatus]=useState("pending");
 const[praiseStatus,setPraiseStatus]=useState("pending");
 const[testimonyQuery,setTestimonyQuery]=useState("");
 const[praiseQuery,setPraiseQuery]=useState("");

 const matchesSubmission=(item:Testimony|PraiseReport,status:string,query:string)=>{
  const matchesStatus=status==="all"||item.moderation_status===status;
  const search=query.trim().toLowerCase();
  const searchable=`${item.content_text} ${authorLabel(item.author,"is_anonymous" in item?item.is_anonymous:false)}`.toLowerCase();
  return matchesStatus&&(!search||searchable.includes(search));
 };
 const filteredTestimonies=testimonies.filter(item=>matchesSubmission(item,testimonyStatus,testimonyQuery));
 const filteredPraiseReports=praiseReports.filter(item=>matchesSubmission(item,praiseStatus,praiseQuery));

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
   <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="w-full min-w-0 sm:flex-1">
     <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-black text-gray-900">{author}</p>
      <span className={"rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider "+statusClasses(item.moderation_status)}>{item.moderation_status}</span>
     </div>
     <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.content_text}</p>
     <p className="mt-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
    </div>
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
     <button type="button" disabled={pending||item.moderation_status==="approved"} onClick={()=>moderate(contentType,item.id,"approved")} className="min-h-11 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800 disabled:opacity-40 sm:w-auto">Approve</button>
     <button type="button" disabled={pending||item.moderation_status==="denied"} onClick={()=>moderate(contentType,item.id,"denied")} className="min-h-11 w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-800 disabled:opacity-40 sm:w-auto">Deny</button>
     {confirming?<><button type="button" disabled={pending} onClick={()=>deleteContent(contentType,item.id)} className="min-h-11 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50 sm:w-auto">Delete</button><button type="button" onClick={()=>setConfirmingId(null)} className="min-h-11 w-full rounded-xl border px-3 py-2 text-xs font-black sm:w-auto">Cancel</button></>:contentType==="testimony"?<button type="button" aria-label={`Delete ${author}'s testimony`} onClick={()=>setConfirmingId(item.id)} className="min-h-11 w-full rounded-xl border px-3 py-2 text-xs font-black text-red-700 sm:w-auto">Remove</button>:<button type="button" aria-label={`Delete ${author}'s praise report`} onClick={()=>setConfirmingId(item.id)} className="min-h-11 rounded-xl border px-3 py-2 text-xs font-black text-red-700">Remove</button>}
    </div>
   </div>
  </article>;
 }

 return (
  <main className="mx-auto max-w-5xl px-4 py-10 pb-28 sm:px-6">
   <header>
    <p className="lfp-eyebrow">Community Moderation</p>
    <h1 className="mt-2 text-3xl font-black text-gray-900">Praise &amp; Testimony Review</h1>
    <p className="mt-3 max-w-3xl text-gray-600">Review new submissions first. Approved content is eligible for public Community projections; denied content stays preserved but unpublished.</p>
   </header>

   {error&&<p role="alert" aria-live="assertive" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

   <section className="mt-8" aria-labelledby="testimonies-heading">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div>
      <h2 id="testimonies-heading" className="text-xl font-black text-gray-900">Testimonies</h2>
      <p className="mt-1 text-sm text-slate-600">{testimonies.filter(x=>x.moderation_status==="pending").length} awaiting review · {testimonies.length} total</p>
     </div>
     <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(14rem,1fr)_12rem]">
      <label className="text-xs font-bold text-slate-700">Search testimonies
       <input value={testimonyQuery} onChange={e=>setTestimonyQuery(e.target.value)} placeholder="Text or author" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"/>
      </label>
      <label className="text-xs font-bold text-slate-700">Status
       <select aria-label="Filter testimonies by status" value={testimonyStatus} onChange={e=>setTestimonyStatus(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="pending">Pending review</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="all">All statuses</option>
       </select>
      </label>
     </div>
    </div>
    <p className="sr-only" role="status">Showing {filteredTestimonies.length} of {testimonies.length} testimonies.</p>
    <div className="mt-4 space-y-3">
     {filteredTestimonies.length?filteredTestimonies.map(x=>card("testimony",x)):<p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">{testimonies.length?"No testimonies match these filters.":"No testimonies have been submitted yet."}</p>}
    </div>
   </section>

   <section className="mt-10" aria-labelledby="praise-heading">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div>
      <h2 id="praise-heading" className="text-xl font-black text-gray-900">Praise Reports</h2>
      <p className="mt-1 text-sm text-slate-600">{praiseReports.filter(x=>x.moderation_status==="pending").length} awaiting review · {praiseReports.length} total</p>
     </div>
     <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(14rem,1fr)_12rem]">
      <label className="text-xs font-bold text-slate-700">Search praise reports
       <input value={praiseQuery} onChange={e=>setPraiseQuery(e.target.value)} placeholder="Text or author" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"/>
      </label>
      <label className="text-xs font-bold text-slate-700">Status
       <select aria-label="Filter praise reports by status" value={praiseStatus} onChange={e=>setPraiseStatus(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
        <option value="pending">Pending review</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="all">All statuses</option>
       </select>
      </label>
     </div>
    </div>
    <p className="sr-only" role="status">Showing {filteredPraiseReports.length} of {praiseReports.length} praise reports.</p>
    <div className="mt-4 space-y-3">
     {filteredPraiseReports.length?filteredPraiseReports.map(x=>card("praise",x)):<p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">{praiseReports.length?"No praise reports match these filters.":"No praise reports have been submitted yet."}</p>}
    </div>
   </section>
  </main>
 );
}
