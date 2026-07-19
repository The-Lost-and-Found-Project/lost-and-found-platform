"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PraiseReport = {
  id: string;
  content_text: string;
  created_at: string;
};

export default function PraiseWallPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<PraiseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("praise_wall_public")
        .select("id, content_text, created_at")
        .order("created_at", { ascending: false });

      setReports((data as PraiseReport[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Praise Wall</h1>
          <p className="mt-2 text-gray-600">
            Celebrate how God has answered prayer and shown up for people in
            our community. All praise reports are shared anonymously.
          </p>
        </div>
        <Link
          href="/praise/submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Share a Praise Report
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        {loading && <p className="text-gray-500">Loading praise reports...</p>}

        {!loading && reports.length === 0 && (
          <p className="text-gray-500">
            No praise reports yet. Be the first to share one.
          </p>
        )}

        {reports.map((r) => {
          const expanded = expandedIds.has(r.id);
          const snippet =
            r.content_text.length > 90
              ? `${r.content_text.slice(0, 90)}...`
              : r.content_text;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleExpanded(r.id)}
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
                  <p className="whitespace-pre-wrap text-gray-900">
                    {expanded ? r.content_text : snippet}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                    Shared anonymously
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
