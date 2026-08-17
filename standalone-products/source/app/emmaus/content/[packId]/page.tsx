import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmmausContentPack } from "@/lib/emmaus/content-packs/registry";

export default async function EmmausContentPackPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  const pack = getEmmausContentPack(packId);
  if (!pack) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/60 pb-28 lg:pb-12">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href="/emmaus/bible" className="text-sm font-black text-amber-300 hover:text-amber-200">← Back to Bible Library</Link>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-indigo-100">{pack.book} {pack.chapter}</span>
                <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-950">{pack.status}</span>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{pack.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">{pack.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Metric value={pack.discoveries.length} label="Discoveries" />
              <Metric value={pack.rabbitTrails.length} label="Trails" />
              <Metric value={pack.groupGuide.sessionMinutes} label="Minutes" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Interactive studies</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choose a discovery</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">Each discovery guides you through prayer, observation, probing questions, optional clues, application, journaling, and a closing response.</p>

          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {pack.discoveries.map((discovery, index) => (
              <article key={discovery.id} className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 bg-slate-50/80 p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Discovery {index + 1} • {discovery.passage}</p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{discovery.title}</h3>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-600 ring-1 ring-slate-200">{discovery.estimatedMinutes} min</span>
                  </div>
                  <p className="mt-4 leading-7 text-slate-600">{discovery.subtitle}</p>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Summary title="Opening question" text={discovery.openingQuestion} />
                    <Summary title="Application" text={discovery.applicationPrompt} />
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Skills practiced</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {discovery.skillFocus.map((skill) => (
                        <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold capitalize text-indigo-700 ring-1 ring-indigo-100">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <Link
                      href={`/emmaus/content/${pack.id}/discovery/${discovery.id}`}
                      className="flex min-h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-5 py-3 font-black text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                    >
                      Start Discovery →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-8 xl:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Connected exploration</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Rabbit Trails</h2>
            <div className="mt-6 space-y-5">
              {pack.rabbitTrails.map((trail) => (
                <article key={trail.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-violet-700">{trail.theme}</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">{trail.title}</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">Starts at {trail.startingPassage}</p>
                  <div className="mt-5 space-y-3">
                    {trail.stops.map((stop, index) => (
                      <div key={`${trail.id}-${stop.passage}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{index + 1}</span>
                          <div>
                            <p className="font-black text-slate-950">{stop.passage} — {stop.purpose}</p>
                            <p className="mt-1 leading-6 text-slate-600">{stop.question}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <GuideCard title="Mentor Guide" sections={[
              { title: "Watch For", items: pack.mentorGuide.watchFor },
              { title: "Conversation Prompts", items: pack.mentorGuide.conversationPrompts },
              { title: "Prayer Prompts", items: pack.mentorGuide.prayerPrompts },
            ]} />

            <GuideCard title={`${pack.groupGuide.sessionMinutes}-Minute Group Guide`} sections={[
              { title: "Discussion Questions", items: pack.groupGuide.discussionQuestions },
              { title: "Leader Guardrails", items: pack.groupGuide.leaderGuardrails },
            ]}>
              <div className="space-y-3">
                {pack.groupGuide.flow.map((step, index) => (
                  <div key={`${step.segment}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[auto_1fr]">
                    <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-indigo-50 px-2 text-sm font-black text-indigo-700">{step.minutes}m</span>
                    <div>
                      <p className="font-black text-slate-950">{step.segment}</p>
                      <p className="mt-1 leading-6 text-slate-600">{step.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GuideCard>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-center"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-indigo-100/60">{label}</p></div>;
}

function Summary({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{title}</p><p className="mt-2 leading-6 text-slate-700">{text}</p></div>;
}

function GuideCard({ title, sections, children }: { title: string; sections: Array<{ title: string; items: string[] }>; children?: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Facilitator support</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
      <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        {children}
        {sections.map((section) => (
          <div key={section.title} className="mt-7 first:mt-0">
            <h3 className="text-lg font-black text-slate-950">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 leading-7 text-slate-700">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
