"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Verse={id:string;verse_start:number;reference_label:string;text_content:string;graph_node_id:string|null};
type Node={id:string;node_key:string;node_type:string;title:string;subtitle:string|null;summary:string|null;scripture_reference:string|null};
type Edge={id:string;source_node_id:string;target_node_id:string;relationship_key:string;explanation:string|null};

type Connection={node:Node;edge:Edge};

export default function JohnOneDiscoveryExplorer(){
 const supabase=useMemo(()=>createClient(),[]);
 const[verses,setVerses]=useState<Verse[]>([]),[nodes,setNodes]=useState<Record<string,Node>>({}),[connections,setConnections]=useState<Connection[]>([]),[selectedVerse,setSelectedVerse]=useState<Verse|null>(null),[selectedNode,setSelectedNode]=useState<Node|null>(null),[loading,setLoading]=useState(true),[message,setMessage]=useState("");
 const[response,setResponse]=useState("");

 useEffect(()=>{void loadChapter()},[]);
 useEffect(()=>{if(selectedVerse?.graph_node_id)void loadNeighborhood(selectedVerse.graph_node_id);else setConnections([])},[selectedVerse?.graph_node_id]);

 async function loadChapter(){setLoading(true);const{data,error}=await supabase.from("emmaus_scripture_nodes").select("id,verse_start,reference_label,text_content,graph_node_id").eq("translation","KJV").eq("book_key","john").eq("chapter",1).eq("status","published").order("verse_start");if(error){setMessage(error.message);setLoading(false);return}const rows=(data??[]) as Verse[];setVerses(rows);setSelectedVerse(rows[0]??null);setLoading(false)}

 async function loadNeighborhood(graphNodeId:string){const{data:edgeRows,error}=await supabase.from("emmaus_graph_edges").select("id,source_node_id,target_node_id,relationship_key,explanation").or(`source_node_id.eq.${graphNodeId},target_node_id.eq.${graphNodeId}`).eq("status","published").limit(40);if(error){setMessage(error.message);return}const edges=(edgeRows??[]) as Edge[];const ids=[...new Set(edges.map(e=>e.source_node_id===graphNodeId?e.target_node_id:e.source_node_id))];if(!ids.length){setConnections([]);return}const{data:nodeRows,error:nodeError}=await supabase.from("emmaus_graph_nodes").select("id,node_key,node_type,title,subtitle,summary,scripture_reference").in("id",ids).eq("status","published");if(nodeError){setMessage(nodeError.message);return}const map=Object.fromEntries(((nodeRows??[]) as Node[]).map(n=>[n.id,n]));setNodes(current=>({...current,...map}));setConnections(edges.map(edge=>{const id=edge.source_node_id===graphNodeId?edge.target_node_id:edge.source_node_id;return{node:map[id],edge}}).filter(item=>item.node));}

 function selectNext(){if(!selectedVerse)return;const next=verses.find(v=>v.verse_start===selectedVerse.verse_start+1);if(next){setSelectedVerse(next);setSelectedNode(null);setResponse("");}}

 const grouped=connections.reduce<Record<string,Connection[]>>((acc,item)=>{const key=item.node.node_type;(acc[key]??=[]).push(item);return acc},{});
 const discoveryQuestions=grouped.question??[];
 const otherGroups=Object.entries(grouped).filter(([type])=>type!=="question"&&type!=="verse"&&type!=="passage");

 if(loading)return <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center font-black text-slate-500 shadow-xl">Loading John 1...</div>;
 if(!verses.length)return <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center font-black text-rose-700">John 1 is not available yet. Apply the KJV corpus migration first.</div>;

 return <div className="grid gap-6 xl:grid-cols-[280px_1fr_340px]">
  <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl"><p className="px-2 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">John 1 · KJV</p><div className="mt-4 max-h-[760px] space-y-2 overflow-auto pr-1">{verses.map(v=><button key={v.id} onClick={()=>{setSelectedVerse(v);setSelectedNode(null);setResponse("")}} className={`w-full rounded-2xl border p-3 text-left ${selectedVerse?.id===v.id?"border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100":"border-slate-200 bg-slate-50 hover:border-indigo-300"}`}><span className="font-black text-indigo-700">{v.verse_start}</span><p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-700">{v.text_content}</p></button>)}</div></aside>

  <main className="space-y-6">
   <section className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Discovery Explorer</p><h1 className="mt-2 text-4xl font-black">{selectedVerse?.reference_label}</h1></div><button disabled={selectedVerse?.verse_start===51} onClick={selectNext} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950 disabled:opacity-40">Next verse →</button></div><p className="mt-6 text-2xl leading-10 text-indigo-50">{selectedVerse?.text_content}</p></section>

   {discoveryQuestions.length>0&&<section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Ask before answering</p><h2 className="mt-2 text-2xl font-black text-amber-950">Discovery questions</h2><div className="mt-5 space-y-3">{discoveryQuestions.map(({node,edge})=><button key={edge.id} onClick={()=>setSelectedNode(node)} className="w-full rounded-2xl border border-amber-200 bg-white p-4 text-left"><p className="font-black text-slate-950">{node.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{node.summary}</p></button>)}</div></section>}

   <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Your discovery</p><textarea value={response} onChange={e=>setResponse(e.target.value)} rows={6} placeholder="What do you notice? What connection do you see?" className="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 p-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"/><p className="mt-3 text-sm text-slate-500">Responses are local to this prototype view; Walk-session persistence will be added in the next slice.</p></section>
  </main>

  <aside className="space-y-5"><section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Connected discoveries</p><div className="mt-4 space-y-4">{otherGroups.map(([type,items])=><div key={type}><p className="text-xs font-black uppercase tracking-wide text-slate-400">{type.replaceAll("_"," ")}</p><div className="mt-2 space-y-2">{items.map(({node,edge})=><button key={edge.id} onClick={()=>setSelectedNode(node)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-indigo-300"><p className="font-black text-slate-950">{node.title}</p><p className="mt-1 text-xs text-indigo-700">{edge.relationship_key.replaceAll("_"," ")}</p></button>)}</div></div>)}</div></section>
  <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">{selectedNode?<><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Selected connection</p><h2 className="mt-2 text-2xl font-black text-slate-950">{selectedNode.title}</h2><p className="mt-2 font-black text-indigo-700">{selectedNode.scripture_reference??selectedNode.node_type.replaceAll("_"," ")}</p><p className="mt-4 text-sm leading-6 text-slate-600">{selectedNode.summary}</p></>:<p className="text-sm leading-6 text-slate-500">Select a connected theme, person, passage, language term, or question to inspect it.</p>}</section><p className="min-h-5 text-sm font-bold text-slate-500">{message}</p></aside>
 </div>;
}
