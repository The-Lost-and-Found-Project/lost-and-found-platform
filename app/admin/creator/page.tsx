import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";

const lanes=[
 {href:"/admin/library",eyebrow:"Discover & Library",title:"Library, collections & media",description:"Create L&F Original resources, curate L&F Approved material, and register Emmaus handoffs without duplicating Emmaus content.",icon:"▦"},
 {href:"/admin/studies",eyebrow:"Bible Study",title:"Interactive studies",description:"Build Scripture-centered studies with teaching, discussion, journaling, meeting links, downloads, and devotional cards.",icon:"▣"},
 {href:"/admin/ministries",eyebrow:"Ministry Spaces",title:"Ministry publishing",description:"Publish gatherings, announcements, resources, studies, and service opportunities into Interactive Ministry Spaces.",icon:"⌂"},
 {href:"/admin/content",eyebrow:"Community",title:"Community moderation",description:"Review praise reports and testimonies separately from editorial publishing so moderation never gets confused with content creation.",icon:"◇"},
];

export default async function CreatorStudioPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("role,preview_role").eq("id",user.id).single();
 if(getEffectiveRole(profile?.role,profile?.preview_role)!=="admin")redirect("/dashboard");
 const [{data:catalog},{data:studies},{data:ministryContent}]=await Promise.all([
  supabase.from("content_catalog").select("id,is_published,is_featured,content_type,provenance"),
  supabase.from("bible_studies").select("id,is_published"),
  supabase.from("ministry_content").select("id,is_published,is_featured,content_type"),
 ]);
 const catalogRows=catalog??[], studyRows=studies??[], ministryRows=ministryContent??[];
 const liveCatalog=catalogRows.filter((x:any)=>x.is_published).length;
 const draftCatalog=catalogRows.length-liveCatalog;
 const liveStudies=studyRows.filter((x:any)=>x.is_published).length;
 const liveMinistry=ministryRows.filter((x:any)=>x.is_published).length;
 const featured=catalogRows.filter((x:any)=>x.is_featured).length+ministryRows.filter((x:any)=>x.is_featured).length;
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden bg-slate-950 text-white"><div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,rgba(37,99,235,.3),transparent_32rem)]"/><div className="lfp-shell relative py-10 sm:py-14"><Link href="/admin" className="text-sm font-black text-sky-200">← Administration Center</Link><div className="mt-7 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Creator Studio</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-6xl">Create once. Publish into the L&F ecosystem.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Creator Studio is the editorial control room for Discover, the Library, Bible studies, and ministry spaces. It reuses the systems already powering L&F instead of creating another content backend.</p></div><div className="flex flex-wrap gap-3 lg:justify-end"><Link href="/discover" className="lfp-button bg-white text-slate-950">Preview Discover →</Link><Link href="/library" className="lfp-button border border-white/15 bg-white/10 text-white">Preview Library</Link></div></div><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5"><Stat label="Live catalog items" value={liveCatalog}/><Stat label="Catalog drafts" value={draftCatalog}/><Stat label="Published studies" value={liveStudies}/><Stat label="Live ministry posts" value={liveMinistry}/><Stat label="Featured items" value={featured}/></div></div></section>
  <div className="lfp-shell py-8 sm:py-12">
   <section><p className="lfp-eyebrow">Publishing lanes</p><h2 className="mt-2 text-3xl font-black text-slate-950">Choose what you are creating.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">Each lane stays specialized while sharing the same member ecosystem. That keeps administration understandable without flattening every content type into one generic form.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{lanes.map(l=><Link key={l.href} href={l.href} className="lfp-card group p-6"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">{l.icon}</span><span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-700">→</span></div><p className="mt-5 text-[11px] font-black uppercase tracking-[.16em] text-blue-700">{l.eyebrow}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{l.title}</h3><p className="mt-2 leading-7 text-slate-600">{l.description}</p></Link>)}</div></section>
   <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><article className="rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-9"><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Editorial model</p><h2 className="mt-3 text-3xl font-black">L&F Original · L&F Approved · Emmaus</h2><p className="mt-3 leading-7 text-slate-300">Provenance remains visible so members can tell what L&F created, what L&F intentionally curated, and what should open in Emmaus for deeper study. Creator Studio does not copy Emmaus into L&F.</p><div className="mt-6 flex flex-wrap gap-2 text-sm font-black"><span className="rounded-full bg-white/10 px-4 py-2">L&F Original</span><span className="rounded-full bg-white/10 px-4 py-2">L&F Approved</span><span className="rounded-full bg-white/10 px-4 py-2">Emmaus handoff</span></div></article><article className="lfp-card p-7 sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-emerald-700">Guardrails</p><h2 className="mt-3 text-2xl font-black text-slate-950">Publish deliberately.</h2><div className="mt-5 space-y-3 text-sm font-bold leading-6 text-slate-700"><p>✓ Draft before publishing when content still needs review.</p><p>✓ Feature only what should receive elevated placement.</p><p>✓ Keep ministry-specific updates inside ministry spaces.</p><p>✓ Keep community moderation separate from editorial publishing.</p><p>✓ Keep Rare Network completely outside the L&F content system.</p></div></article></section>
  </div>
 </main>;
}

function Stat({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-indigo-100/70">{label}</p></div>}
