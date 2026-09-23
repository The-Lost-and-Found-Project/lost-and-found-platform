import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {MinistryImpactInvitation} from "@/components/MinistryImpactInvitation";

const GENERAL_GIVE_URL="https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

export default async function GivePage(){
 const supabase=await createClient();
 const [{data:impact},{data:campaigns},{data:{user}}]=await Promise.all([
  supabase.rpc("get_active_ministry_impact_areas",{p_ministry_slug:null}),
  supabase.rpc("get_active_giving_campaigns"),
  supabase.auth.getUser()
 ]);
 const hasImpact=(impact??[]).some((i:any)=>i.show_on_giving);
 const active=(campaigns??[]) as any[];
 return <main className="lfp-page pb-24">
  <section className="relative overflow-hidden bg-[rgb(var(--lfp-ink))] text-white">
   <div className="lfp-shell py-14 sm:py-20">
    <p className="text-xs font-black uppercase tracking-[.2em] text-sky-300">Giving &amp; Stewardship</p>
    <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl">Scripture and salvation first. Generosity helps carry the work forward.</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">The Lost &amp; Found Project exists to point people to Christ, help people grow in God&apos;s Word, and put faith into action. Financial support helps make the practical ministry behind that mission possible.</p>
    <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400">“Let each man give according as he has determined in his heart, not grudgingly or under compulsion, for God loves a cheerful giver.” — 2 Corinthians 9:7, WEB</p>
    <div className="mt-8 flex flex-wrap gap-3"><a href={GENERAL_GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-primary">Give securely with Zeffy →</a>{user&&<Link href="/account/giving" className="lfp-button lfp-button-secondary">My Giving</Link>}</div>
    <p className="mt-4 text-xs font-bold text-slate-400">Zeffy securely processes the transaction. L&amp;F does not store your payment-card information.</p>
   </div>
  </section>

  <div className="lfp-shell py-10">
   <section>
    <p className="lfp-eyebrow">More than one way to participate</p>
    <div className="mt-5 grid gap-4 md:grid-cols-4"><Way title="Pray">Pray for the people, ministries, leaders, and opportunities God places before L&amp;F.</Way><Way title="Serve">Give your time and abilities where the ministry has a place for you to help.</Way><Way title="Share">Help someone discover a study, ministry, prayer community, or resource that may serve them.</Way><Way title="Give">Financial support helps sustain and expand the practical work behind the ministry.</Way></div>
   </section>

   {hasImpact&&<MinistryImpactInvitation surface="giving" limit={4}/>}

   {active.length>0&&<section className="mt-12"><p className="lfp-eyebrow">Current opportunities</p><h2 className="mt-2 text-3xl font-black">Ways your generosity can help right now.</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{active.map((c:any)=><article key={c.id} className="lfp-card p-6"><p className="text-xs font-black uppercase tracking-widest text-blue-700">{c.campaign_type==="designated"?"Designated opportunity":"General mission"}</p><h3 className="mt-2 text-2xl font-black">{c.title}</h3><p className="mt-3 leading-7 text-slate-600">{c.summary}</p>{c.campaign_type==="designated"&&c.designation_notice&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">{c.designation_notice}</p>}<a href={c.zeffy_url||GENERAL_GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-primary mt-5">Support this work →</a></article>)}</div></section>}

   <section className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
    <article className="rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-9"><p className="lfp-eyebrow">What support makes possible</p><h2 className="mt-2 text-3xl font-black">Resources behind real ministry.</h2><p className="mt-4 leading-7 text-slate-600">General Mission gifts give L&amp;F flexibility to steward resources where they can best advance the mission. That can include Bible study and discipleship resources, outreach and ministry programs, meals and fellowship, prayer and community tools, Emmaus and L&amp;F technology, and helping other ministries strengthen their digital presence.</p><p className="mt-4 text-sm font-bold text-slate-500">Unless a giving opportunity is specifically identified as designated, L&amp;F stewards gifts across the mission rather than promising that an individual gift funds one specific outcome.</p></article>
    <article className="rounded-[2rem] bg-blue-50 p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-widest text-blue-700">Give freely</p><h2 className="mt-2 text-2xl font-black">No pressure. No minimum.</h2><p className="mt-3 leading-7 text-slate-600">One-time and recurring generosity are both welcome. Prayer, serving, sharing, and participation remain meaningful ways to support the mission whether or not you give financially.</p><a href={GENERAL_GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-primary mt-6">Open secure giving →</a></article>
   </section>

   <section className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-9"><p className="lfp-eyebrow">Stay connected</p><h2 className="mt-2 text-3xl font-black">Giving should connect you to the mission—not a sales funnel.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">Members can view synchronized giving history in their account. As verified ministry updates are published, L&amp;F can also show the collective work generosity helped support without pretending an individual dollar can be traced to a spiritual outcome.</p><div className="mt-6 flex flex-wrap gap-3">{user?<Link href="/account/giving" className="lfp-button lfp-button-secondary">View My Giving</Link>:<Link href="/login?next=/account/giving" className="lfp-button lfp-button-secondary">Sign in to My Giving</Link>}<Link href="/ministries" className="lfp-button lfp-button-secondary">Explore Ministries</Link><Link href="/prayer" className="lfp-button lfp-button-secondary">Pray With Us</Link></div></section>
  </div>
 </main>
}
function Way({title,children}:{title:string;children:React.ReactNode}){return <article className="lfp-card p-5"><h2 className="text-xl font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{children}</p></article>}
