"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DiscoveryRow = {
  id: string;
  discovery_key: string;
  title: string;
  subtitle: string;
  status: "draft" | "published" | "archived";
  updated_at: string;
  published_at: string | null;
};

export default function DiscoveryLibrary() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<DiscoveryRow[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | DiscoveryRow["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("emmaus_discoveries")
      .select("id, discovery_key, title, subtitle, status, updated_at, published_at")
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as DiscoveryRow[]);
      setMessage("");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function archive(item: DiscoveryRow) {
    const { error } = await supabase
      .from("emmaus_discoveries")
      .update({ status: "archived" })
      .eq("id", item.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((current) => current.map((row) => row.id === item.id ? { ...row, status: "archived" } : row));
  }

  const visible = items.filter((item) => {
    const matchesFilter = filter === "all" || item.status === filter;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || item.title.toLowerCase().includes(needle) || item.discovery_key.toLowerCase().includes(needle) || item.subtitle.toLowerCase().includes(needle);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Founder Workspace</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-950">Discovery Library</h1>
          <p className="mt-2 text-gray-600">Manage drafts, published Discoveries, and archived content.</p>
        </div>
        <Link href="/emmaus/admin" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Create Discovery</Link>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or key" className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-gray-300 px-4 py-2.5">
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {message && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>}

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">Loading Discoveries…</div>
        ) : visible.length ? (
          visible.map((item) => (
            <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{item.status}</span>
                    <code className="text-xs text-gray-500">{item.discovery_key}</code>
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-gray-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{item.subtitle || "No subtitle"}</p>
                  <p className="mt-3 text-xs text-gray-500">Updated {formatDate(item.updated_at)}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/emmaus/admin?key=${encodeURIComponent(item.discovery_key)}`} className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">Edit</Link>
                  {item.status === "published" && <Link href={`/emmaus/discover/${item.discovery_key}`} className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800">View</Link>}
                  {item.status !== "archived" && <button type="button" onClick={() => archive(item)} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700">Archive</button>}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">No Discoveries match this view.</div>
        )}
      </div>
    </div>
  );
}

function statusClass(status: DiscoveryRow["status"]) {
  if (status === "published") return "bg-emerald-100 text-emerald-800";
  if (status === "archived") return "bg-gray-200 text-gray-700";
  return "bg-amber-100 text-amber-800";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
