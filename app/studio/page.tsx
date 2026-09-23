import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const sections=[
 {href:"/admin",eyebrow:"People & Care",title:"Administration",copy:"Existing member, prayer, moderation, and ministry administration."},
 {href:"/studies",eyebrow:"Scripture",title:"Studies",copy:"Bible studies and discipleship remain the first content priority."},
 {href:"/ministries",eyebrow:"Ministry",title:"Ministries",copy:"Manage the ministry experiences people discover and join."},
 {href:"/directory",eyebrow:"Connections",title:"Directory",copy:"Curate trusted ministries and resources as the directory grows."},
 {href:"/auth/emmaus?next=/study",eyebrow:"Scripture",title:"Emmaus",copy:"Open the deeper Scripture-study experience through the shared account."},
 {href:"/studio/giving",eyebrow:"Stewardship",title:"Giving",copy:"Keep support visible, transparent, and invitational without placing it ahead of Scripture or salvation."},
];

export default async function StudioPage(){
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=/studio");
 const{data:profile}=await supabase.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
 if(profile?.role!=="admin")redirect("/dashboard");
 return <main className="lfp-page pb-24"><section className="border-b border-white/60"><div className="lfp-shell py-10 sm:py-14"><p className="lfp-eyebrow">L&F Studio</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Serve the ministry. Keep the mission first.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Studio is the operating space for The Lost & Found Project. Scripture and helping people find and follow Jesus stay at the center; administration, technology, and stewardship support that mission.</p><div className="mt-7 rounded-[1.6rem] border border-blue-100 bg-blue-50/70 p-5"><p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Studio principle</p><p className="mt-2 font-black text-slate-950">Scripture & Salvation first. Ministry second. Stewardship supports both.</p></div></div></section><div className="lfp-shell py-10"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sections.map(s=><Link key={s.title} href={s.href} className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.17em] text-blue-700">{s.eyebrow}</p><h2 className="mt-2 text-2xl font-black">{s.title}</h2><p className="mt-3 leading-7 text-slate-600">{s.copy}</p><span className="mt-5 inline-flex font-black text-blue-700">Open →</span></Link>)}</div></div></main>
}
