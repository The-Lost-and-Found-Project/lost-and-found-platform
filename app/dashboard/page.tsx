import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import {
  LfpFeatureCard,
  LfpPrimaryLink,
  LfpSecondaryLink,
  LfpSectionHeading,
} from "@/components/ui/LfpDesignSystem";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoundproject.org";
const EMMAUS_FOUNDER_USER_ID = process.env.EMMAUS_FOUNDER_USER_ID?.trim();

type JourneyAction = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const isCareTeam = ["admin", "prayer_team", "pastor"].includes(profile?.role ?? "");
  const isEmmausFounder = Boolean(
    (EMMAUS_FOUNDER_USER_ID && user.id === EMMAUS_FOUNDER_USER_ID) ||
      (!EMMAUS_FOUNDER_USER_ID && user.email?.toLowerCase() === EMMAUS_FOUNDER_EMAIL)
  );

  const [prayerResult, journeyResult, quizResult, notificationResult] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("id, answered, status, created_at")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("journey_entries")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("quiz_attempts")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .is("read_at", null)
      .limit(20),
  ]);

  const prayerRequests = prayerResult.data ?? [];
  const activePrayerCount = prayerRequests.filter(
    (request) => !request.answered && request.status !== "Closed"
  ).length;
  const answeredPrayerCount = prayerRequests.filter(
    (request) => request.answered || request.status === "Answered"
  ).length;
  const hasJourneyEntry = (journeyResult.data?.length ?? 0) > 0;
  const hasQuizAttempt = (quizResult.data?.length ?? 0) > 0;
  const unreadNotificationCount = notificationResult.data?.length ?? 0;

  const journeyAction = chooseJourneyAction({
    activePrayerCount,
    answeredPrayerCount,
    hasJourneyEntry,
    hasQuizAttempt,
    unreadNotificationCount,
  });

  let pendingApplication = false;
  if (!isCareTeam) {
    const { data: application } = await supabase
      .from("prayer_care_applications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    pendingApplication = application?.status === "pending";
  }

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Welcome back, {firstName}.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-indigo-100/75">A place to pray, grow, serve, and stay connected to what God is doing through this community.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ShareButton />
              <LfpSecondaryLink href="/testimonies/submit">Share My Testimony</LfpSecondaryLink>
            </div>
          </div>

        </div>
      </section>

      <div className="lfp-shell pt-8 sm:pt-12">
        <PushPrompt />

        <section className="mb-10 overflow-hidden rounded-[2rem] border border-indigo-200/70 bg-white/92 shadow-2xl">
          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Continue Your Journey</p>
              <h2 className="mt-3 text-3xl font-black">One meaningful next step.</h2>
              <p className="mt-3 leading-7 text-indigo-100/80">This recommendation uses activity already in your account. It does not unlock or expose any Coming Soon features.</p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <JourneyMetric label="Active prayers" value={activePrayerCount} />
                <JourneyMetric label="Answered" value={answeredPrayerCount} />
                <JourneyMetric label="Unread updates" value={unreadNotificationCount} />
                <JourneyMetric label="Journey started" value={hasJourneyEntry ? "Yes" : "Not yet"} />
              </div>
            </div>

            <div className="p-7 sm:p-9">
              <div className="flex items-start justify-between gap-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl ring-1 ring-indigo-100" aria-hidden="true">{journeyAction.icon}</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-800">Recommended</span>
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{journeyAction.eyebrow}</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{journeyAction.title}</h3>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{journeyAction.description}</p>
              <Link href={journeyAction.href} className="lfp-button lfp-button-primary mt-7">{journeyAction.action} →</Link>
            </div>
          </div>
        </section>

        {isEmmausFounder && (
          <section className="mb-10 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-1 shadow-2xl">
            <div className="rounded-[1.8rem] bg-white/[0.05] p-6 text-white sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Private Founder Lab</p>
                  <h2 className="mt-3 text-3xl font-black">Continue building Emmaus</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-indigo-100/70">This private Scripture-discovery environment is visible only to your founder account while it is being developed and reviewed.</p>
                </div>
                <LfpPrimaryLink href="/emmaus/walk">Open Emmaus →</LfpPrimaryLink>
              </div>
            </div>
          </section>
        )}

        {isCareTeam && (
          <section className="mb-10 rounded-[2rem] border border-indigo-100 bg-indigo-50/80 p-6 shadow-sm sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Care Team</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">My Prayer Assignments</h2>
                <p className="mt-2 max-w-2xl leading-7 text-slate-600">Review entrusted requests, record care updates, and keep each person covered in prayer.</p>
              </div>
              <div className="sm:justify-self-end"><LfpPrimaryLink href="/prayer-assignments">View Assignments</LfpPrimaryLink></div>
            </div>
          </section>
        )}

        <section>
          <LfpSectionHeading eyebrow="Your next step" title="Pray. Read. Grow." description="Three clear ways to continue your journey." />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <LfpFeatureCard eyebrow="Pray" title="Prayer Community" description="Submit a request, pray with others, and follow the stories of God's faithfulness." href="/prayer" action="Open Prayer" icon="🙏" />
            <LfpFeatureCard eyebrow="Read" title="Daily Devotions" description="A Scripture-centered rhythm of teaching, reflection, and prayer." href="/devotions" action="Start Reading" icon="📖" />
            <LfpFeatureCard eyebrow="Grow" title="Growth Hub" description="Find Bible learning and formation tools in one place." href="/grow" action="Open Grow" icon="✦" />
          </div>
        </section>

        {!isCareTeam && (
          <section className="mt-10 rounded-[2rem] border border-violet-100 bg-white/85 p-6 shadow-xl sm:p-8">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Serve with us</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Prayer Care Team</h2>
                <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                  {pendingApplication
                    ? "Your application is being reviewed. We will notify you when there is an update."
                    : "Offer prayer, encouragement, and a faithful listening ear to people who need support."}
                </p>
              </div>
              {!pendingApplication && <div className="sm:justify-self-end"><LfpPrimaryLink href="/prayer-care-application">I’m Interested</LfpPrimaryLink></div>}
            </div>
          </section>
        )}

        <section className="mt-14">
          <LfpSectionHeading eyebrow="Community prayer" title="Pray with what is happening now" />
          <div className="mt-7">
            <PrayerWallTicker />
          </div>
        </section>
      </div>
    </main>
  );
}

