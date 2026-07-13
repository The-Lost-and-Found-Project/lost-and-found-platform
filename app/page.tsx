import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            The Lost and Found Project
          </h1>
          <p className="mt-6 text-base text-gray-600 sm:text-lg">
            A ministry platform for prayer, discipleship, mentoring, and community events. This starter is the foundation for what we will build together.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-md bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              Get Started
            </Link>
            <Link
              href="/events"
              className="rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              View Events
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
