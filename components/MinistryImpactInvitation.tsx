import Link from "next/link";
import {createClient} from "@/lib/supabase/server";

type Impact={id:string;ministry_slug:string;title:string;public_message:string;show_on_ministry:boolean;show_on_giving:boolean;show_in_app:boolean;sort_order:number};

export async function MinistryImpactInvitation({ministrySlug,surface="ministry",limit=1}:{ministrySlug?:string;surface?:"ministry"|"giving"|"app";limit?:number}){
 const supabase=await createClient();
 const{data}=await supabase.rpc("get_active_ministry_impact_areas",{p_ministry_slug:ministrySlug??null});
 const key=surface==="ministry"?"show_on_ministry":surface==="giving"?"show_on_giving":"show_in_app";
 const items=((data??[]) as Impact[]).filter(i=>i[key]).slice(0,limit);
 if(!items.length)return null;
 return <section className="mt-12" aria-label="Support the ministry"><div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-6 sm:p-8"><p className="text-[11px] font-black uppercase tracking-[.17em] text-blue-700">Help make more ministry possible</p>{items.map(i=><div key={i.id} className="mt-3"><h2 className="text-2xl font-black text-slate-950">{i.title}</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">{i.public_message}</p></div>)}<div className="mt-5 flex flex-wrap items-center gap-3"><Link href="/give" className="lfp-button lfp-button-secondary">Support L&amp;F</Link><span className="text-xs font-bold text-slate-500">Prayer, serving, sharing, and giving all matter.</span></div></div></section>
}
