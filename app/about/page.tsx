import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const values=[
 {icon:"▤",title:"Rooted in Scripture",text:"Prayer, study, resources, and relationships should keep leading people back to God's Word."},
 {icon:"♡",title:"Centered on People",text:"Technology is useful only when it helps real people pray, grow, heal, serve, and belong."},
 {icon:"⌁",title:"Built Around Next Steps",text:"We would rather help someone take one faithful action than overwhelm them with a hundred options."},
 {icon:"◎",title:"Designed for Community",text:"Faith is personal, but not isolated. L&F should move people toward meaningful Christian relationships."},
];

export default async function AboutPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div aria-hidden className="lfp-orb -right-24 top-0 h-72 w-72 bg-blue-200/45"/><div className="lfp-shell relative py-12 sm:py-16"><p className="lfp-eyebrow">The Lost & Found Project</p><h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Helping people move from lost to <span className="lfp-gradient-text">found, known, and growing in Christ.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">A Christian nonprofit building practical pathways for prayer, Scripture, discipleship, stronger relationships, meaningful community, and service.</p></div></section>
  <div className="lfp-shell py-8 sm:py-12">
   <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-start"><div><p className="lfp-eyebrow">Why we exist</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Transformation over attention.</h2></div><div className="space-y-5 text-lg leading-8 text-slate-600"><p>We are building a place where people can bring honest prayer needs, discover Scripture more deeply, remember evidence of God's faithfulness, and connect with others who will walk beside them.</p><p>The goal is not to keep people inside an app. The goal is to help them live their faith more intentionally outside it.</p></div></section>
   <section className="mt-12 grid gap-4 md:grid-cols-2">{values.map(v=><article key={v.title} className="lfp-card p-6 sm:p-7"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700">{v.icon}</span><h3 className="mt-5 text-2xl font-black text-slate-950">{v.title}</h3><p className="mt-3 leading-7 text-slate-600">{v.text}</p></article>)}</section>
   <section className="mt-12 rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-10"><div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">One ecosystem</p><h2 className="mt-3 text-3xl font-black">Website, community, ministries, and Emmaus should feel like one ministry family.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">Different spaces can have distinct identities while sharing one mission, one account experience, and one clear path toward deeper faith and stronger relationships.</p></div><div className="flex flex-wrap gap-3"><Link href="/discover" className="lfp-button bg-white text-slate-950">Discover</Link><Link href="/ministries" className="lfp-button border border-white/15 bg-white/10 text-white">Ministries</Link></div></div></section>
  </div>
 </main>;
}
