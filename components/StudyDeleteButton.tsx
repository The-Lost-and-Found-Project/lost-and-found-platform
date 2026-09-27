"use client";

import { useState, useTransition } from "react";
import { deleteStudy } from "@/app/admin/studies/actions";

export default function StudyDeleteButton({id,title}:{id:string;title:string}){
 const[pending,startTransition]=useTransition();const[message,setMessage]=useState<string|null>(null);
 function remove(){
  if(!window.confirm(`Delete "${title}"? This is only allowed when the study has no session history.`))return;
  const form=new FormData();form.set("id",id);setMessage(null);
  startTransition(async()=>{const result=await deleteStudy(form);if(!result?.ok)setMessage(result?.message||"The study could not be deleted.");});
 }
 return <div className="flex flex-col items-end gap-1"><button type="button" onClick={remove} disabled={pending} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">{pending?"Deleting…":"Delete"}</button>{message&&<p className="max-w-xs text-right text-xs font-bold text-rose-700" role="alert">{message}</p>}</div>;
}
