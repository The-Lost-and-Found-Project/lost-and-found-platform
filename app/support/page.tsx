import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const helpGroups = [
  {
    title: "Prayer",
    icon: "🙏",
    items: [
      { label: "Submit a prayer request", href: "/prayer/submit" },
      { label: "Pray with the community", href: "/prayer" },
      { label: "Review your prayer journey", href: "/my-journey" },
      { label: "Join the Prayer Care Team", href: "/prayer-care-application" },
    ],
  },
  {
    title: "Spiritual Growth",
    icon: "📖",
    items: [
      { label: "Open Daily Devotions", href: "/devotions" },
      { label: "Play Bible Trivia", href: "/trivia" },
      { label: "Record a journey milestone", href: "/my-journey" },
      { label: "Manage your faith profile", href: "/profile" },
    ],
  },
  {
    title: "Community",
    icon: "♡",
    items: [
      { label: "Read testimonies", href: "/testimonies" },
      { label: "Share your testimony", href: "/testimonies/submit" },
      { label: "Read praise reports", href: "/praise" },
      { label: "Share a praise report", href: "/praise/submit" },
    ],
  },
  {
    title: "Account",
    icon: "👤",
    items: [
      { label: "Update your profile", href: "/profile" },
      { label: "Manage notification settings", href: "/settings" },
      { label: "Review notifications", href: "/notifications" },
      { label: "Send feedback", href: "/feedback" },
    ],
  },
];

const faqs = [
  {
    question: "Can I submit a prayer request anonymously?",
    answer: "Yes. The prayer submission flow includes privacy choices so you can decide how your request is displayed. Moderation and role-based access protections remain in place.",
  },
  {
    question: "Who can see my private information?",
    answer: "Public community areas display only information approved for publication. Sensitive request details are restricted to authorized care-team and administrative workflows.",
  },
  {
    question: "How do I update or record an answered prayer?",
    answer: "Open My Journey to review your prayer history, add updates, and record answered prayers so the story of God's faithfulness is not lost.",
  },
  {
    question: "Why can’t I open Mentoring, Events, or the Study Library yet?",
    answer: "Those experiences are intentionally marked Coming Soon. They remain unavailable until the workflows, training, privacy safeguards, and content are ready.",
  },
  {
    question: "How do I report a bug or suggest a feature?",
    answer: "Use the feedback form below. Include what you were doing, what you expected, and what happened. Screenshots are helpful when available.",
  },
];

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.32),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Help & Support</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Find the next answer without hitting a dead end.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Use the shortcuts, frequently asked questions, and feedback tools below to resolve common issues and reach the right part of the platform.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Quick help</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choose the area you need</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Every link below leads to a currently available workflow.</p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {helpGroups.map((group) => (
              <article key={group.title} className="lfp-card p-6 sm:p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{group.icon}</span>
                  <h3 className="text-2xl font-black text-slate-950">{group.title}</h3>
                </div>
                <div className="mt-5 space-y-2">
                  {group.items.map((item) => (
                    <Link key={item.href + item.label} href={item.href} className="group flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900">
                      <span>{item.label}</span>
                      <span className="text-indigo-700 transition group-hover:translate-x-1" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Frequently asked questions</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Common questions</h2>
          </div>

          <div className="mt-7 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="lfp-card group p-6 open:border-indigo-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-black text-slate-950">
                  <span>{faq.question}</span>
                  <span className="text-2xl text-indigo-700 transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-4 max-w-4xl border-t border-slate-100 pt-4 leading-8 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Still need help?</p>
              <h2 className="mt-3 text-3xl font-black">Tell us what happened.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-indigo-100/80">Use the existing feedback workflow for account help, bug reports, unclear wording, or feature suggestions. Include the page and action involved whenever possible.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/feedback" className="lfp-button bg-white text-indigo-800 shadow-xl">Contact Support</Link>
              <Link href="/feedback" className="lfp-button border border-white/25 bg-white/10 text-white">Report a Bug</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
