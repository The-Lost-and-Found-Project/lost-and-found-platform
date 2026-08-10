import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LfpFeatureCard, LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Community</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">Faith is personal, but it was never meant to be isolated.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Share what God is doing, encourage someone else, and find meaningful ways to serve.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <LfpSectionHeading eyebrow="Available now" title="Connect with the community" />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <LfpFeatureCard eyebrow="Stories of grace" title="Testimonies" description="Read and share stories of redemption, growth, healing, and God's faithfulness." href="/testimonies" action="View Testimonies" icon="💬" />
          <LfpFeatureCard eyebrow="Celebrate" title="Praise Reports" description="Celebrate answered prayer and encourage others with what God has done." href="/praise" action="Open Praise" icon="🙌" />
          <LfpFeatureCard eyebrow="Serve" title="Prayer Care" description="Learn how to serve people through prayer, encouragement, and faithful follow-up." href="/prayer-care-application" action="Learn More" icon="🤲" />
        </div>

        <section className="mt-12">
          <details className="lfp-card group overflow-hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Coming later</span>
                <span className="mt-1 block text-lg font-black text-slate-950">Mentoring and events</span>
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6">
              <p className="max-w-3xl leading-7 text-slate-600">These ministry experiences will open after the systems, training, and safeguards are ready.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">🤝</span>
                    <h3 className="text-lg font-black text-slate-950">Mentoring</h3>
                  </div>
                  <p className="mt-3 leading-7 text-slate-600">Guided relationships centered on prayer, Scripture, accountability, and growth, with secure matching, shared goals, and a healthy meeting rhythm.</p>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">📅</span>
                    <h3 className="text-lg font-black text-slate-950">Events</h3>
                  </div>
                  <p className="mt-3 leading-7 text-slate-600">Gatherings, classes, workshops, and volunteer opportunities with registration, reminders, and event details in one place.</p>
                </article>
              </div>
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
