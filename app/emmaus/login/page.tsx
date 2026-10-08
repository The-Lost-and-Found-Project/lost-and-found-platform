"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import ResendConfirmationForm from "@/components/ResendConfirmationForm";

function safePath(value:string|null){return value?.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")?value:"/study"}

export default function EmmausLoginPage(){
 const params=useSearchParams(),next=safePath(params.get("next")),handoff=`/auth/emmaus?next=${encodeURIComponent(next)}`;
 const supabase=useMemo(()=>createClient(),[]);
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false),[emailNotConfirmed,setEmailNotConfirmed]=useState(false);

 useEffect(()=>{let active=true;supabase.auth.getUser().then(({data})=>{if(active&&data?.user)window.location.replace(handoff)});return()=>{active=false}},[handoff,supabase]);

 async function handleSignIn(event:React.FormEvent){
  event.preventDefault();setError("");setEmailNotConfirmed(false);setLoading(true);
  const{error}=await supabase.auth.signInWithPassword({email,password});
  if(error){const unconfirmed=error.code==="email_not_confirmed";setEmailNotConfirmed(unconfirmed);setError(unconfirmed?"Please confirm your email address before signing in.":error.message);setLoading(false);return}
  window.location.assign(handoff);
 }

 return <main className="min-h-screen bg-[#090a08] px-4 py-10 text-[#eee7dc]">
  <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl place-items-center">
   <section className="w-full max-w-md rounded-[1.5rem] border border-[#4a3b25] bg-[#10110f] p-6 shadow-2xl shadow-black/40 sm:p-8">
    <div className="text-center">
     <p className="font-serif text-3xl tracking-[.22em] text-[#d8b362]">EMMAUS</p>
     <p className="mt-2 text-[.64rem] font-black uppercase tracking-[.22em] text-[#8f877b]">Walking Through Scripture</p>
    </div>
    <div className="my-7 h-px bg-[#2c2a24]"/>
    <p className="text-xs font-black uppercase tracking-[.16em] text-[#bd964d]">Welcome back</p>
    <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-[#f3eadc]">Continue your walk through Scripture.</h1>
    <p className="mt-4 text-sm leading-6 text-[#9f978a]">Sign in to Emmaus and return directly to your Bible, Journey, and study work.</p>
    <form onSubmit={handleSignIn} className="mt-7 space-y-4">
     <label className="block text-sm font-semibold text-[#d8d0c4]">Email<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-[#3a3933] bg-[#0b0c0a] px-3 py-3 text-[#f1e8da] outline-none focus:border-[#b88b3d] focus:ring-2 focus:ring-[#b88b3d]/15"/></label>
     <div><div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-[#d8d0c4]">Password</label><Link href={`/forgot-password?next=${encodeURIComponent(handoff)}`} className="text-xs font-bold text-[#c9a45a]">Forgot password?</Link></div><input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded-xl border border-[#3a3933] bg-[#0b0c0a] px-3 py-3 text-[#f1e8da] outline-none focus:border-[#b88b3d] focus:ring-2 focus:ring-[#b88b3d]/15"/></div>
     {error&&<div role="alert" className="rounded-xl border border-red-900/40 bg-red-950/30 px-3 py-3 text-sm text-red-200"><p>{error}</p>{emailNotConfirmed&&<div className="mt-2"><ResendConfirmationForm initialEmail={email}/></div>}</div>}
     <button type="submit" disabled={loading} className="w-full rounded-xl border border-[#d2a751] bg-[#c89943] px-5 py-3 text-sm font-black text-[#0d0b08] disabled:opacity-50">{loading?"Signing in...":"Sign in to Emmaus"}</button>
    </form>
    <p className="mt-5 text-center text-sm text-[#8d867b]">New to Emmaus? <Link href={`/emmaus/signup?next=${encodeURIComponent(next)}`} className="font-bold text-[#c9a45a]">Create your account</Link></p>
    <p className="mt-8 border-t border-[#292923] pt-5 text-center text-[.68rem] text-[#6f6b64]">A ministry of The Lost &amp; Found Project</p>
   </section>
  </div>
 </main>;
}
