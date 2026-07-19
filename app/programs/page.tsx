import Link from "next/link";

const programs = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Your home base for account activity and updates.",
  },
  {
    href: "/prayer",
    title: "Prayer Wall",
    description: "See prayer requests from the community and pray for others.",
  },
  {
    href: "/prayer/submit",
    title: "Submit a Prayer",
    description: "Share a prayer request with the care team and community.",
  },
  {
    href: "/my-journey",
    title: "My Journey",
    description: "Track the prayers you've submitted and how they're progressing.",
  },
  {
    href: "/studies",
    title: "Studies",
    description: "Group Bible studies and discipleship resources.",
  },
  {
    href: "/mentoring",
    title: "Mentoring",
    description: "Connect mentors and mentees for ongoing growth.",
  },
  {
    href: "/events",
    title: "Events",
    description: "Stay up to date on upcoming ministry events.",
  },
];

export default function ProgramsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Programs
        </h1>
        <p className="mt-2 text-gray-600">
          Everything The Lost and Found Project offers, all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Link
            key={program.href}
            href={program.href}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />
            <h2 className="text-lg font-semibold text-gray-900">
              {program.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{program.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600">
              Open
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
