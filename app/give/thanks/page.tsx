import Link from "next/link";
import {createClient} from "@/lib/supabase/server";

export default async function GivingThanksPage(){
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 let latest:any=null;
 if(user){
  const email=user.email?.trim().toLowerCase()??"";
  const{data}=await supabase.from("giving_transactions")
   .select("id,amount,currency,donated_at,status,receipt_url,transaction_type")
   .or(`user_id.eq.${user.id}${email?`,contact_email.ilike.${email}`:""}`)
   .order("donated_at",{ascending:false}).limit(1).maybeSingle();
  latest=data;
 }
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden bg-[rgb(var(--lfp-ink))] text-white">
   <div className="lfp-shell py-16 sm:py-24">
    <p className="text-xs font-black uppercase tracking-[.2em] text-sky-300">Thank you</p>
    <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl">Thank you for helping carry the mission forward.</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">Your generosity helps The Lost &amp; Found Project continue pointing people to Christ, opening Scripture, building community, and putting faith into action.</p>
    <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">This is simply a thank-you. There is no second giving ask here.</p>
   </div>
  </section>
  <div className="lfp-shell py-10">
   {user?<section className="lfp-card p-7 sm:p-9"><p className="lfp-eyebrow">Your giving record</p>{latest?<><h2 className="mt-2 text-3xl font-black">Your latest synchronized gift</h2><div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-slate-50 p-5"><div><p className="text-sm font-bold text-slate-500">{new Date(latest.donated_at).toLocaleDateString()} · {latest.transaction_type==="recurring"?"Recurring":"One-time"}</p><p className="mt-1 text-3xl font-black">{Number(latest.amount).toLocaleString("en-US",{style:"currency",currency:latest.currency||"USD"})}</p></div>{latest.receipt_url&&<a href={latest.receipt_url} target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-secondary">Zeffy receipt →</a>}</div><p className="mt-4 text-sm leading-6 text-slate-500">Zeffy remains the official payment and receipt source. If you just gave, synchronization may take a short time before the gift appears here.</p></>:<><h2 className="mt-2 text-3xl font-black">Your account is ready.</h2><p className="mt-3 leading-7 text-slate-600">We do not see a synchronized gift on your L&amp;F account yet. If you just completed a gift, Zeffy may still be sending it to us.</p></>}<Link href="/account/giving" className="lfp-button lfp-button-secondary mt-6">Open My Giving</Link></section>:<section className="lfp-card p-7 sm:p-9"><p className="lfp-eyebrow">Keep your giving history together</p><h2 className="mt-2 text-3xl font-black">Already part of L&amp;F?</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">Sign in with the same email used for your Zeffy gift and L&amp;F can securely match synchronized giving records to your account.</p><Link href="/login?next=/account/giving" className="lfp-button lfp-button-secondary mt-6">Sign in to My Giving</Link></section>}
   <section className="mt-10"><p className="lfp-eyebrow">Where to go from here</p><h2 className="mt-2 text-3xl font-black">Stay connected to the mission.</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Next href="/prayer" title="Pray">Pray with us and carry someone&apos;s need before God.</Next><Next href="/ministries" title="Explore Ministries">See where L&amp;F is serving and building.</Next><Next href="/share-your-story" title="Share Your Story">Tell us how L&amp;F has encouraged or helped you.</Next><Next href="https://emmaus.lostandfoundproject.org" title="Open Emmaus" external>Go deeper in Scripture through Emmaus.</Next></div></section>
  </div>
 </main>
}
function Next({href,title,children,external=false}:{href:string;title:string;children:React.ReactNode;external?:boolean}){const cls="lfp-card group p-6";const body=<><h3 className="text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{children}</p><span className="mt-5 inline-flex text-sm font-black text-blue-700">Continue →</span></>;return external?<a href={href} className={cls}>{body}</a>:<Link href={href} className={cls}>{body}</Link>}
