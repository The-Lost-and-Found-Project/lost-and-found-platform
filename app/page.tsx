import Link from "next/link";
import { redirect } from "next/navigation";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import TestimonyTicker from "@/components/TestimonyTicker";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // The app's PWA manifest always launches at "/" (start_url), so anyone who
  // closes and reopens the installed app lands here first. Without this
  // check, a signed-in visitor would see the public marketing page instead
  // of their dashboard every time they reopened the app.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
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

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100">
              A community that prays for you, and with you
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              You&rsquo;re Not Walking This Alone
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              The Lost and Found Project is a ministry community built on
              prayer, encouragement, and real support. Share what&rsquo;s on
              your heart, see how others are being lifted up, and read
              testimonies from people who&rsquo;ve walked through hard seasons
              and found hope. Whether you need prayer today or want to be the
              one praying for someone else, there&rsquo;s a place for you
              here.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <ReasonCard
              title="Pray Together"
              description="Submit a request in seconds and see how our community is lifting each other up in real time."
            />
            <ReasonCard
              title="Find Encouragement"
              description="Read testimonies from people who've experienced healing, provision, and hope — and send them a note of thanks."
            />
            <ReasonCard
              title="Care for Others"
              description="Join our care team to respond to prayer requests and be part of someone's story of restoration."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-3 text-gray-600">
            Getting started takes less than a minute.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <HowItWorksStep
            number="1"
            title="Create Your Account"
            description="Tell us a little about yourself so we can connect you with the right people, safely and comfortably."
          />
          <HowItWorksStep
            number="2"
            title="Share or Support"
            description="Submit a prayer request whenever you need one, or browse the Prayer Wall and lift up someone else's."
          />
          <HowItWorksStep
            number="3"
            title="Stay Connected"
            description="Track your own journey, get notified when someone prays for you, and grow alongside a caring community."
          />
        </div>

        <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 text-center sm:p-8">
          <h3 className="text-lg font-semibold text-gray-900">
            Ready to join the community?
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Create a free account to submit prayer requests, follow your
            journey, and connect with people who care.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Sign In
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

function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
        {number}
      </span>
      <h3 className="mt-3 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function ReasonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
