import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LfpComingSoonCard, LfpFeatureCard, LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoundproject.org";
const EMMAUS_FOUNDER_USER_ID = process.env.EMMAUS_FOUNDER_USER_ID?.trim();

export default async function GrowPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isEmmausFounder = Boolean(
    (EMMAUS_FOUNDER_USER_ID && user.id === EMMAUS_FOUNDER_USER_ID) ||
    (!EMMAUS_FOUNDER_USER_ID && user.email?.toLowerCase() === EMMAUS_FOUNDER_EMAIL)
  );

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Grow</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">Go deeper without getting overwhelmed.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Choose one clear next step for Scripture, reflection, and spiritual growth.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <LfpSectionHeading eyebrow="Available now" title="Ways to grow today" />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <LfpFeatureCard eyebrow="Daily rhythm" title="Devotions" description="Begin a seven-day devotional journey rooted in Scripture, teaching, reflection, and prayer." href="/devotions" action="Start Reading" icon="📖" />
          <LfpFeatureCard eyebrow="Knowledge" title="Bible Trivia" description="Strengthen biblical knowledge through engaging questions across six categories." href="/trivia" action="Play Now" icon="🧠" />
          <LfpFeatureCard eyebrow="Your story" title="My Journey" description="Reflect on the ways God has been shaping your faith and testimony." href="/my-journey" action="Open Journey" icon="🧭" />
          {isEmmausFounder && (
            <LfpFeatureCard eyebrow="Private founder lab" title="Emmaus" description="Continue reviewing the private Scripture-discovery experience while it remains hidden from other users." href="/emmaus/walk" action="Open Emmaus" icon="✦" />
          )}
        </div>

        <section className="mt-14">
          <LfpSectionHeading eyebrow="Coming soon" title="Deeper formation tools" description="These experiences remain unavailable until they are complete and ready to serve people well." />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <LfpComingSoonCard title="Study Library" description="A curated collection of individual, group, marriage, men's, and women's studies." icon="📚" planned={["Guided studies", "Leader editions", "Progress tracking"]} />
            <LfpComingSoonCard title="Learning Paths" description="Structured growth journeys that connect Scripture, reflection, practice, and community." icon="🛤️" planned={["Personalized paths", "Milestones", "Recommendations"]} />
          </div>
        </section>
      </div>
    </main>
  );
}
