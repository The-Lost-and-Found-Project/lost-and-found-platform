"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Need = "support" | "grow" | "connect" | "serve" | "unsure";
type Style = "quiet" | "guided" | "group" | "hands-on" | "flexible";
type Pace = "today" | "this-week" | "ongoing";

type Choice<T extends string> = { value: T; label: string; copy: string };

type Recommendation = {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
};

const needs: Choice<Need>[] = [
  { value: "support", label: "I need support", copy: "Prayer, encouragement, or a safe place to bring what I am carrying." },
  { value: "grow", label: "I want to grow", copy: "Scripture, learning, devotion, and a clearer next step with God." },
  { value: "connect", label: "I want connection", copy: "People, belonging, conversation, and a meaningful place in community." },
  { value: "serve", label: "I am ready to serve", copy: "A practical way to use my gifts and help someone else." },
  { value: "unsure", label: "I am not sure", copy: "I know I want to move forward, but I do not know where to begin." },
];

const styles: Choice<Style>[] = [
  { value: "quiet", label: "Quietly, on my own", copy: "Give me something I can begin privately at my own pace." },
  { value: "guided", label: "With some guidance", copy: "I want structure and a clear path without feeling overwhelmed." },
  { value: "group", label: "With other people", copy: "I grow best through conversation, encouragement, and shared experience." },
  { value: "hands-on", label: "By doing something", copy: "I would rather learn and grow through action and service." },
  { value: "flexible", label: "A mix is fine", copy: "Show me the most sensible next step and let me choose from there." },
];

const paces: Choice<Pace>[] = [
  { value: "today", label: "Something I can do today", copy: "A simple next action I can take right now." },
  { value: "this-week", label: "A next step this week", copy: "Something I can plan for without making a major commitment." },
  { value: "ongoing", label: "An ongoing rhythm", copy: "I am ready to build this into my regular life." },
];

function chooseRecommendation(need: Need, style: Style, pace: Pace): Recommendation {
  if (need === "support") {
    if (style === "quiet") return { eyebrow: "Prayer", title: "Bring the need into Prayer", copy: "Start privately by submitting a prayer request or spending a few minutes carrying someone else in prayer. You do not have to explain everything to take a first step.", href: "/prayer", cta: "Go to Prayer", secondaryHref: "/community", secondaryCta: "See Community" };
    return { eyebrow: "Prayer Pulse", title: "Step into the prayer life of L&F", copy: "Prayer is the clearest starting point when you need support. Share a need, pray with the community, and stay connected as prayer becomes praise and testimony.", href: "/prayer", cta: "Open Prayer", secondaryHref: "/community", secondaryCta: "Visit Community" };
  }

  if (need === "grow") {
    if (style === "quiet") return { eyebrow: "Scripture", title: "Start with Scripture and a focused study", copy: "Begin with a study, devotional, or memory rhythm you can work through privately. When you are ready to go deeper, Emmaus is one step away.", href: "/discover", cta: "Open Discover", secondaryHref: "/auth/emmaus?next=/study", secondaryCta: "Go deeper in Emmaus" };
    if (style === "guided") return { eyebrow: "My Path", title: "Use My Path as your guide", copy: "My Path brings studies, devotions, memory verses, Learning Lab activity, ministry involvement, and relevant next steps together so you do not have to figure out everything at once.", href: "/dashboard", cta: "Open My Path", secondaryHref: "/discover", secondaryCta: "Explore Discover" };
    if (style === "group") return { eyebrow: "Ministry", title: "Grow in a ministry space", copy: "Choose a ministry environment where Scripture, conversation, and shared practice can reinforce each other over time.", href: "/ministries", cta: "Explore Ministries", secondaryHref: "/community", secondaryCta: "Visit Community" };
    return { eyebrow: "Learning Lab", title: "Learn by doing", copy: "Use Bible learning, memory practice, and short study experiences to move from play to understanding and application.", href: "/learn", cta: "Open Learning Lab", secondaryHref: "/discover", secondaryCta: "Browse Discover" };
  }

  if (need === "connect") {
    if (style === "group" || pace === "ongoing") return { eyebrow: "Community", title: "Find a ministry space to belong in", copy: "Connection becomes stronger when it has a purpose. Explore ministry spaces, then participate in prayer, gatherings, encouragement, and shared growth.", href: "/ministries", cta: "Find a Ministry", secondaryHref: "/community", secondaryCta: "Open Community" };
    return { eyebrow: "Community", title: "Start with the shared life of L&F", copy: "See prayer, praise, testimony, and encouragement in one place. You can begin by simply showing up and participating in one meaningful way.", href: "/community", cta: "Open Community", secondaryHref: "/ministries", secondaryCta: "Explore Ministries" };
  }

  if (need === "serve") {
    if (style === "hands-on" || pace !== "today") return { eyebrow: "Serve", title: "Explore where your gifts can become useful", copy: "Start with the ministry directory and look for the environment whose purpose and people fit the kind of service you are ready to offer.", href: "/ministries", cta: "Explore Ministries", secondaryHref: "/community", secondaryCta: "See Community" };
    return { eyebrow: "Serve today", title: "Begin by carrying someone else's need", copy: "Service does not have to begin with a formal role. Pray for someone, encourage a testimony, or participate in the life of the community today.", href: "/prayer", cta: "Pray for Someone", secondaryHref: "/community", secondaryCta: "Open Community" };
  }

  if (style === "group") return { eyebrow: "Connection", title: "Start with people, not a program", copy: "Visit the ministry directory and choose the space that feels closest to the kind of community you need right now.", href: "/ministries", cta: "Explore Ministries", secondaryHref: "/community", secondaryCta: "Open Community" };
  if (style === "quiet") return { eyebrow: "Discover", title: "Start with one useful resource", copy: "Choose a study, devotional, Bible-learning activity, or guided collection. You can move deeper when you are ready.", href: "/discover", cta: "Open Discover", secondaryHref: "/dashboard", secondaryCta: "See My Path" };
  return { eyebrow: "My Path", title: "Let My Path narrow the next step", copy: "You do not need a perfect plan. Start with the next faithful action already available to you and let your path become clearer through participation.", href: "/dashboard", cta: "Open My Path", secondaryHref: "/discover", secondaryCta: "Explore Discover" };
}

