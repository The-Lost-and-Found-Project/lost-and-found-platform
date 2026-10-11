"use client";
import {useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Snapshot={index:number;completed:number[];missed:number[]};
const empty:Snapshot={index:0,completed:[],missed:[]};
const normalize=(input:Partial<Snapshot>|null,total:number):Snapshot=>{
 const valid=(items:unknown)=>Array.isArray(items)?Array.from(new Set(items.filter((n):n is number=>Number.isInteger(n)&&n>=0&&n<total))):[];
 return {index:Number.isInteger(input?.index)&&Number(input?.index)>=0&&Number(input?.index)<total?Number(input?.index):0,completed:valid(input?.completed),missed:valid(input?.missed)};
};
export function useLessonProgress(key:string,total:number){
 const [progress,setProgress]=useState<Snapshot>(empty);
 const [ready,setReady]=useState(false);
 const [syncStatus,setSyncStatus]=useState<"loading"|"saved"|"local"|"error">("loading");
 const userId=useRef<string|null>(null);
 const hydrated=useRef(false);
 const dirty=useRef(false);
 const current=useRef<Snapshot>(empty);
 const supabaseRef=useRef<ReturnType<typeof createClient>|null>(null);
 if(!supabaseRef.current)supabaseRef.current=createClient();
 const supabase=supabaseRef.current;
 useEffect(()=>{let cancelled=false;hydrated.current=false;dirty.current=false;setReady(false);
  const init=async()=>{
   let local=empty;
   try{const raw=window.localStorage.getItem("lfp-learning-v1:"+key);if(raw)local=normalize(JSON.parse(raw),total)}catch{}
   const {data:{user},error:authError}=await supabase.auth.getUser();
   if(cancelled)return;
   userId.current=authError?null:user?.id??null;
   let merged=local;
   if(userId.current){
    const {data,error}=await supabase.from("learning_lab_progress").select("lesson_index,completed,missed,updated_at").eq("user_id",userId.current).eq("collection_key",key).maybeSingle();
    if(cancelled)return;
    if(!error&&data){
     const remote=normalize({index:data.lesson_index,completed:data.completed,missed:data.missed},total);
     const completed=Array.from(new Set([...local.completed,...remote.completed]));
     const missed=Array.from(new Set([...local.missed,...remote.missed])).filter(n=>!completed.includes(n)||local.missed.includes(n)&&remote.missed.includes(n));
     merged={index:remote.index,completed,missed};
    }
    if(error)setSyncStatus("error");else setSyncStatus("saved");
   }else setSyncStatus("local");
   current.current=merged;setProgress(merged);hydrated.current=true;setReady(true);
   if(userId.current&&!cancelled){
    const {error}=await supabase.from("learning_lab_progress").upsert({user_id:userId.current,collection_key:key,lesson_index:merged.index,completed:merged.completed,missed:merged.missed,updated_at:new Date().toISOString()},{onConflict:"user_id,collection_key"});
    if(!cancelled&&error)setSyncStatus("error");
   }
  };void init();return()=>{cancelled=true};
 },[key,total,supabase]);
 useEffect(()=>{if(!ready||!hydrated.current)return;current.current=progress;
  try{window.localStorage.setItem("lfp-learning-v1:"+key,JSON.stringify(progress))}catch{}
  if(!dirty.current||!userId.current)return;
  const id=userId.current;const timeout=setTimeout(async()=>{
   const {error}=await supabase.from("learning_lab_progress").upsert({user_id:id,collection_key:key,lesson_index:progress.index,completed:progress.completed,missed:progress.missed,updated_at:new Date().toISOString()},{onConflict:"user_id,collection_key"});
   setSyncStatus(error?"error":"saved");
  },500);
  return()=>clearTimeout(timeout);
 },[key,progress,ready,supabase]);
 const change=(fn:(p:Snapshot)=>Snapshot)=>{dirty.current=true;setSyncStatus(userId.current?"loading":"local");setProgress(fn)};
 const record=(index:number,correct:boolean)=>change(p=>({...p,completed:Array.from(new Set([...p.completed,index])),missed:correct?p.missed.filter(n=>n!==index):Array.from(new Set([...p.missed,index]))}));
 const go=(index:number)=>change(p=>({...p,index:Math.min(Math.max(Math.trunc(index),0),total-1)}));
 const reset=()=>change(()=>empty);
 return {progress,ready,record,go,reset,syncStatus};
}
