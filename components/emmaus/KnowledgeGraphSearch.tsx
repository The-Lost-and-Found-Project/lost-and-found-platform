"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Node={id:string;node_key:string;node_type:string;title:string;subtitle:string|null;summary:string|null;scripture_reference:string|null};
const filters=["all","verse","passage","theme","person","place","event","discovery","language_term","question"];

export default function KnowledgeGraphSearch(){
 const supabase=useMemo(()=>createClient(),[]);
 const[query,setQuery]=useState(""),[type,setType]=useState("all"),[results,setResults]=useState<Node[]>([]),[featured,setFeatured]=useState<Node[]>([]),[loading,setLoading]=useState(false),[message,setMessage]=useState("");
 async function loadFeatured(){const{data,error}=await supabase.from("emmaus_graph_nodes").select("id,node_key,node_type,title,subtitle,summary,scripture_reference").eq("status","published").in("node_key",["scripture:kjv:john-1-1","discovery:lamb-of-god","theme:light","person:nicodemus","theme:living-water","event:john-sign-3-bethesda","discovery:i-am-bread-of-life","theme:temple"]).limit(12);if(error){setMessage(error.message);return}setFeatured((data??[]) as Node[])}
 async function search(){setLoading(true);setMessage("");let request=supabase.from("emmaus_graph_nodes").select("id,node_key,node_type,title,subtitle,summary,scripture_reference").eq("status","published").or(`title.ilike.%${escapeSearch(query)}%,scripture_reference.ilike.%${escapeSearch(query)}%,summary.ilike.%${escapeSearch(query)}%`).order("title").limit(40);if(type!=="all")request=request.eq("node_type",type);const{data,error}=await request;if(error){setMessage(error.message);setResults([])}else setResults((data??[]) as Node[]);setLoading(false)}
 useEffect(()=>{void loadFeatured()},[]);
 useEffect(()=>{const timer=setTimeout(()=>{if(query.trim().length>=2)void search();else setResults([])},250);return()=>clearTimeout(timer)},[query,type]);
 const display=query.trim().length>=2?results:featured;
 return <div className="space-y-6">
  <header className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-9"><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Emmaus Exploration Engine</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Biblical Knowledge Graph</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/70">Begin with a verse, person, place, event, theme, Greek term, or discovery and travel through its relationships in Scripture.</p></header>
  <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl"><label className="block"><span className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Search the graph</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try John 3:16, Nicodemus, Light, Living Water, or Lamb of God" className="mt-3 w-full rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-lg outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"/></label><div className="mt-4 flex flex-wrap gap-2">{filters.map(item=><button key={item} onClick={()=>setType(item)} className={`rounded-full px-4 py-2 text-xs font-black capitalize ${type===item?"bg-indigo-600 text-white":"border border-slate-300 bg-white text-slate-600"}`}>{item.replaceAll("_"," ")}</button>)}</div></section>
  <section><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{query.trim().length>=2?"Search results":"Start exploring"}</p><h2 className="mt-1 text-3xl font-black text-slate-950">{loading?"Searching...":query.trim().length>=2?`${display.length} discoveries found`:"Featured gateways"}</h2></div><Link href="/emmaus/explore/scripture%3Akjv%3Ajohn-1-1" className="hidden rounded-full bg-indigo-600 px-5 py-3 font-black text-white sm:block">Open John 1:1 →</Link></div>
  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{display.map(node=><Link key={node.id} href={`/emmaus/explore/${encodeURIComponent(node.node_key)}`} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-lg transition hover:-translate-y-1 hover:border-indigo-400"><div className="flex items-start justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{node.node_type.replaceAll("_"," ")}</p>{node.scripture_reference&&<span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">{node.scripture_reference}</span>}</div><h3 className="mt-3 text-2xl font-black text-slate-950">{node.title}</h3>{node.subtitle&&<p className="mt-1 font-bold text-indigo-600">{node.subtitle}</p>}<p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{node.summary}</p><p className="mt-4 text-sm font-black text-indigo-700">Explore relationships →</p></Link>)}</div>
  {!loading&&!display.length&&<div className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No published graph nodes matched this search.</div>}</section>
  <p className="min-h-5 text-sm font-bold text-slate-500">{message}</p>
 </div>
}
function escapeSearch(value:string){return value.replace(/[,%()]/g," ").trim()}
