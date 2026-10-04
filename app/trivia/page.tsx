import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TriviaClient from "@/components/TriviaClient";

type SearchParams={mode?:string;category?:string};
const NON_TRIVIA=new Set(["language-insights","bible-context","bible-geography","connections"]);
export default async function TriviaPage({searchParams}:{searchParams:Promise<SearchParams>}){
 const params=await searchParams; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login?next=%2Ftrivia");
 const [{data:profile},{data:categoryRows},{data:approvedRows},{data:attempts}]=await Promise.all([
  supabase.from("profiles").select("full_name").eq("id",user.id).single(),
  supabase.from("trivia_categories").select("id,name,description").eq("is_active",true).order("sort_order"),
  supabase.from("trivia_questions").select("category_id").eq("status","approved"),
  supabase.from("quiz_attempts").select("category,score,total_questions").eq("user_id",user.id)
 ]);
 const counts:Record<string,number>={};(approvedRows??[]).forEach(r=>counts[r.category_id]=(counts[r.category_id]??0)+1);
 const categories=(categoryRows??[]).filter(c=>!NON_TRIVIA.has(c.id)).map(c=>({...c,approvedCount:counts[c.id]??0}));
 const bestScores:Record<string,{score:number;totalQuestions:number}>={};(attempts??[]).forEach(a=>{const e=bestScores[a.category];if(!e||a.score>e.score)bestScores[a.category]={score:a.score,totalQuestions:a.total_questions}});
 const total=categories.reduce((s,c)=>s+c.approvedCount,0);const firstName=profile?.full_name?.trim().split(" ")[0]||"friend";
 const initialMode=params.mode==="daily"?"daily":params.category?"category":"browse";const requestedCategory=params.category&&categories.some(c=>c.id===params.category)?params.category:null;
 return <main className="lfp-page pb-24"><section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Learning Lab · Bible Trivia</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Build reliable <span className="lfp-gradient-text">Bible knowledge</span>, {firstName}.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Trivia has one job: help you learn biblical facts—people, events, books, places, sequence, relationships, and what Scripture explicitly records. Every answer still points back to its Scripture reference.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/learn" className="lfp-button lfp-button-secondary">← Learning Lab</Link><Link href="/trivia?mode=daily" className="lfp-button lfp-button-secondary">Daily Challenge</Link><Link href="/learn/language" className="lfp-button lfp-button-secondary">Language Insights</Link><Link href="/memory" className="lfp-button lfp-button-secondary">Memory Verses</Link></div><div className="mt-8 grid grid-cols-3 gap-3"><Stat value={String(categories.filter(c=>c.approvedCount>0).length)} label="Trivia categories"/><Stat value={String(total)} label="Source questions"/><Stat value={String(Object.keys(bestScores).length)} label="Attempted"/></div></div></section><div className="lfp-shell py-8"><section className="lfp-card p-5 sm:p-8"><div className="max-w-3xl"><p className="lfp-eyebrow">Knowledge practice</p><h2 className="mt-2 text-3xl font-black text-slate-950">Answer. Check Scripture. Learn the fact.</h2><p className="mt-3 leading-7 text-slate-600">The existing bank is being classified against the new curriculum standard. Context, geography, connections, and original-language material now belong to their own Labs rather than being presented as ordinary trivia.</p></div><TriviaClient userId={user.id} categories={categories} bestScores={bestScores} initialMode={initialMode} initialCategoryId={requestedCategory}/></section></div></main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="lfp-glass rounded-2xl p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>}