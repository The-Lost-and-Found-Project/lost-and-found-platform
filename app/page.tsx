import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            The Lost and Found Project
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            A ministry platform for prayer, discipleship, mentoring, and
            community events.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              View Events
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="Prayer" description="Submit and follow prayer requests within the community." />
          <FeatureCard title="Studies" description="Access group Bible studies and discipleship resources." />
          <FeatureCard title="Mentoring" description="Connect mentors and mentees for ongoing growth." />
          <FeatureCard title="Events" description="Stay up to date on upcoming ministry events." />
          <FeatureCard title="Dashboard" description="A home base for your account and activity." />
          <FeatureCard title="Admin" description="Tools for ministry staff to manage the platform." />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
