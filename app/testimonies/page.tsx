"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Testimony = {
  id: string;
  content_text: string;
  created_at: string;
};

export default function TestimonyBoardPage() {
  const supabase = createClient();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("testimony_board_public")
        .select("id, content_text, created_at")
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
            community. All testimonies are shared anonymously.
          </p>
        </div>
        <Link
          href="/testimonies/submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Share Your Testimony
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        {loading && <p className="text-gray-500">Loading testimonies...</p>}

        {!loading && testimonies.length === 0 && (
          <p className="text-gray-500">
            No testimonies yet. Be the first to share one.
          </p>
        )}

        {testimonies.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="whitespace-pre-wrap text-gray-900">
              {t.content_text}
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              Shared anonymously
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
