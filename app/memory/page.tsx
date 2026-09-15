import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemoryVerseClient from "@/components/MemoryVerseClient";

export default async function MemoryPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const [{data:verses},{data:progress}]=await Promise.all([
  supabase.from("memory_verses").select("id,reference,verse_text,translation,topic,difficulty").eq("is_active",true).order("created_at"),
  supabase.from("memory_verse_progress").select("verse_id,mastery,next_review_at,last_reviewed_at,correct_streak").eq("user_id",user.id)
 ]);
 const now=Date.now(); const byVerse=new Map((progress??[]).map(p=>[p.verse_id,p]));
 const rows=(verses??[]).map(v=>{const p=byVerse.get(v.id);return {...v,mastery:p?.mastery??0,next_review_at:p?.next_review_at??null,last_reviewed_at:p?.last_reviewed_at??null,correct_streak:p?.correct_streak??0,due:!p?.next_review_at||new Date(p.next_review_at).getTime()<=now}}).sort((a,b)=>Number(b.due)-Number(a.due)||a.mastery-b.mastery);
 const dueCount=rows.filter(v=>v.due).length; const mastered=rows.filter(v=>v.mastery>=5).length;
 return <main className="lfp-page pb-24"><section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Member Learning Lab</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Put Scripture where you can <span className="lfp-gradient-text">carry it with you.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Memory Verse mode gradually removes support, checks real recall, and schedules review so verses move from recognition toward durable memory.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/learn" className="lfp-button lfp-button-secondary">← Learning Lab</Link><Link href="/trivia" className="lfp-button lfp-button-secondary">Bible Trivia</Link></div><div className="mt-8 grid grid-cols-3 gap-3"><Stat value={String(rows.length)} label="Verse deck"/><Stat value={String(dueCount)} label="Due now"/><Stat value={String(mastered)} label="Mastered"/></div></div></section><div className="lfp-shell py-8"><MemoryVerseClient userId={user.id} verses={rows}/></div></main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="lfp-glass rounded-2xl p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>}
