import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmmausDiscovery } from "@/lib/emmaus/content-packs/registry";

const SKILLS = ["observe", "context", "connect", "probe", "test", "theology", "reflect", "apply"] as const;
type Skill = (typeof SKILLS)[number];

type ProgressRow = {
  discovery_id: string;
  responses: Record<string, string> | null;
  revealed_clues: number;
  is_completed: boolean;
};

const meta: Record<Skill, { label: string; description: string }> = {
  observe: { label: "Observation", description: "Noticing words, structure, repetition, contrast, and explicit claims." },
  context: { label: "Context", description: "Reading verses within their literary, historical, and canonical setting." },
  connect: { label: "Connections", description: "Tracing cross-references, themes, echoes, and related passages." },
  probe: { label: "Questioning", description: "Asking careful questions that expose assumptions and deepen attention." },
  test: { label: "Testing", description: "Checking conclusions against the text and the wider witness of Scripture." },
  theology: { label: "Theology", description: "Forming text-supported conclusions about God, Christ, humanity, and redemption." },
  reflect: { label: "Reflection", description: "Recognizing how Scripture addresses motives, fears, beliefs, and worship." },
  apply: { label: "Application", description: "Turning understanding into specific obedience and faithful practice." },
};

export default async function LearningProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("emmaus_discovery_progress")
      .select("discovery_id, responses, revealed_clues, is_completed")
      .eq("user_id", user.id),
  ]);

  const progress = (rows ?? []) as ProgressRow[];
  const scores = Object.fromEntries(SKILLS.map((skill) => [skill, 0])) as Record<Skill, number>;
  const exposure = Object.fromEntries(SKILLS.map((skill) => [skill, 0])) as Record<Skill, number>;

  let totalResponses = 0;
  let totalWords = 0;
  let totalClues = 0;

  for (const row of progress) {
    const resolved = getEmmausDiscovery(row.discovery_id);
    if (!resolved) continue;

    const responses = row.responses ?? {};
    const values = Object.values(responses).filter((value) => value?.trim());
    const words = values.join(" ").trim().split(/\s+/).filter(Boolean).length;
    const engagement = Math.min(1, 0.35 + values.length * 0.1 + words / 500);
    const completion = row.is_completed ? 1 : 0.55;
    const independence = Math.max(0.72, 1 - row.revealed_clues * 0.05);
    const evidence = engagement * completion * independence;

    totalResponses += values.length;
    totalWords += words;
    totalClues += row.revealed_clues;

    for (const item of resolved.discovery.skillFocus) {
      if (!SKILLS.includes(item as Skill)) continue;
      exposure[item as Skill] += 1;
      scores[item as Skill] += evidence;
    }
  }

  const skills = SKILLS.map((skill) => ({
    skill,
    ...meta[skill],
    exposure: exposure[skill],
    percentage: exposure[skill] ? Math.min(100, Math.round((scores[skill] / exposure[skill]) * 100)) : 0,
  }));

  const evidenced = skills.filter((item) => item.exposure > 0);
  const strongest = [...evidenced].sort((a, b) => b.percentage - a.percentage)[0];
  const growth = [...evidenced].sort((a, b) => a.percentage - b.percentage)[0];
  const completed = progress.filter((item) => item.is_completed).length;
  const averageWords = totalResponses ? Math.round(totalWords / totalResponses) : 0;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-28 text-white lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <Link href="/emmaus/walk" className="text-sm font-black text-amber-300">← Back to Walk</Link>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Emmaus Learning Profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">How you are learning, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">This profile uses your actual discovery work to identify study strengths and growth opportunities. It is not a measure of spiritual maturity.</p>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={completed} label="Completed discoveries" />
          <Metric value={totalResponses} label="Written responses" />
          <Metric value={averageWords} label="Average words" />
          <Metric value={totalClues} label="Clues used" />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <Insight eyebrow="Current strength" title={strongest?.label ?? "More evidence needed"} description={strongest?.description ?? "Complete an interactive discovery to begin building the profile."} />
          <Insight eyebrow="Growth opportunity" title={growth?.label ?? "More evidence needed"} description={growth ? `Emmaus can recommend discoveries that provide more practice in ${growth.label.toLowerCase()}.` : "The profile becomes more useful as your completed work grows."} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Skill evidence</p>
          <h2 className="mt-2 text-3xl font-black">Your study pattern</h2>
          <p className="mt-3 max-w-3xl text-indigo-100/65">Percentages reflect completion, written engagement, and independent work within discoveries that exercise each skill.</p>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {skills.map((item) => (
              <article key={item.skill} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-indigo-100/60">{item.description}</p>
                  </div>
                  <span className="text-2xl font-black text-amber-300">{item.percentage}%</span>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-amber-300" style={{ width: `${item.percentage}%` }} />
                </div>
                <p className="mt-3 text-xs font-bold text-indigo-100/45">Evidence from {item.exposure} {item.exposure === 1 ? "discovery" : "discoveries"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">How Emmaus will adapt</p>
            <h2 className="mt-2 text-3xl font-black">Guidance that changes as you grow</h2>
            <div className="mt-6 space-y-4">
              <Adaptation title="Fewer unnecessary clues" text="Strong independent engagement allows future discoveries to begin with less scaffolding." />
              <Adaptation title="Deeper follow-up questions" text="Consistent observation and testing can unlock questions requiring synthesis across passages." />
              <Adaptation title="Targeted recommendations" text="Emmaus can recommend discoveries that strengthen less-practiced skills without ignoring your strongest interests." />
              <Adaptation title="No spiritual ranking" text="This profile evaluates study behavior only. It does not measure faithfulness, wisdom, holiness, or closeness to God." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">Next faithful step</p>
            <h2 className="mt-3 text-2xl font-black">Practice through Scripture.</h2>
            <p className="mt-3 leading-7 text-amber-50/75">A learning profile becomes meaningful through continued attention to God's Word. Choose another reviewed discovery and let the evidence grow naturally.</p>
            <Link href="/emmaus/admin/bible" className="mt-6 inline-flex rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950 shadow-lg">Choose a Discovery →</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl"><p className="text-3xl font-black text-amber-300">{value}</p><p className="mt-2 font-black">{label}</p></div>;
}

function Insight({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">{eyebrow}</p><h2 className="mt-3 text-3xl font-black">{title}</h2><p className="mt-3 leading-7 text-indigo-100/65">{description}</p></article>;
}

function Adaptation({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-indigo-100/60">{text}</p></div>;
}
