import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyJourneyClient from "@/components/MyJourneyClient";

export default async function MyJourneyPage({
  searchParams,
}: {
  searchParams: Promise<{ checkin?: string }>;
}) {
  const { checkin } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, date_of_salvation, date_of_baptism")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select(
      "id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status, answered, answered_update, archived, last_action_at, checkin_notified_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("prayer_categories")
    .select("id, name");

  const { data: entries } = await supabase
    .from("journey_entries")
    .select("id, entry_type, title, notes, entry_date, created_at")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  const { data: testimony } = await supabase
    .from("testimonies")
    .select("content_text, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const categoryMap: Record<string, string> = {};
  (categories ?? []).forEach((category) => {
    categoryMap[category.id] = category.name;
  });

  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const prayerCount = requests?.length ?? 0;
  const answeredCount = requests?.filter((request) => request.answered || request.status === "Answered").length ?? 0;
  const milestoneCount = entries?.length ?? 0;

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">My Journey</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Remember the road God has walked with you, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Your prayers, milestones, testimony, and moments of answered prayer form a living record of God's faithfulness.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <JourneyStat label="Prayer requests" value={String(prayerCount)} />
            <JourneyStat label="Answered prayers" value={String(answeredCount)} />
            <JourneyStat label="Recorded milestones" value={String(milestoneCount)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <JourneyValue icon="🙏" title="Track prayer" text="Review requests, updates, answered prayers, and check-ins without losing the story behind them." />
          <JourneyValue icon="🧭" title="Mark milestones" text="Record meaningful moments of growth, surrender, calling, restoration, and obedience." />
          <JourneyValue icon="✦" title="Tell the story" text="Keep your testimony connected to the broader journey God is still writing." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 shadow-2xl">
          <MyJourneyClient
            email={user.email ?? ""}
            dateOfSalvation={profile?.date_of_salvation ?? ""}
            dateOfBaptism={profile?.date_of_baptism ?? ""}
            requests={requests ?? []}
            categoryMap={categoryMap}
            entries={entries ?? []}
            testimony={testimony ?? null}
            checkinRequestId={checkin ?? null}
          />
        </section>
      </div>
    </main>
  );
}

function JourneyStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/60">{label}</p></div>;
}

function JourneyValue({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
