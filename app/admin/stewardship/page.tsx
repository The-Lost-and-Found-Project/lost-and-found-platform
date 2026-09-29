import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";

const tabs=["Overview","Transactions","Giving","Expenses","Funds","Budgets","Reimbursements","Reports","Settings"];

export default async function StewardshipPage(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/login");
  const {data:profile}=await supabase.from("profiles").select("role, preview_role").eq("id",user.id).single();
  if(getEffectiveRole(profile?.role,profile?.preview_role)!=="admin") redirect("/dashboard");

  const [fundsResult,entriesResult]=await Promise.all([
    supabase.from("finance_funds").select("id,name,code,restriction_type,is_active").order("name"),
    supabase.from("finance_journal_entries").select("id,entry_date,memo,status,source_type,created_at").order("entry_date",{ascending:false}).limit(8)
  ]);
  const funds=fundsResult.data??[];
  const entries=entriesResult.data??[];

  return <main className="lfp-page pb-24">
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(245,158,11,.22),transparent_34rem)]"/>
      <div className="lfp-shell relative py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">L&amp;F Stewardship</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Ministry Finance &amp; Resource Management</h1><p className="mt-3 max-w-3xl text-slate-300">Faithful stewardship with nonprofit fund accounting underneath a simple ministry-first interface.</p></div>
          <Link href="/admin" className="lfp-button bg-white/10 text-white">Administration Center</Link>
        </div>
        <blockquote className="mt-7 max-w-2xl border-l-2 border-amber-300 pl-4 text-sm text-slate-300">“Moreover it is required in stewards, that a man be found faithful.” <strong className="text-white">1 Corinthians 4:2</strong></blockquote>
      </div>
    </section>
    <div className="lfp-shell py-8">
      <nav className="flex gap-2 overflow-x-auto pb-3">{tabs.map((tab,i)=><span key={tab} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${i===0?"bg-slate-950 text-white":"border bg-white text-slate-600"}`}>{tab}</span>)}</nav>
      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Stat label="Active funds" value={String(funds.filter(f=>f.is_active).length)} detail="General and designated ministry funds"/>
        <Stat label="Recent entries" value={String(entries.length)} detail="Latest journal activity"/>
        <Stat label="Restricted funds" value={String(funds.filter(f=>f.restriction_type==="donor_restricted").length)} detail="Tracked separately for stewardship"/>
        <Stat label="Books status" value="Ready" detail="Double-entry accounting foundation"/>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="lfp-card p-6"><p className="lfp-eyebrow">God's provision</p><h2 className="mt-2 text-2xl font-black">Recent financial activity</h2>
          <div className="mt-5 divide-y">{entries.length?entries.map(e=><div key={e.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-black">{e.memo||"Journal entry"}</p><p className="text-sm text-slate-500">{e.entry_date} · {e.source_type||"manual"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase">{e.status}</span></div>):<Empty text="No financial activity yet. The ledger is ready for your first transaction."/>}</div>
        </div>
        <div className="lfp-card p-6"><p className="lfp-eyebrow">Fund stewardship</p><h2 className="mt-2 text-2xl font-black">Ministry funds</h2>
          <div className="mt-5 space-y-3">{funds.length?funds.map(f=><div key={f.id} className="rounded-2xl border p-4"><div className="flex justify-between gap-3"><strong>{f.name}</strong><span className="text-xs font-black uppercase text-slate-500">{f.restriction_type.replaceAll("_"," ")}</span></div><p className="mt-1 text-sm text-slate-500">{f.code}</p></div>):<Empty text="Funds will appear here after the finance migration is applied."/>}</div>
        </div>
      </section>
      <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5"><strong>Accounting guardrail:</strong> posted journal entries are designed to remain auditable. Corrections should be made with reversing entries rather than silently deleting financial history.</section>
    </div>
  </main>
}
function Stat({label,value,detail}:{label:string;value:string;detail:string}){return <div className="lfp-card p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p><p className="mt-2 text-sm text-slate-500">{detail}</p></div>}
function Empty({text}:{text:string}){return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">{text}</p>}
