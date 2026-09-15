"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function safeNext(){
  if(typeof window==="undefined") return "/dashboard";
  const requested=new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/")&&!requested.startsWith("//")&&!requested.includes("\\")?requested:"/dashboard";
}

export default function ForgotPasswordPage(){
  const supabase=useMemo(()=>createClient(),[]);
  const[email,setEmail]=useState("");const[status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setStatus("sending");const next=safeNext();const recoveryTarget=`/reset-password?next=${encodeURIComponent(next)}`;const redirectTo=`${window.location.origin}/auth/recovery?next=${encodeURIComponent(recoveryTarget)}`;const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});setStatus(error?"error":"sent")}
  return <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-12"><section className="mx-auto w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8"><p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">Account recovery</p><h1 className="mt-3 text-3xl font-black text-slate-950">Reset your L&F password</h1><p className="mt-3 text-sm leading-6 text-slate-600">Enter the email for your Lost & Found Project account. The same password is used when you enter Emmaus.</p>{status==="sent"?<div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">If an account exists for that address, a secure recovery link has been sent. Open the link on this device to continue.</div>:<form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-slate-700">Email<input autoFocus type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"/></label>{status==="error"&&<p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">We couldn’t send the recovery email. Please try again.</p>}<button disabled={status==="sending"} className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50">{status==="sending"?"Sending…":"Send recovery link"}</button></form>}<div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"><Link href="/login" className="font-bold text-blue-700">L&F Sign In</Link><Link href="/emmaus/login" className="font-bold text-amber-800">Emmaus Sign In</Link></div></section></main>
}
