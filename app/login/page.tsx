"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ResendConfirmationForm from "@/components/ResendConfirmationForm";

function getSafeDestination() {
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\")
    ? requested
    : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [destination, setDestination] = useState("/dashboard");

  useEffect(() => {
    const next = getSafeDestination();
    setDestination(next);
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data?.user) router.replace(next);
    });
    return () => { active = false; };
  }, [router, supabase]);

  const openingEmmaus = destination.startsWith("/auth/emmaus");

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const isUnconfirmed = error.code === "email_not_confirmed";
      setEmailNotConfirmed(isUnconfirmed);
      setError(isUnconfirmed ? "Please confirm your email address before signing in." : error.message);
      setLoading(false);
      return;
    }
    router.push(destination);
    router.refresh();
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f6f1e7]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(196,151,68,.20),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(67,82,72,.18),transparent_34%),linear-gradient(135deg,#fbf8f1_0%,#f1eadc_52%,#e8e3d7_100%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-10">
        <section className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.28em] text-amber-800">The Lost & Found Project · Emmaus</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">One account. One ministry. A deeper walk in the Word.</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">Your Lost & Found account is the doorway to community, prayer, praise and testimony—and to Emmaus, our Scripture-centered study experience built to help you read carefully, discover faithfully, and return to God’s Word.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/65 p-5 shadow-sm backdrop-blur"><p className="text-xs font-bold uppercase tracking-[.18em] text-slate-500">Lost & Found</p><h2 className="mt-2 text-xl font-bold text-slate-950">Community for the walk.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Prayer, praise, testimony, ministry connection and a place to keep walking together.</p></div>
            <div className="rounded-2xl border border-amber-200/80 bg-[#fffaf0]/80 p-5 shadow-sm backdrop-blur"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-800">Emmaus</p><h2 className="mt-2 text-xl font-bold text-slate-950">Scripture for the journey.</h2><p className="mt-2 text-sm leading-6 text-slate-600">Read, notice, explore context, follow biblical threads, record discoveries and come back to Scripture.</p></div>
          </div>
          <p className="mt-6 text-sm font-medium text-slate-600">“Did not our heart burn within us… while he opened to us the scriptures?” <span className="whitespace-nowrap">— Luke 24:32</span></p>
        </section>

        <section className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-amber-800 ring-1 ring-amber-200">{openingEmmaus ? "Continue to Emmaus" : "Welcome back"}</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Sign in to your L&F account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{openingEmmaus ? "Sign in once and we’ll take you directly into Emmaus." : "Your account connects the Lost & Found community and Emmaus experience."}</p>
            </div>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700">Email</label><input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200" /></div>
              <div><label className="block text-sm font-semibold text-slate-700">Password</label><input type="password" required minLength={6} autoComplete="current-password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-200" /></div>
              {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}
              {emailNotConfirmed && <ResendConfirmationForm initialEmail={email} />}
              <button type="submit" disabled={loading} className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50">{loading ? "Signing in..." : openingEmmaus ? "Sign In & Open Emmaus" : "Sign In"}</button>
              <p className="text-center text-sm text-slate-500">Don&rsquo;t have an account? <Link href={`/signup${destination !== "/dashboard" ? `?next=${encodeURIComponent(destination)}` : ""}`} className="font-bold text-amber-800 hover:text-amber-700">Create one</Link></p>
            </form>
          </div>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">Emmaus is part of The Lost & Found Project. Your study responses are yours; Emmaus guides the process without grading your conclusions or measuring spiritual maturity.</p>
        </section>
      </div>
    </main>
  );
}
