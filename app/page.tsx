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
    </div>
  );
}
