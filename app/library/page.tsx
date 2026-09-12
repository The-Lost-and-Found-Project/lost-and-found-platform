import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPES=[
 {key:"study",icon:"▤",label:"Studies",copy:"Emmaus and L&F curated Bible studies."},
 {key:"devotional",icon:"☼",label:"Devotions",copy:"Short teaching rhythms for daily formation."},
 {key:"trivia",icon:"?",label:"Trivia",copy:"Interactive Bible knowledge and daily challenges."},
 {key:"audio",icon:"◉",label:"Listen",copy:"Original and approved audio teaching."},
 {key:"video",icon:"▶",label:"Watch",copy:"Teaching, interviews, sermons, and conversations."},
 {key:"collection",icon:"◇",label:"Collections",copy:"Guided journeys combining multiple resources."},
];

const provenanceLabel=(value:string)=>value==="lfp_original"?"L&F Original":value==="lfp_approved"?"L&F Approved":"Emmaus";

export default async function LibraryPage(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:items}=await supabase.from("content_catalog").select("id,slug,title,summary,content_type,provenance,author_name,source_name,scripture_refs,topics,duration_minutes,difficulty,external_url,is_featured,published_at").eq("is_published",true).order("is_featured",{ascending:false}).order("published_at",{ascending:false}).limit(60);
 const featured=(items??[]).filter((x:any)=>x.is_featured).slice(0,3); const rest=(items??[]).filter((x:any)=>!x.is_featured);
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden"><div aria-hidden className="lfp-grid absolute inset-0"/><div className="lfp-shell relative py-12 sm:py-16"><p className="lfp-eyebrow">L&F Library</p><h1 className="mt-3 max-w-5xl text-4xl font-black tracking-[-.045em] text-slate-950 sm:text-6xl">Study. Listen. Watch. Practice. <span className="lfp-gradient-text">Keep growing.</span></h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">One trusted place for Emmaus, L&F studies, devotions, trivia, original teaching, and carefully approved outside content.</p><div className="mt-7 flex flex-wrap gap-3"><a href="https://emmaus.lostandfoundproject.org" target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-primary">Open Emmaus ↗</a><Link href="/discover" className="lfp-button lfp-button-secondary">Back to Discover</Link></div></div></section>
  <div className="lfp-shell py-8 sm:py-12">
   <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{TYPES.map(t=><a key={t.key} href={`#${t.key}`} className="lfp-card p-4"><span className="text-xl text-blue-700">{t.icon}</span><h2 className="mt-3 font-black text-slate-950">{t.label}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{t.copy}</p></a>)}</section>
   {featured.length>0&&<section className="mt-12"><p className="lfp-eyebrow">Featured</p><h2 className="mt-2 text-3xl font-black text-slate-950">Start here</h2><div className="mt-6 grid gap-4 lg:grid-cols-3">{featured.map((item:any)=><CatalogCard key={item.id} item={item}/>)}</div></section>}
   {TYPES.map(type=>{const group=rest.filter((x:any)=>x.content_type===type.key); if(!group.length)return null; return <section key={type.key} id={type.key} className="mt-12 scroll-mt-24"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">{type.label}</p><h2 className="mt-2 text-3xl font-black text-slate-950">{type.copy}</h2></div><span className="text-sm font-bold text-slate-400">{group.length} available</span></div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{group.map((item:any)=><CatalogCard key={item.id} item={item}/>)}</div></section>})}
   {!items?.length&&<section className="mt-12 rounded-[2rem] border border-dashed border-slate-300 bg-white/70 p-8 text-center"><p className="text-3xl">▦</p><h2 className="mt-3 text-2xl font-black text-slate-950">The new library is ready for content.</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Once the catalog migration is applied, your original studies, devotions, trivia, audio, video, and approved resources will appear here without requiring a code change.</p></section>}
  </div>
 </main>;
}

function CatalogCard({item}:{item:any}){const href=item.external_url||`/library/${item.slug}`; const external=Boolean(item.external_url); return external?<a href={href} target="_blank" rel="noopener noreferrer" className="lfp-card group p-6"><CardBody item={item}/></a>:<Link href={href} className="lfp-card group p-6"><CardBody item={item}/></Link>}
function CardBody({item}:{item:any}){return <><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.13em] text-blue-700">{provenanceLabel(item.provenance)}</span><span className="text-xs font-bold capitalize text-slate-400">{item.content_type}</span></div><h3 className="mt-4 text-xl font-black text-slate-950">{item.title}</h3>{item.summary&&<p className="mt-2 line-clamp-3 leading-7 text-slate-600">{item.summary}</p>}<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">{item.duration_minutes&&<span>{item.duration_minutes} min</span>}{item.author_name&&<span>• {item.author_name}</span>}{item.difficulty&&<span>• {item.difficulty}</span>}</div><span className="mt-5 inline-flex font-black text-blue-700 transition group-hover:translate-x-1">Open →</span></>}
