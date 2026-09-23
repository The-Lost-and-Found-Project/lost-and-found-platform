import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export default async function AnnualGivingReport({searchParams}:{searchParams:Promise<{year?:string}>}){
 const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login?next=/account/giving/annual");
 const params=await searchParams;const current=new Date().getFullYear();const requested=Number(params.year);const year=Number.isInteger(requested)&&requested>=2020&&requested<=current?requested:current-1;
 const email=user.email?.trim().toLowerCase()??"";
 const start=`${year}-01-01T00:00:00.000Z`,end=`${year+1}-01-01T00:00:00.000Z`;
 const{data:x,error}=await s.from("giving_transactions").select("id,amount,currency,donated_at,status,receipt_url,transaction_type,source").or(`user_id.eq.${user.id}${email?`,contact_email.ilike.${email}`:""}`).gte("donated_at",start).lt("donated_at",end).eq("status","completed").order("donated_at",{ascending:true});
 const rows=x??[];const total=rows.reduce((n:any,t:any)=>n+Number(t.amount),0);
 return <main className="lfp-page pb-24"><div className="lfp-shell py-10">
  <Link href="/account/giving" className="text-sm font-black text-blue-700">← My Giving</Link>
  <p className="lfp-eyebrow mt-8">Annual Giving Report</p><h1 className="mt-3 text-4xl font-black">{year} giving summary</h1>
  <p className="mt-3 max-w-3xl leading-7 text-slate-600">A convenient summary of completed gifts synchronized from Zeffy. Individual Zeffy receipts remain the authoritative transaction records. This page does not determine tax deductibility or replace tax advice.</p>
  <div className="mt-6 flex flex-wrap gap-2">{[current,current-1,current-2].filter(y=>y>=2020).map(y=><Link key={y} href={`/account/giving/annual?year=${y}`} className={`rounded-xl border px-4 py-2 text-sm font-black ${y===year?"border-blue-600 bg-blue-50 text-blue-700":"border-slate-200 bg-white"}`}>{y}</Link>)}</div>
  {error?<div className="lfp-card mt-8 p-6 text-red-700">Unable to load this report: {error.message}</div>:<>
   <section className="mt-8 grid gap-4 sm:grid-cols-2"><div className="lfp-card p-6"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Completed gifts</p><p className="mt-2 text-4xl font-black">{rows.length}</p></div><div className="lfp-card p-6"><p className="text-xs font-black uppercase tracking-widest text-slate-500">Recorded total</p><p className="mt-2 text-4xl font-black">{total.toLocaleString("en-US",{style:"currency",currency:"USD"})}</p></div></section>
   <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">Transactions</p><h2 className="mt-2 text-2xl font-black">Gift-by-gift record</h2></div></div><div className="mt-4 grid gap-3">{rows.length?rows.map((t:any)=><article key={t.id} className="lfp-card flex flex-wrap items-center justify-between gap-4 p-5"><div><b>{new Date(t.donated_at).toLocaleDateString()}</b><p className="text-sm text-slate-500">{t.source||"L&F General Mission"} · {t.transaction_type==="recurring"?"Recurring":"One-time"}</p>{t.receipt_url&&<a href={t.receipt_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-sm font-black text-blue-700">Official Zeffy receipt →</a>}</div><b>{Number(t.amount).toLocaleString("en-US",{style:"currency",currency:t.currency||"USD"})}</b></article>):<div className="lfp-card p-6">No completed synchronized gifts for {year}.</div>}</div></section>
   <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">About this report</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">This report is generated from L&amp;F&apos;s synchronized giving ledger for your account. Keep your official Zeffy receipts with your records. If you need tax guidance, consult a qualified tax professional.</p></section>
  </>}
 </div></main>
}