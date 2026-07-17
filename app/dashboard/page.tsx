import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import TestimonyTicker from "@/components/TestimonyTicker";
import ShareButton from "@/components/ShareButton";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.trim().split(" ")[0] || null;

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100">
                Welcome back
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {firstName ? `Hi, ${firstName}` : "Hi there"}
              </h1>
              <p className="mt-3 text-gray-600">
                Here&rsquo;s what&rsquo;s happening in our community today.
                Take a moment to pray, share an encouragement, or check in on
                your own journey.
              </p>
            </div>
            <ShareButton />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/prayer/submit"
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Submit a Prayer
            </Link>
            <Link
              href="/prayer"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              View Prayer Wall
            </Link>
            <Link
              href="/my-journey"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              My Journey
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <PrayerWallTicker />
        <TestimonyTicker />
      </section>
    </div>
  );
}
