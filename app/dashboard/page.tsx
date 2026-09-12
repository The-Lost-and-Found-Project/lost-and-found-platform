import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PushPrompt from "@/components/PushPrompt";
import { ministryPortals } from "@/lib/ministry-hub";

const quick=[
 {href:"/auth/emmaus?next=/study",icon:"▤",label:"Continue Emmaus",note:"Open Scripture without another login"},
 {href:"/memory",icon:"✦",label:"Review verses",note:"Strengthen what you are memorizing"},
 {href:"/trivia",icon:"?",label:"Daily challenge",note:"Play, learn, and dig deeper"},
 {href:"/prayer",icon:"♡",label:"Prayer",note:"Carry a need with the community"},
];

export default async function DashboardPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const now=new Date().toISOString();
 const [
  {data:profile},
  {data:memberships},
  {data:nextGathering},
  {data:latestContent},
  {data:progressRows},
  {count:memoryDue},
  {data:lastQuiz},
  {data:featuredDevotional}
 ]=await Promise.all([
  supabase.from("profiles").select("full_name").eq("id",user.id).single(),
  supabase.from("ministry_memberships").select("ministry_slug,membership_role").eq("user_id",user.id),
  supabase.from("ministry_content").select("id,ministry_slug,title,summary,starts_at,location").eq("is_published",true).eq("content_type","gathering").gte("starts_at",now).order("starts_at",{ascending:true}).limit(1).maybeSingle(),
  supabase.from("ministry_content").select("id,ministry_slug,title,summary,content_type,created_at").eq("is_published",true).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  supabase.from("content_progress").select("status,progress_percent,updated_at,content_catalog(title,slug,content_type,provenance)").eq("user_id",user.id).neq("status","completed").order("updated_at",{ascending:false}).limit(4),
  supabase.from("memory_verse_progress").select("verse_id",{count:"exact",head:true}).eq("user_id",user.id).lte("next_review_at",now),
  supabase.from("quiz_attempts").select("category,score,total_questions,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  supabase.from("content_catalog").select("slug,title,summary,duration_minutes").eq("is_published",true).eq("content_type","devotional").order("is_featured",{ascending:false}).order("published_at",{ascending:false}).limit(1).maybeSingle()
 ]);

 const firstName=profile?.full_name?.trim().split(" ")[0]||"friend";
 const followed=new Set((memberships??[]).map(m=>m.ministry_slug));
 const followedPortals=ministryPortals.filter(m=>followed.has(m.slug));
 const nextMinistry=nextGathering?ministryPortals.find(m=>m.slug===nextGathering.ministry_slug):null;
 const latestMinistry=latestContent?ministryPortals.find(m=>m.slug===latestContent.ministry_slug):null;
 const dueCount=memoryDue??0;

 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden">
   <div aria-hidden className="lfp-grid absolute inset-0"/>
   <div aria-hidden className="lfp-orb -right-24 -top-20 h-72 w-72 bg-blue-200/50"/>
   <div className="lfp-shell relative py-10 sm:py-14">
    <p className="lfp-eyebrow">My Path</p>
    <div className="mt-3 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
     <div><h1 className="text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Good to see you, {firstName}.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">One place to continue what you started, remember what matters, and take the next faithful step.</p></div>
     <div className="lfp-glass rounded-[1.7rem] p-5"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">Today</p><p className="mt-2 text-xl font-black text-slate-950">You don't have to do everything.</p><p className="mt-1 text-sm leading-6 text-slate-600">Open Scripture. Review a verse. Carry one need. Keep moving.</p></div>
    </div>
    <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{quick.map(q=><Link key={q.label} href={q.href} className="lfp-glass rounded-[1.4rem] p-4 transition hover:-translate-y-1"><span className="text-xl text-blue-700">{q.icon}</span><span className="mt-3 block font-black text-slate-950">{q.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{q.note}</span></Link>)}</div>
   </div>
  </section>

  <div className="lfp-shell pb-14">
   <PushPrompt/>

   <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <Link href="/auth/emmaus?next=/study" className="rounded-[1.7rem] bg-[rgb(var(--lfp-ink))] p-6 text-white shadow-xl transition hover:-translate-y-1"><p className="text-[11px] font-black uppercase tracking-[.16em] text-sky-300">Emmaus</p><h2 className="mt-2 text-2xl font-black">Return to the Word.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Your L&F identity carries you directly into Emmaus.</p><span className="mt-5 inline-flex font-black text-sky-300">Continue study →</span></Link>
    <Link href="/memory" className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-violet-700">Memory</p><h2 className="mt-2 text-2xl font-black text-slate-950">{dueCount} verse{dueCount===1?"":"s"} due</h2><p className="mt-2 text-sm leading-6 text-slate-600">Spaced review brings the right verses back before they fade.</p><span className="mt-5 inline-flex font-black text-blue-700">Review now →</span></Link>
    <Link href="/trivia" className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-amber-700">Learning Lab</p><h2 className="mt-2 text-2xl font-black text-slate-950">Daily Bible challenge</h2><p className="mt-2 text-sm leading-6 text-slate-600">{lastQuiz?`Last score: ${lastQuiz.score}/${lastQuiz.total_questions} in ${String(lastQuiz.category).replaceAll("-"," ")}.`:"Start your first challenge and build a learning rhythm."}</p><span className="mt-5 inline-flex font-black text-blue-700">Play →</span></Link>
    {featuredDevotional?<Link href={`/library/${featuredDevotional.slug}`} className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-emerald-700">Devotional</p><h2 className="mt-2 text-2xl font-black text-slate-950">{featuredDevotional.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{featuredDevotional.summary||"A short teaching rhythm for today."}</p><span className="mt-5 inline-flex font-black text-blue-700">Begin →</span></Link>:<Link href="/library#devotional" className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-emerald-700">Devotional</p><h2 className="mt-2 text-2xl font-black text-slate-950">Find today's teaching.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Open a short Scripture-centered devotional from the L&F Library.</p><span className="mt-5 inline-flex font-black text-blue-700">Browse devotions →</span></Link>}
   </section>

   {progressRows?.length?<section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">Continue</p><h2 className="mt-2 text-3xl font-black text-slate-950">Pick up where you left off.</h2></div><Link href="/library" className="font-black text-blue-700">Library →</Link></div><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{progressRows.map((row:any)=>{const content=Array.isArray(row.content_catalog)?row.content_catalog[0]:row.content_catalog;if(!content)return null;return <Link key={content.slug} href={`/library/${content.slug}`} className="lfp-card p-5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-blue-700">{content.content_type}</span><span className="text-xs font-black text-slate-400">{row.status}</span></div><h3 className="mt-3 text-lg font-black text-slate-950">{content.title}</h3><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.max(row.progress_percent||0,row.status==="started"?10:0)}%`}}/></div><p className="mt-2 text-xs font-bold text-slate-500">{row.progress_percent||0}% complete</p></Link>})}</div></section>:null}

   <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
    <div className="rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white shadow-2xl sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Up next</p>{nextGathering?<><h2 className="mt-3 text-3xl font-black">{nextGathering.title}</h2><p className="mt-3 font-bold text-slate-300">{nextMinistry?.title||"L&F"} · {new Date(nextGathering.starts_at).toLocaleString()}</p>{nextGathering.location&&<p className="mt-2 text-slate-400">{nextGathering.location}</p>}<Link href="/events" className="lfp-button mt-6 bg-white text-slate-950">View gathering →</Link></>:<><h2 className="mt-3 text-3xl font-black">Your path is active even when the calendar is quiet.</h2><p className="mt-3 leading-7 text-slate-300">Pray, study, remember Scripture, encourage someone, or discover something new today.</p><Link href="/discover" className="lfp-button mt-6 bg-white text-slate-950">Discover a next step →</Link></>}</div>
    <div className="lfp-card p-7 sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-blue-700">Fresh from L&F</p>{latestContent?<><h2 className="mt-3 text-2xl font-black text-slate-950">{latestContent.title}</h2><p className="mt-2 text-sm font-bold text-slate-500">{latestMinistry?.title||"Ministry"} · {latestContent.content_type}</p>{latestContent.summary&&<p className="mt-3 leading-7 text-slate-600">{latestContent.summary}</p>}<Link href={`/ministries/${latestContent.ministry_slug}`} className="mt-5 inline-flex font-black text-blue-700">Open →</Link></>:<><h2 className="mt-3 text-2xl font-black text-slate-950">Your discovery stream starts here.</h2><p className="mt-3 leading-7 text-slate-600">As ministries publish resources and gatherings, useful new things surface here automatically.</p><Link href="/discover" className="mt-5 inline-flex font-black text-blue-700">Explore →</Link></>}</div>
   </section>

   <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">My spaces</p><h2 className="mt-2 text-3xl font-black text-slate-950">Where you belong and grow</h2></div><Link href="/ministries" className="font-black text-blue-700">Manage →</Link></div><div className="mt-6 grid gap-4 md:grid-cols-3">{(followedPortals.length?followedPortals:ministryPortals).map(m=><Link key={m.slug} href={`/ministries/${m.slug}`} className="lfp-card p-6"><span className="text-2xl">{m.icon}</span><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-blue-700">{followed.has(m.slug)?"Your space":"Discover"}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{m.title}</h3><p className="mt-2 leading-7 text-slate-600">{m.description}</p></Link>)}</div></section>

   <section className="mt-12 rounded-[2rem] border border-emerald-100 bg-emerald-50/70 p-7 sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-emerald-700">Community rhythm</p><h2 className="mt-2 text-3xl font-black text-slate-950">Prayer can become praise. Praise can become testimony.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">L&F is being shaped around the whole story—not disconnected posts. Carry a need, return when something changes, celebrate God's faithfulness, and preserve the story for someone who needs hope later.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/prayer" className="lfp-button lfp-button-primary">Go to Prayer</Link><Link href="/community" className="lfp-button lfp-button-secondary">Community</Link></div></section>
  </div>
 </main>;
}
