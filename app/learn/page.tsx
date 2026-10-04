import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const labs=[
 {href:"/trivia",icon:"?",title:"Bible Trivia",learn:"Biblical facts",description:"Build reliable knowledge of people, events, books, places, sequence, relationships, and what Scripture explicitly records.",active:true},
 {href:"/learn/language",icon:"α",title:"Language Insights",learn:"Biblical words",description:"Start in a passage, notice worthwhile Hebrew or Greek words and phrases, then learn what they mean in their sentence and context.",active:true},
 {href:"/learn/context",icon:"◎",title:"Context Lab",learn:"The world behind the text",description:"Learn culture, customs, history, audience, genre, and circumstances that clarify what a passage communicates.",active:true},
 {href:"/learn/geography",icon:"⌖",title:"Bible Geography",learn:"Where Scripture happened",description:"Learn locations, regions, journeys, distances, and why the land can matter to the story.",active:false},
 {href:"/learn/connections",icon:"↔",title:"Connections",learn:"How Scripture connects",description:"Trace quotations, allusions, recurring patterns, and responsible Old and New Testament connections.",active:true},
 {href:"/learn/people",icon:"◉",title:"People",learn:"Who's who",description:"Learn identities, relationships, roles, and where people appear across the biblical story.",active:false},
 {href:"/learn/timeline",icon:"⌁",title:"Timeline",learn:"When things happened",description:"Place major people, kingdoms, events, exiles, ministries, and writings in biblical sequence.",active:false},
 {href:"/learn/books",icon:"▥",title:"Bible Books",learn:"The structure of Scripture",description:"Learn each book's identity, place in the canon, genre, audience, major movements, and relationship to the larger story.",active:false},
 {href:"/learn/observation",icon:"◇",title:"Observation",learn:"What to notice",description:"Practice seeing repeated words, contrasts, commands, questions, structure, transitions, and other clues already in the text.",active:false},
 {href:"/learn/study-skills",icon:"→",title:"Study Skills",learn:"How to investigate Scripture",description:"Practice responsible habits that move from observation to context, interpretation, connections, and faithful application.",active:false},
];

export default async function LearnPage(){
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=%2Flearn");
 const [{count:questions},{count:verses},{count:language},{data:attempts}]=await Promise.all([
  supabase.from("trivia_questions").select("id",{count:"exact",head:true}).eq("status","approved"),
  supabase.from("memory_verses").select("id",{count:"exact",head:true}).eq("is_active",true),
  supabase.from("trivia_questions").select("id",{count:"exact",head:true}).eq("status","approved").eq("category_id","language-insights"),
  supabase.from("quiz_attempts").select("category").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
 ]);
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Member Learning Lab</p><h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Build the skills to <span className="lfp-gradient-text">know Scripture better.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Each Lab has one job. Read Scripture, discover something worth noticing, learn it in context, practice the skill, and remember what matters. Emmaus remains the deeper investigation environment.</p><div className="mt-8 grid grid-cols-3 gap-3 sm:max-w-2xl"><Stat value={String(questions??0)} label="Source questions"/><Stat value={String(verses??0)} label="Memory verses"/><Stat value={String((attempts??[]).length)} label="Recent rounds"/></div></div></section>
  <div className="lfp-shell py-8">
   <section className="mb-8 rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Learning pathway</p><h2 className="mt-2 text-3xl font-black">Read → Discover → Learn → Practice → Remember</h2><p className="mt-4 max-w-3xl leading-7 text-slate-300">The Labs are not smaller versions of Emmaus. They are focused training environments. Every mode should be able to answer one question clearly: <strong className="text-white">What am I learning here?</strong></p></section>
   <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{labs.map(l=><Link key={l.title} href={l.active?l.href:"/learn"} aria-disabled={!l.active} className={`lfp-card p-6 sm:p-7 ${l.active?"":"pointer-events-none opacity-65"}`}><div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700">{l.icon}</span><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[.13em] ${l.active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{l.active?"Active":"Rebuilding"}</span></div><p className="mt-5 text-[11px] font-black uppercase tracking-[.17em] text-blue-700">Learn {l.learn}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{l.title}</h2><p className="mt-3 leading-7 text-slate-600">{l.description}</p><span className="mt-5 inline-flex font-black text-blue-700">{l.active?"Open Lab →":"Curriculum being classified"}</span></Link>)}</section>
   <section className="mt-8 grid gap-4 md:grid-cols-3"><Link href="/memory" className="lfp-card p-6"><p className="lfp-eyebrow">Remember</p><h2 className="mt-2 text-2xl font-black">Memory Verses</h2><p className="mt-3 leading-7 text-slate-600">Use retrieval and spaced review to carry Scripture with you.</p></Link><Link href="/library?type=study" className="lfp-card p-6"><p className="lfp-eyebrow">Go further</p><h2 className="mt-2 text-2xl font-black">L&F Studies</h2><p className="mt-3 leading-7 text-slate-600">Move into curated teaching, discussion, journaling, and application.</p></Link><Link href="/auth/emmaus?next=/study" className="lfp-card p-6"><p className="lfp-eyebrow">Investigate</p><h2 className="mt-2 text-2xl font-black">Emmaus</h2><p className="mt-3 leading-7 text-slate-600">Take a passage or question into the full study environment.</p></Link></section>
   <p className="mt-6 text-sm leading-6 text-slate-500">{language??0} existing language exercises are being used as source material for the passage-first Language Insights rebuild. Existing quiz history is preserved.</p>
  </div>
 </main>
}
function Stat({value,label}:{value:string;label:string}){return <div className="lfp-glass rounded-2xl p-4"><p className="text-2xl font-black text-slate-950">{value}</p><p className="text-xs font-bold text-slate-500">{label}</p></div>}