export default function MinistryCompassClient() {
  const [need, setNeed] = useState<Need | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);
  const step = need === null ? 1 : style === null ? 2 : pace === null ? 3 : 4;
  const recommendation = useMemo(() => need && style && pace ? chooseRecommendation(need, style, pace) : null, [need, style, pace]);

  const reset = () => { setNeed(null); setStyle(null); setPace(null); };

  return <div className="space-y-6">
    <div className="flex items-center gap-2" aria-label={`Step ${Math.min(step,3)} of 3`}>
      {[1,2,3].map(n => <div key={n} className={`h-2 flex-1 rounded-full ${n <= Math.min(step,3) ? "bg-blue-600" : "bg-slate-200"}`} />)}
    </div>

    {step === 1 && <CompassStep title="What do you need most right now?" subtitle="Choose the answer that is closest. This is guidance, not a judgment about your faith or spiritual maturity." choices={needs} onChoose={setNeed} />}
    {step === 2 && <CompassStep title="How would you prefer to engage?" subtitle="There is no better answer here. Choose what feels realistic for this season." choices={styles} onChoose={setStyle} onBack={() => setNeed(null)} />}
    {step === 3 && <CompassStep title="What kind of next step feels realistic?" subtitle="The goal is movement, not pressure. Pick the pace you can actually follow." choices={paces} onChoose={setPace} onBack={() => setStyle(null)} />}

    {recommendation && <section className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl">
      <div className="bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-9">
        <p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">{recommendation.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{recommendation.title}</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{recommendation.copy}</p>
      </div>
      <div className="p-7 sm:p-9">
        <p className="text-sm font-bold text-slate-500">This suggestion comes from the choices you made. It is deterministic guidance, not AI discernment, counseling, or an assessment of spiritual maturity.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={recommendation.href} className="lfp-button lfp-button-primary">{recommendation.cta} →</Link>
          {recommendation.secondaryHref && <Link href={recommendation.secondaryHref} className="lfp-button lfp-button-secondary">{recommendation.secondaryCta}</Link>}
          <button type="button" onClick={reset} className="lfp-button border border-slate-200 bg-white text-slate-700">Start over</button>
        </div>
      </div>
    </section>}
  </div>;
}

function CompassStep<T extends string>({ title, subtitle, choices, onChoose, onBack }: { title: string; subtitle: string; choices: Choice<T>[]; onChoose: (value: T) => void; onBack?: () => void }) {
  return <section className="lfp-card p-6 sm:p-8">
    <p className="lfp-eyebrow">Ministry Compass</p>
    <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
    <p className="mt-3 max-w-3xl leading-7 text-slate-600">{subtitle}</p>
    <div className="mt-6 grid gap-3 md:grid-cols-2">{choices.map(choice => <button key={choice.value} type="button" onClick={() => onChoose(choice.value)} className="rounded-[1.4rem] border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><span className="block text-lg font-black text-slate-950">{choice.label}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{choice.copy}</span></button>)}</div>
    {onBack && <button type="button" onClick={onBack} className="mt-6 text-sm font-black text-slate-500 hover:text-slate-950">← Back</button>}
  </section>;
}
