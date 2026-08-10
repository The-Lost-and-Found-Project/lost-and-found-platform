import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You’re Invited | The Lost and Found Project",
  description: "Discover a community for prayer, encouragement, spiritual growth, and faithful care.",
};

const memberWays = [
  "Share prayer requests publicly or privately",
  "Pray with people through the Prayer Wall",
  "Follow your prayer journey and celebrate answered prayer",
  "Read devotions, testimonies, and Scripture-centered growth resources",
];

const careTeamWays = [
  "Receive prayer requests entrusted to you",
  "Pray faithfully and record meaningful care steps",
  "Follow up when someone asks to be contacted",
  "Escalate needs to care leaders when additional support is appropriate",
];

export default function ShareLandingPage() {
  return (
    <div className="lfp-page bg-white pb-16">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.4),transparent_32rem),radial-gradient(circle_at_8%_100%,rgba(245,190,67,0.22),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">You’re invited</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">You don’t have to walk alone.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/80 sm:text-xl">
            The Lost and Found Project is a faith-centered community where people can ask for prayer, pray with others, grow through Scripture, and receive thoughtful encouragement along the way.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Join the Community</Link>
            <Link href="/login" className="lfp-button border border-white/20 bg-white/10 text-white hover:bg-white/15">I Already Have an Account</Link>
          </div>
          <p className="mt-4 text-sm text-indigo-100/65">Joining is free. Begin as a community member and serve at your own pace.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start" aria-labelledby="what-we-do-title">
          <div>
            <p className="lfp-eyebrow">What we do</p>
            <h2 id="what-we-do-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Prayer that leads to faithful care.</h2>
          </div>
          <div className="space-y-4 text-lg leading-8 text-slate-600">
            <p>We create a welcoming place for people to share what they are carrying and know that someone is praying with them.</p>
            <p>Members can participate quietly, share their own journey, or grow into serving others. Prayer Care Team service is optional and begins only after an application and human review.</p>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="choose-path-title">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Your place in the community</p>
            <h2 id="choose-path-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Join as a member. Serve when you’re ready.</h2>
            <p className="mt-3 leading-7 text-slate-600">Everyone begins with the same community account. Prayer Care Team access adds ministry responsibilities without taking away the regular member experience.</p>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <RoleCard
              eyebrow="For every member"
              title="Pray, read, and grow"
              description="Use the community for your own prayer journey and encourage others in ways that feel comfortable to you."
              items={memberWays}
              accent="indigo"
            />
            <RoleCard
              eyebrow="Optional service role"
              title="Prayer Care Team"
              description="Apply when you feel called to provide consistent prayer and follow-up within a supported care workflow."
              items={careTeamWays}
              accent="amber"
            />
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-indigo-100 bg-indigo-50/70 p-6 sm:p-9" aria-labelledby="care-expectation-title">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">A thoughtful care experience</p>
              <h2 id="care-expectation-title" className="mt-2 text-2xl font-black text-slate-950">You choose what to share.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Prayer requests can remain private or be considered for the public Prayer Wall. When personal care is requested, the Prayer Care Team uses clear ownership and follow-up steps so requests are not left unattended.</p>
            </div>
            <Link href="/signup" className="lfp-button lfp-button-primary lg:justify-self-end">Create My Account →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function RoleCard({
  eyebrow,
  title,
  description,
  items,
  accent,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  accent: "indigo" | "amber";
}) {
  const accentClasses = accent === "amber"
    ? "border-amber-200 bg-amber-50/60 text-amber-900"
    : "border-indigo-200 bg-indigo-50/60 text-indigo-800";

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <p className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${accentClasses}`}>{eyebrow}</p>
      <h3 className="mt-5 text-2xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-6 text-slate-700">
            <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black ${accent === "amber" ? "bg-amber-100 text-amber-900" : "bg-indigo-100 text-indigo-800"}`} aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
