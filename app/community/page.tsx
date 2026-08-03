import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LfpComingSoonCard, LfpFeatureCard, LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

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

        <section className="mt-14">
          <LfpSectionHeading eyebrow="Coming soon" title="Deeper ways to belong" description="These ministry experiences remain unavailable until the systems, training, and safeguards are ready." />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <LfpComingSoonCard title="Mentoring" description="A guided relationship between mentors and mentees centered on prayer, Scripture, accountability, and growth." icon="🤝" planned={["Secure matching", "Shared goals", "Meeting rhythm"]} />
            <LfpComingSoonCard title="Events" description="One place for gatherings, classes, workshops, volunteer opportunities, and community registration." icon="📅" planned={["Registration", "Reminders", "Event details"]} />
          </div>
        </section>
      </div>
    </main>
  );
}
