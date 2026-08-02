import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const paths = [
  {
    title: "Begin John 1",
    description: "Read, observe, follow a Thread, reflect, and pray through the opening of John’s Gospel.",
    href: "/emmaus/john-1",
    status: "Ready",
  },
  {
    title: "Daily Discovery",
    description: "A five-minute encounter with Scripture built around one question and one faithful response.",
    href: "#coming-soon",
    status: "Coming next",
  },
  {
    title: "Kingdom Conversations",
    description: "Explore real-life scenarios, compare perspectives, and reason carefully from Scripture.",
    href: "#coming-soon",
    status: "Planned",
  },
];

export default async function EmmausPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-amber-50 via-white to-indigo-50">
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
            The Lost and Found Project
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
            Welcome to Emmaus
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-650">
            Discover God through His Word. Follow biblical connections, ask better questions, and turn what you learn into faithful action.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
            Your first discovery
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950">What would you like to discover today?</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {paths.map((path, index) => {
              const enabled = index === 0;
              const card = (
                <div className={`h-full rounded-2xl border p-5 transition ${enabled ? "border-indigo-200 bg-indigo-50/60 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-600"}`}>
                      {path.status}
                    </span>
                    <span aria-hidden="true" className="text-xl">{index === 0 ? "🧵" : index === 1 ? "🌅" : "💬"}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-950">{path.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{path.description}</p>
                  {enabled && <p className="mt-5 text-sm font-semibold text-indigo-700">Start discovering →</p>}
                </div>
              );

              return enabled ? <Link key={path.title} href={path.href}>{card}</Link> : <div key={path.title}>{card}</div>;
            })}
          </div>
        </div>

        <blockquote className="mt-8 border-l-4 border-amber-400 pl-5 text-gray-700">
          <p className="text-lg italic">“Didn’t our hearts burn within us as he talked with us on the road and explained the Scriptures to us?”</p>
          <footer className="mt-2 text-sm font-semibold text-gray-900">Luke 24:32, NLT</footer>
        </blockquote>
      </section>
    </div>
  );
}
