import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerCareApplicationClient from "@/components/PrayerCareApplicationClient";

export default async function PrayerCareApplicationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: existingApplication } = await supabase
    .from("prayer_care_applications")
    .select("id, status, created_at, reviewed_at, review_note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Prayer Care Team</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Serve with compassion, consistency, and care.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Learn more about the responsibility of Prayer Care and review or submit your application below.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <InfoCard icon="🙏" title="Pray faithfully" text="Treat every assigned request with attention, consistency, and respect." />
          <InfoCard icon="♡" title="Encourage wisely" text="Offer compassionate support while honoring the limits of the role." />
          <InfoCard icon="🛡" title="Protect trust" text="Follow confidentiality, moderation, and privacy safeguards at all times." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 shadow-2xl">
          <PrayerCareApplicationClient
            currentRole={profile?.role ?? "member"}
            existingApplication={existingApplication ?? null}
          />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article className="lfp-card p-6">
      <span className="text-3xl" aria-hidden="true">{icon}</span>
      <h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{text}</p>
    </article>
  );
}
