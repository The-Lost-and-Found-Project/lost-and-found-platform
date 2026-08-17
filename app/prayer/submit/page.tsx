"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

const inputClass = "mt-2 block min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

export default function SubmitPrayerRequestPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestText, setRequestText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("prayer_categories")
        .select("id, name")
        .order("sort_order");
      setCategories((data as Category[]) ?? []);
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadSignedInDefaults() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("user_settings").select("default_anonymous").eq("user_id", user.id).single(),
      ]);

      if (profile?.full_name) setName(profile.full_name);
      if (user.email) setEmail(user.email);
      if (profile?.full_name || user.email) setPrefilledFromProfile(true);
      if (settings?.default_anonymous) setIsAnonymous(true);
    }
    loadSignedInDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    setSubmitting(true);
    const response = await fetch("/api/prayer-requests/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        categoryId,
        requestText,
        isPublic,
        isAnonymous,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      requestId?: string;
      error?: string;
    };

    if (!response.ok || !result.requestId) {
      setError(result.error ?? "We could not share your prayer request. Please review your information and try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <main className="lfp-page pb-20">
        <section className="bg-slate-950 text-white">
          <div className="lfp-shell py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-4xl ring-1 ring-emerald-300/30" aria-hidden="true">🙏</span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Request Shared</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">You do not have to carry this alone.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Your prayer request has been received and shared according to the privacy choices you selected. Our community would be honored to pray with you.</p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link href="/prayer" className="lfp-button bg-white text-indigo-800 shadow-xl">Return to Prayer</Link>
                <Link href="/prayer/my-requests" className="lfp-button border border-white/20 bg-white/10 text-white">View My Prayer Requests</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.32),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Prayer Request</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Share what is on your heart.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Choose whether your request is shared with the community and whether your name is shown.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          <section>
            <p className="lfp-eyebrow">Your information</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Your name" htmlFor="prayer-name">
                <input id="prayer-name" type="text" required value={name} onChange={(event) => setName(event.target.value)} className={`${inputClass} min-h-11`} />
                {prefilledFromProfile && <p className="mt-2 text-xs leading-5 text-slate-500">Filled from your profile. Change it when submitting on someone else’s behalf.</p>}
              </Field>
              <Field label="Email" htmlFor="prayer-email">
                <input id="prayer-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} min-h-11`} />
              </Field>
              <Field label="Phone number (optional)" htmlFor="prayer-phone">
                <input id="prayer-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} min-h-11`} />
              </Field>
              <Field label="Prayer category" htmlFor="prayer-category">
                <select id="prayer-category" required value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={`${inputClass} min-h-11`}>
                  <option value="">Select a category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <Field label="Your prayer request" htmlFor="prayer-request">
              <textarea id="prayer-request" required rows={7} value={requestText} onChange={(event) => setRequestText(event.target.value)} className={`${inputClass} min-h-11`} />
              <p className="mt-3 text-sm leading-6 text-slate-500">Protect other people’s privacy. Avoid full names or sensitive medical, legal, financial, and contact information unless you have permission to share it.</p>
            </Field>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="lfp-eyebrow">Privacy and care choices</p>
            <div className="mt-5 space-y-3">
              <Choice checked={isPublic} onChange={setIsPublic} title="Allow this request on the public Prayer Wall" description="Approved requests may be viewed and prayed for by signed-in community members." />
              <Choice checked={isAnonymous} onChange={setIsAnonymous} title="Share this request anonymously" description="Your personal information will not appear with the request on the public wall." />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            <h2 className="font-black text-slate-950">Before you share</h2>
            <p className="mt-2">Your request may be reviewed by authorized moderators for safety and privacy. It will never be sold or used outside the ministry of The Lost and Found Project.</p>
            <p className="mt-3">This form is not monitored for emergencies and is not a substitute for professional medical, legal, or mental-health care. If someone is in immediate danger, contact local emergency services.</p>
          </section>

          {error && <div role="alert" aria-live="polite" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-800">{error}</div>}

          <button type="submit" disabled={submitting} className="lfp-button lfp-button-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Sharing your request..." : "Share Prayer Request"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div><label htmlFor={htmlFor} className="block text-sm font-black text-slate-800">{label}</label>{children}</div>;
}

function Choice({ checked, onChange, title, description }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
      <span><span className="block font-black text-slate-950">{title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span></span>
    </label>
  );
}
