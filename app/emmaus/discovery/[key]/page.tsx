import DiscoveryPlayer from "@/components/emmaus/DiscoveryPlayer";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DiscoveryPageProps = {
  params: Promise<{ key: string }>;
};

type PassageVerse = {
  verse?: number;
  text?: string;
};

type DiscoveryPrompts = {
  observe?: string;
  wonder?: string;
  reflect?: string;
  pray?: string;
};

export default async function EmmausPublishedDiscoveryPage({ params }: DiscoveryPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { key } = await params;
  const discoveryKey = cleanKey(key);
  if (!discoveryKey) notFound();

  const { data: discovery, error } = await supabase
    .from("emmaus_discoveries")
    .select("discovery_key, title, subtitle, translation, passage, prompts, status")
    .eq("discovery_key", discoveryKey)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-300/20 bg-red-400/10 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">Unable to load Discovery</p>
          <h1 className="mt-3 text-3xl font-black">The learner experience could not open.</h1>
          <p className="mt-4 leading-7 text-red-50/75">{error.message}</p>
          <Link href="/emmaus/discovery/demo" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 font-bold text-slate-950">
            Open the demo Discovery
          </Link>
        </div>
      </main>
    );
  }

  if (!discovery) notFound();

  const passage = normalizePassage(discovery.passage);
  if (!passage.length) notFound();

  const prompts = normalizePrompts(discovery.prompts);
  const reference = inferReference(discovery.title, discovery.subtitle, discoveryKey);

  return (
    <DiscoveryPlayer
      title={discovery.title || "Untitled Discovery"}
      subtitle={discovery.subtitle || "A guided journey through Scripture"}
      reference={reference}
      translation={discovery.translation || "Bible translation"}
      passage={passage}
      prompts={prompts}
    />
  );
}

function cleanKey(value: string) {
  const key = value.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) && key.length <= 100 ? key : null;
}

function normalizePassage(value: unknown): Array<{ verse: number; text: string }> {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const verse = item as PassageVerse;
    const number = Number(verse.verse);
    const text = typeof verse.text === "string" ? verse.text.trim() : "";
    return Number.isInteger(number) && number > 0 && text ? [{ verse: number, text }] : [];
  });
}

function normalizePrompts(value: unknown): DiscoveryPrompts {
  if (!value || typeof value !== "object") return {};
  const prompts = value as Record<string, unknown>;
  return {
    observe: typeof prompts.observe === "string" ? prompts.observe : undefined,
    wonder: typeof prompts.wonder === "string" ? prompts.wonder : undefined,
    reflect: typeof prompts.reflect === "string" ? prompts.reflect : undefined,
    pray: typeof prompts.pray === "string" ? prompts.pray : undefined,
  };
}

function inferReference(title: string | null, subtitle: string | null, key: string) {
  const candidates = [title, subtitle].filter((value): value is string => Boolean(value));
  const referencePattern = /(?:[1-3]\s)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:[-–]\d+)?/;

  for (const candidate of candidates) {
    const match = candidate.match(referencePattern);
    if (match) return match[0];
  }

  return key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
