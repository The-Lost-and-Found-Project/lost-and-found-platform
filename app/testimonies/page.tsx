"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TestimonyTicker from "@/components/TestimonyTicker";

type Testimony = {
  id: string;
  content_text: string;
  created_at: string;
  display_name: string | null;
  is_anonymous: boolean;
};

// Collapsed by default, showing just a snippet of the body plus who shared
// it (or "Anonymous" if they opted out of using their name). Tap to expand.
function TestimonyCard({ testimony }: { testimony: Testimony }) {
  const [expanded, setExpanded] = useState(false);
  const snippet =
    testimony.content_text.length > 90
      ? `${testimony.content_text.slice(0, 90)}...`
      : testimony.content_text;

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="block w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm"
    >
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {testimony.display_name ?? "Anonymous"}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-gray-900">
            {expanded ? testimony.content_text : snippet}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function TestimonyBoardPage() {
  const supabase = createClient();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("testimony_board_public")
        .select("id, content_text, created_at, display_name, is_anonymous")
        .order("created_at", { ascending: false });

      setTestimonies((data as Testimony[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Testimony Board
          </h1>
          <p className="mt-2 text-gray-600">
            Stories of how God is working in the lives of people in our
            community.
          </p>
        </div>
        <Link
          href="/testimonies/submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Share Your Testimony
        </Link>
      </div>

      <TestimonyTicker />

      <div className="mt-10 space-y-4">
        {loading && <p className="text-gray-500">Loading testimonies...</p>}

        {!loading && testimonies.length === 0 && (
          <p className="text-gray-500">
            No testimonies yet. Be the first to share one.
          </p>
        )}

        {testimonies.map((t) => (
          <TestimonyCard key={t.id} testimony={t} />
        ))}
      </div>
    </div>
  );
}
