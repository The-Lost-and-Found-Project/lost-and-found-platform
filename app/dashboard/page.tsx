import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import { LfpFeatureCard, LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Welcome, {firstName}. You belong here.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">A Christian community where people bring needs before God, celebrate His faithfulness, and share stories that help others find hope.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/prayer/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Request Prayer</Link>
            <ShareButton />
          </div>
        </div>
      </section>

      <div className="lfp-shell pt-8 sm:pt-12">
        <PushPrompt />

        <section>
          <LfpSectionHeading eyebrow="Community" title="Pray. Praise. Testify." description="Three simple ways to bring needs before God, celebrate what He is doing, and encourage others through your story." />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <LfpFeatureCard eyebrow="Bring your needs" title="Prayer" description="Request prayer or pause to pray for someone in the community." href="/prayer" action="Open Prayer" icon="🙏" />
            <LfpFeatureCard eyebrow="Celebrate God" title="Praise" description="Share and read reminders of answered prayer and God's faithfulness." href="/praise" action="Open Praise" icon="🙌" />
            <LfpFeatureCard eyebrow="Share hope" title="Testimonies" description="Read and share stories of redemption, healing, perseverance, and grace." href="/testimonies" action="Read Testimonies" icon="💬" />
          </div>
        </section>

        <section className="mt-14">
          <LfpSectionHeading eyebrow="Community prayer" title="Pray with what is happening now" description="Scan current needs, open a request, and take a moment to pray." />
          <div className="mt-7"><PrayerWallTicker /></div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Support the ministry</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Help The Lost and Found Project serve more people.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">Giving is always optional. Community participation does not require a donation.</p>
            </div>
            <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white">Give Securely</a>
          </div>
        </section>
      </div>
    </main>
  );
}
