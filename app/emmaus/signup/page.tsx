"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useRouter,useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {getSiteUrl} from "@/lib/auth/confirmation";
import TurnstileWidget from "@/components/TurnstileWidget";
import ResendConfirmationForm from "@/components/ResendConfirmationForm";

function safePath(value:string|null){return value?.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")?value:"/welcome"}

export default function EmmausSignupPage(){
 const params=useSearchParams(),router=useRouter(),next=safePath(params.get("next")),handoff=`/auth/emmaus?next=${encodeURIComponent(next)}`;
 const supabase=useMemo(()=>createClient(),[]);
 const[fullName,setFullName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false),[submitted,setSubmitted]=useState(false),[existing,setExisting]=useState(false),[captchaToken,setCaptchaToken]=useState("");

 useEffect(()=>{let active=true;supabase.auth.getUser().then(({data})=>{if(active&&data?.user)router.replace(handoff)});return()=>{active=false}},[handoff,router,supabase]);

 async function handleSignUp(event:React.FormEvent){
  event.preventDefault();setError("");setExisting(false);
  if(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&!captchaToken){setError("Please complete the CAPTCHA challenge before submitting.");return}
  setLoading(true);
  const captcha=await fetch("/api/verify-turnstile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:captchaToken})}).then(r=>r.json());
  if(!captcha.success){setError(captcha.error??"CAPTCHA verification failed. Please try again.");setLoading(false);return}
  const redirectUrl=`${getSiteUrl(window.location.origin)}/auth/callback?next=${encodeURIComponent(handoff)}`;
  const{error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl,data:{full_name:fullName,emmaus_signup:true}}});
  if(error){const duplicate=error.code==="user_already_exists"||/already registered|already exists|email.*in use/i.test(error.message);setExisting(duplicate);setError(duplicate?"You already have an account. Sign in to Emmaus instead.":error.message);setLoading(false);return}
  setSubmitted(true);setLoading(false);
 }

 if(submitted)return <main className="min-h-screen bg-[#090a08] px-4 py-10 text-[#eee7dc]"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl place-items-center"><section className="w-full max-w-md rounded-[1.5rem] border border-[#4a3b25] bg-[#10110f] p-7 text-center shadow-2xl shadow-black/40"><p className="font-serif text-3xl tracking-[.22em] text-[#d8b362]">EMMAUS</p><h1 className="mt-7 font-serif text-3xl font-normal text-[#f3eadc]">Check your email</h1><p className="mt-4 text-sm leading-6 text-[#9f978a]">We sent a confirmation link to <strong className="text-[#ded5c8]">{email}</strong>. Confirm it and you’ll return directly to Emmaus.</p><div className="mt-4"><ResendConfirmationForm initialEmail={email}/></div><Link href={`/emmaus/login?next=${encodeURIComponent(next)}`} className="mt-6 inline-block text-sm font-bold text-[#c9a45a]">Back to Emmaus sign in</Link><p className="mt-8 border-t border-[#292923] pt-5 text-[.68rem] text-[#6f6b64]">A ministry of The Lost &amp; Found Project</p></section></div></main>;

 return <main className="min-h-screen bg-[#090a08] px-4 py-10 text-[#eee7dc]"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl place-items-center"><section className="w-full max-w-md rounded-[1.5rem] border border-[#4a3b25] bg-[#10110f] p-6 shadow-2xl shadow-black/40 sm:p-8">
  <div className="text-center"><p className="font-serif text-3xl tracking-[.22em] text-[#d8b362]">EMMAUS</p><p className="mt-2 text-[.64rem] font-black uppercase tracking-[.22em] text-[#8f877b]">Walking Through Scripture</p></div>
  <div className="my-7 h-px bg-[#2c2a24]"/>
  <p className="text-xs font-black uppercase tracking-[.16em] text-[#bd964d]">Create account</p>
  <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-[#f3eadc]">Begin your walk through Scripture.</h1>
  <p className="mt-4 text-sm leading-6 text-[#9f978a]">Create your Emmaus account. We’ll ask only for what Emmaus needs to get you started.</p>
  <form onSubmit={handleSignUp} className="mt-7 space-y-4">
   <label className="block text-sm font-semibold text-[#d8d0c4]">Name<input type="text" required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-1 block w-full rounded-xl border border-[#3a3933] bg-[#0b0c0a] px-3 py-3 text-[#f1e8da] outline-none focus:border-[#b88b3d] focus:ring-2 focus:ring-[#b88b3d]/15"/></label>
   <label className="block text-sm font-semibold text-[#d8d0c4]">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-[#3a3933] bg-[#0b0c0a] px-3 py-3 text-[#f1e8da] outline-none focus:border-[#b88b3d] focus:ring-2 focus:ring-[#b88b3d]/15"/></label>
   <label className="block text-sm font-semibold text-[#d8d0c4]">Password<input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded-xl border border-[#3a3933] bg-[#0b0c0a] px-3 py-3 text-[#f1e8da] outline-none focus:border-[#b88b3d] focus:ring-2 focus:ring-[#b88b3d]/15"/></label>
   <TurnstileWidget onVerify={setCaptchaToken} onExpire={()=>setCaptchaToken("")}/>
   {error&&<div role="alert" className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-3 text-sm text-red-200"><p>{error}</p>{existing&&<Link href={`/emmaus/login?next=${encodeURIComponent(next)}`} className="mt-2 inline-block font-bold text-[#d1aa60]">Sign in to Emmaus →</Link>}</div>}
   <button type="submit" disabled={loading} className="w-full rounded-xl border border-[#d2a751] bg-[#c89943] px-5 py-3 text-sm font-black text-[#0d0b08] disabled:opacity-50">{loading?"Creating account...":"Create Emmaus account"}</button>
  </form>
  <p className="mt-5 text-center text-sm text-[#8d867b]">Already have an account? <Link href={`/emmaus/login?next=${encodeURIComponent(next)}`} className="font-bold text-[#c9a45a]">Sign in to Emmaus</Link></p>
  <p className="mt-8 border-t border-[#292923] pt-5 text-center text-[.68rem] text-[#6f6b64]">A ministry of The Lost &amp; Found Project</p>
 </section></div></main>;
}
