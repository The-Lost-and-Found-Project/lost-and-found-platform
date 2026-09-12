import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const GIVE_URL="https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";
const groups=[
 {title:"My life with L&F",eyebrow:"Personal",items:[
  {href:"/profile",label:"Profile",description:"Your information and the story you choose to share.",icon:"◎"},
  {href:"/prayer/my-requests",label:"My Prayer Journey",description:"Revisit needs you shared and record what happened next.",icon:"♡"},
  {href:"/notifications",label:"Notifications",description:"Prayer activity, ministry updates, and important alerts.",icon:"♢"},
  {href:"/settings",label:"Preferences",description:"Choose privacy, communication, and notification settings.",icon:"⚙"},
 ]},
 {title:"Explore & participate",eyebrow:"Ministry",items:[
  {href:"/discover",label:"Discover",description:"Start with what you need and find a meaningful next step.",icon:"⌁"},
  {href:"/ministries",label:"Ministry Spaces",description:"Enter The Hearth, The Foundry, Men's Study, and future spaces.",icon:"◇"},
  {href:"/events",label:"Gatherings",description:"See what is coming up across the ministry family.",icon:"◫"},
  {href:"/community",label:"Community",description:"Prayer, praise, testimony, and encouragement together.",icon:"✦"},
 ]},
 {title:"The Lost & Found Project",eyebrow:"Mission & support",items:[
  {href:"/about",label:"About L&F",description:"Understand the mission, values, and direction.",icon:"▤"},
  {href:GIVE_URL,label:"Give",description:"Support the ministry through our no-platform-fee Zeffy giving page.",icon:"♡",external:true},
  {href:"/feedback",label:"Feedback",description:"Tell us what is working and what needs improvement.",icon:"□"},
  {href:"/account",label:"Account & Security",description:"Manage password, sign-in, and account access.",icon:"▣"},
 ]},
];

export default async function MorePage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("role,full_name").eq("id",user.id).single(); const displayName=profile?.full_name?.trim()||user.email?.split("@")[0]||"Member"; const first=displayName.split(" ")[0];
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-10 sm:py-14"><p className="lfp-eyebrow">Me</p><div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">{displayName}</h1><p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">Your account, ministry rhythm, activity, and ways to stay connected.</p></div><Link href="/profile" className="lfp-button lfp-button-secondary">Edit profile</Link></div><div className="mt-7 grid gap-3 sm:grid-cols-3"><Link href="/prayer/my-requests" className="lfp-glass rounded-[1.4rem] p-4"><span className="text-xl text-blue-700">♡</span><span className="ml-3 font-black text-slate-950">My prayers</span></Link><Link href="/notifications" className="lfp-glass rounded-[1.4rem] p-4"><span className="text-xl text-blue-700">♢</span><span className="ml-3 font-black text-slate-950">Notifications</span></Link><Link href="/discover" className="lfp-glass rounded-[1.4rem] p-4"><span className="text-xl text-blue-700">⌁</span><span className="ml-3 font-black text-slate-950">Discover</span></Link></div></div></section>
  <div className="lfp-shell py-8 sm:py-12"><p className="text-sm font-bold text-slate-500">Welcome back, {first}.</p><div className="mt-8 space-y-10">{groups.map(group=><section key={group.title}><p className="lfp-eyebrow">{group.eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{group.title}</h2><div className="mt-5 grid gap-3 md:grid-cols-2">{group.items.map(item=>{const cls="lfp-card group flex items-start gap-4 p-5"; const body=<><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700">{item.icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-lg font-black text-slate-950">{item.label}</span><span className="text-blue-700 transition group-hover:translate-x-1">→</span></span><span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span></span></>;return item.external?<a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>:<Link key={item.label} href={item.href} className={cls}>{body}</Link>})}</div></section>)}</div>
   {profile?.role==="admin"&&<section className="mt-10 rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white"><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Administration</p><div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><h2 className="text-2xl font-black">Administration Center</h2><p className="mt-2 leading-7 text-slate-300">Manage prayer requests, people, content, applications, and platform operations.</p></div><Link href="/admin" className="lfp-button bg-white text-slate-950">Open Admin</Link></div></section>}
  </div>
 </main>;
}
