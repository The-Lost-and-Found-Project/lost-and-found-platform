import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemoryVerseClient from "@/components/MemoryVerseClient";

export default async function MemoryPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const [{data:verses},{data:progress}]=await Promise.all([
  supabase.from("memory_verses").select("id,reference,verse_text,translation,topic,difficulty").eq("is_active",true).order("created_at"),
  supabase.from("memory_verse_progress").select("verse_id,mastery").eq("user_id",user.id)
 ]);
 const mastery=new Map((progress??[]).map(p=>[p.verse_id,p.mastery])); const rows=(verses??[]).map(v=>({...v,mastery:mastery.get(v.id)??0}));
 return <main className="lfp-page pb-24"><section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Member Learning Lab</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Put Scripture where you can <span className="lfp-gradient-text">carry it with you.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Memory Verse mode gradually removes support, then schedules review so verses move from recognition toward real recall.</p><div className="mt-7 flex flex-wrap gap-3"><a href="/learn" className="lfp-button lfp-button-secondary">← Learning Lab</a><a href="/trivia" className="lfp-button lfp-button-secondary">Bible Trivia</a></div></div></section><div className="lfp-shell py-8"><MemoryVerseClient userId={user.id} verses={rows}/></div></main>
}
