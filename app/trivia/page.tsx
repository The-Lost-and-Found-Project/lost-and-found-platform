import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TriviaClient from "@/components/TriviaClient";

export default async function TriviaPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const [{data:profile},{data:categoryRows},{data:approvedRows},{data:attempts}]=await Promise.all([
  supabase.from("profiles").select("full_name").eq("id",user.id).single(),
  supabase.from("trivia_categories").select("id,name,description").eq("is_active",true).order("sort_order"),
  supabase.from("trivia_questions").select("category_id").eq("status","approved"),
  supabase.from("quiz_attempts").select("category,score,total_questions").eq("user_id",user.id)
 ]);
 const counts:Record<string,number>={}; (approvedRows??[]).forEach(r=>counts[r.category_id]=(counts[r.category_id]??0)+1);
 const categories=(categoryRows??[]).map(c=>({...c,approvedCount:counts[c.id]??0}));
 const bestScores:Record<string,{score:number;totalQuestions:number}>={}; (attempts??[]).forEach(a=>{const e=bestScores[a.category];if(!e||a.score>e.score)bestScores[a.category]={score:a.score,totalQuestions:a.total_questions}});
 const total=categories.reduce((s,c)=>s+c.approvedCount,0); const firstName=profile?.full_name?.trim().split(" ")[0]||"friend";
 return <main className="lfp-page pb-24"><section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Member Learning Lab</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Bible Trivia that helps you <span className="lfp-gradient-text">learn the Word</span>, {firstName}.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Questions are drawn from the approved L&F bank. Every answer points back to Scripture and includes a teaching insight—not just a score.</p><div className="mt-7 flex flex-wrap gap-3"><a href="/learn" className="lfp-button lfp-button-secondary">← Learning Lab</a><a href="/memory" className="lfp-button lfp-button-secondary">Memory Verses</a></div><div className="mt-8 grid grid-cols-3 gap-3"><Stat value={String(categories.filter(c=>c.approvedCount>0).length)} label="Categories"/><Stat value={String(total)} label="Questions"/><Stat value={String(Object.keys(bestScores).length)} label="Attempted"/></div></div></section><div className="lfp-shell py-8"><section className="lfp-card p-5 sm:p-8"><div className="max-w-3xl"><p className="lfp-eyebrow">Choose a challenge</p><h2 className="mt-2 text-3xl font-black text-slate-950">Play. Learn. Dig deeper.</h2><p className="mt-3 leading-7 text-slate-600">Language Insights now appears as its own category alongside the existing trivia library. Missed questions become learning moments, not failures.</p></div><TriviaClient userId={user.id} categories={categories} bestScores={bestScores}/></section></div></main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="lfp-glass rounded-2xl p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>}