function chooseJourneyAction({
  activePrayerCount,
  answeredPrayerCount,
  hasJourneyEntry,
  hasQuizAttempt,
  unreadNotificationCount,
}: {
  activePrayerCount: number;
  answeredPrayerCount: number;
  hasJourneyEntry: boolean;
  hasQuizAttempt: boolean;
  unreadNotificationCount: number;
}): JourneyAction {
  if (unreadNotificationCount > 0) {
    return {
      eyebrow: "Stay connected",
      title: "Review your recent updates",
      description: `You have ${unreadNotificationCount} unread ${unreadNotificationCount === 1 ? "notification" : "notifications"}. Review them before they get buried.` ,
      href: "/notifications",
      action: "Open Notifications",
      icon: "🔔",
    };
  }

  if (activePrayerCount > 0 || answeredPrayerCount > 0) {
    return {
      eyebrow: "Remember God's faithfulness",
      title: "Continue your prayer journey",
      description: "Review your active requests, record an update, or mark an answered prayer so your story is not lost.",
      href: "/my-journey",
      action: "Open My Journey",
      icon: "🧭",
    };
  }

  if (!hasJourneyEntry) {
    return {
      eyebrow: "Begin your record",
      title: "Mark your first journey milestone",
      description: "Record a meaningful moment, prayer, decision, or step of obedience and begin building a personal record of God's faithfulness.",
      href: "/my-journey",
      action: "Start My Journey",
      icon: "✦",
    };
  }

  if (!hasQuizAttempt) {
    return {
      eyebrow: "Strengthen biblical knowledge",
      title: "Take your first Bible challenge",
      description: "Choose a category and use each question as a doorway into deeper familiarity with Scripture.",
      href: "/trivia",
      action: "Start Bible Trivia",
      icon: "🧠",
    };
  }

  return {
    eyebrow: "Daily formation",
    title: "Continue in today's devotion",
    description: "Return to Scripture, reflect on the teaching, and carry one clear truth into the rest of your day.",
    href: "/devotions",
    action: "Open Daily Devotions",
    icon: "📖",
  };
}

function JourneyMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold text-indigo-100/60">{label}</p>
    </div>
  );
}
