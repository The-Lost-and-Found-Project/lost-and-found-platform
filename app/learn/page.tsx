import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LearnPage(){
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const [{count:questions},{count:verses},{count:language},{count:studies},{data:attempts}]=await Promise.all([
  supabase.from("trivia_questions").select("id",{count:"exact",head:true}).eq("status","approved"),
  supabase.from("memory_verses").select("id",{count:"exact",head:true}).eq("is_active",true),
  supabase.from("trivia_questions").select("id",{count:"exact",head:true}).eq("status","approved").eq("category_id","language-insights"),
  supabase.from("content_catalog").select("id",{count:"exact",head:true}).eq("is_published",true).eq("content_type","study"),
  supabase.from("quiz_attempts").select("category,score,total_questions").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
 ]);
 const played=(attempts??[]).length;
 const modes=[
  {href:"/trivia?mode=daily",icon:"✦",title:"Daily Challenge",eyebrow:"Come back daily",description:"Seven approved questions selected for a focused daily learning rhythm.",ready:(questions??0)>0,status:`${questions??0} approved questions available`},
  {href:"/trivia?mode=trivia",icon:"?",title:"Bible Trivia",eyebrow:"Play + learn",description:"Choose a category and difficulty, answer from Scripture, then learn from the After the Answer teaching note.",ready:(questions??0)>0,status:`${questions??0} approved questions`},
  {href:"/trivia?category=language-insights",icon:"α",title:"Language Insights",eyebrow:"Hebrew + Greek",description:"Practice responsible original-language observation where grammar and context determine semantic sense.",ready:(language??0)>0,status:`${language??0} contextual language exercises`},
  {href:"/memory",icon:"▤",title:"Memory Verses",eyebrow:"Remember",description:"Read, retrieve missing words, recall from memory, and return through spaced review as mastery grows.",ready:(verses??0)>0,status:`${verses??0} active WEB memory verses`},
  {href:"/library?type=study",icon:"◇",title:"L&F Studies",eyebrow:"Understand",description:"Move from quick learning into curated studies, application, discussion, journaling, and devotional follow-up.",ready:(studies??0)>0,status:`${studies??0} published studies`},
  {href:"/auth/emmaus?next=/study",icon:"→",title:"Emmaus",eyebrow:"Dig deeper",description:"Carry a question or Scripture insight into the full Emmaus study environment without another login.",ready:true,status:"Deeper study environment"}
 ];
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Member Learning Lab</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Play. Learn. Remember. <span className="lfp-gradient-text">Understand. Apply.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Learning Lab is active. Start with a question, move into Scripture and context, practice what should be remembered, and finish with a faithful next step.</p><div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-2xl"><Stat value={String(questions??0)} label="Approved questions"/><Stat value={String(verses??0)} label="Memory verses"/><Stat value={String(played)} label="Recent rounds"/></div></div></section>
  <div className="lfp-shell py-8">
   <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modes.map(m=><Link key={m.title} href={m.ready?m.href:"/learn"} aria-disabled={!m.ready} className={`lfp-card p-6 sm:p-7 ${m.ready?"":"pointer-events-none opacity-55"}`}><div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">{m.icon}</span><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.13em] ${m.ready?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{m.ready?"Active":"Preparing"}</span></div><p className="mt-5 text-[11px] font-black uppercase tracking-[.17em] text-blue-700">{m.eyebrow}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{m.title}</h2><p className="mt-3 leading-7 text-slate-600">{m.description}</p><p className="mt-4 text-xs font-bold text-slate-500">{m.status}</p><span className="mt-5 inline-flex font-black text-blue-700">{m.ready?"Open →":"Content coming soon"}</span></Link>)}</section>
   <section className="mt-8 rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Learning pathway</p><h2 className="mt-2 text-3xl font-black">Play → Learn → Remember → Understand → Apply</h2><div className="mt-6 grid gap-3 sm:grid-cols-5">{[["1","Play","Answer a focused question."],["2","Learn","Read the teaching note and Scripture reference."],["3","Remember","Practice truth worth carrying with you."],["4","Understand","Use L&F Studies or Emmaus for context and depth."],["5","Apply","Choose a prayer, practice, conversation, or next step."]].map(([n,t,c])=><div key={n} className="rounded-2xl bg-white/[.07] p-4"><span className="text-xs font-black text-sky-300">{n}</span><h3 className="mt-1 font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{c}</p></div>)}</div><p className="mt-5 max-w-3xl leading-7 text-slate-300">The destination is faithful living—not a leaderboard. Scores can show progress, but Scripture, context, memory, understanding, and application remain the point.</p></section>
  </div>
 </main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="lfp-glass rounded-2xl p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>}
