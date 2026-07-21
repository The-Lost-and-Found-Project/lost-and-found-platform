import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
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
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.trim().split(" ")[0] || null;

  // Only members who aren't already on the care team should see the
  // invitation to apply. If they've already got a pending application, show
  // a status note instead of the call-to-action so it doesn't look like the
  // form is being ignored.
  const isCareTeam =
    profile?.role === "admin" ||
    profile?.role === "prayer_team" ||
    profile?.role === "pastor";

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
                Take a moment to pray, share your testimony, or check in on
                your own journey.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ShareButton />
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path
                    d="M12 20.25c-.36 0-.71-.1-1.02-.28C7.9 18.36 3.5 15.24 3.5 10.5 3.5 7.74 5.74 5.5 8.5 5.5c1.4 0 2.73.6 3.5 1.6.77-1 2.1-1.6 3.5-1.6 2.76 0 5 2.24 5 5 0 4.74-4.4 7.86-7.48 9.47-.31.18-.66.28-1.02.28z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Share My Testimony
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <PushPrompt />

        {!isCareTeam && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Interested in serving on our Prayer Care Team?
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {pendingApplication
                  ? "Your application is being reviewed — we'll notify you here as soon as there's an update."
                  : "Prayer, encouragement, and a listening ear — we'd love to have you."}
              </p>
            </div>
            {!pendingApplication && (
              <Link
                href="/prayer-care-application"
                className="shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
              >
                Apply Now
              </Link>
            )}
          </div>
        )}

        <PrayerWallTicker />
      </section>
    </div>
  );
}
