import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import { ministryPortals } from "@/lib/ministry-hub";

const communityActions=[{href:"/prayer",icon:"♡",title:"Prayer",description:"Share a need or pray with someone today."},{href:"/praise",icon:"✦",title:"Praise",description:"Celebrate God's faithfulness with the community."},{href:"/testimonies",icon:"◎",title:"Testimonies",description:"Read and share stories that point people toward hope."}];

export default async function DashboardPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const now=new Date().toISOString();
 const [{data:profile},{data:memberships},{data:nextGathering},{data:latestContent}]=await Promise.all([
  supabase.from("profiles").select("full_name").eq("id",user.id).single(),
  supabase.from("ministry_memberships").select("ministry_slug,membership_role").eq("user_id",user.id),
  supabase.from("ministry_content").select("id,ministry_slug,title,summary,starts_at,location").eq("is_published",true).eq("content_type","gathering").gte("starts_at",now).order("starts_at",{ascending:true}).limit(1).maybeSingle(),
  supabase.from("ministry_content").select("id,ministry_slug,title,summary,content_type,created_at").eq("is_published",true).order("created_at",{ascending:false}).limit(1).maybeSingle()
 ]);
 const firstName=profile?.full_name?.trim().split(" ")[0]||"friend"; const followed=new Set((memberships??[]).map(m=>m.ministry_slug)); const followedPortals=ministryPortals.filter(m=>followed.has(m.slug));
 const nextMinistry=nextGathering?ministryPortals.find(m=>m.slug===nextGathering.ministry_slug):null; const latestMinistry=latestContent?ministryPortals.find(m=>m.slug===latestContent.ministry_slug):null;
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden bg-slate-950 text-white"><div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]"/><div className="lfp-shell relative py-14 sm:py-20"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p><h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Welcome, {firstName}. What's your next faithful step?</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Your L&F home now brings together the ministries you follow, the next gathering, fresh ministry content, prayer, praise, and testimony.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/ministries" className="lfp-button bg-amber-300 text-slate-950">Explore Ministries</Link><ShareButton/></div></div></section>
  <div className="lfp-shell pt-8 sm:pt-12"><PushPrompt/>
   <section><p className="lfp-eyebrow">Your Next Step</p><div className="mt-4 grid gap-5 lg:grid-cols-2">
    <div className="lfp-card p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-indigo-700">Next Gathering</p>{nextGathering?<><h2 className="mt-2 text-2xl font-black">{nextGathering.title}</h2><p className="mt-2 text-sm font-bold text-slate-500">{nextMinistry?.title||"L&F"} · {new Date(nextGathering.starts_at).toLocaleString()}</p>{nextGathering.location&&<p className="mt-2 text-slate-600">{nextGathering.location}</p>}<Link href="/events" className="mt-5 inline-flex font-black text-indigo-700">View gathering →</Link></>:<><h2 className="mt-2 text-2xl font-black">Stay connected between gatherings.</h2><p className="mt-3 text-slate-600">No upcoming ministry gathering is published yet. Prayer, praise, and ministry resources remain available now.</p><Link href="/prayer" className="mt-5 inline-flex font-black text-indigo-700">Go to Prayer →</Link></>}</div>
    <div className="lfp-card p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-indigo-700">Fresh from L&F</p>{latestContent?<><h2 className="mt-2 text-2xl font-black">{latestContent.title}</h2><p className="mt-2 text-sm font-bold text-slate-500">{latestMinistry?.title||"Ministry"} · {latestContent.content_type}</p>{latestContent.summary&&<p className="mt-3 leading-7 text-slate-600">{latestContent.summary}</p>}<Link href={`/ministries/${latestContent.ministry_slug}`} className="mt-5 inline-flex font-black text-indigo-700">Open ministry →</Link></>:<><h2 className="mt-2 text-2xl font-black">Choose where you want to grow.</h2><p className="mt-3 text-slate-600">Follow a ministry and its published content will become part of your L&F rhythm.</p><Link href="/ministries" className="mt-5 inline-flex font-black text-indigo-700">Choose a ministry →</Link></>}</div>
   </div></section>
   <section className="mt-14"><p className="lfp-eyebrow">My Ministries</p><div className="mt-2 flex items-end justify-between gap-4"><h2 className="text-3xl font-black">Your ministry home</h2><Link href="/ministries" className="font-black text-indigo-700">Manage ministries →</Link></div><div className="mt-7 grid gap-5 md:grid-cols-3">{(followedPortals.length?followedPortals:ministryPortals).map(m=><Link key={m.slug} href={`/ministries/${m.slug}`} className="lfp-card p-6"><span className="text-2xl">{m.icon}</span><p className="mt-4 text-xs font-black uppercase tracking-[.16em] text-indigo-700">{followed.has(m.slug)?"Following":"Discover"}</p><h3 className="mt-2 text-2xl font-black">{m.title}</h3><p className="mt-2 leading-7 text-slate-600">{m.description}</p></Link>)}</div></section>
   <section className="mt-14"><p className="lfp-eyebrow">Community Today</p><h2 className="mt-2 text-3xl font-black">Pray. Celebrate. Tell the story.</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{communityActions.map(a=><Link key={a.href} href={a.href} className="lfp-card p-6"><span className="text-2xl text-indigo-700">{a.icon}</span><h3 className="mt-4 text-xl font-black">{a.title}</h3><p className="mt-2 leading-7 text-slate-600">{a.description}</p></Link>)}</div></section>
  </div>
 </main>;
}
