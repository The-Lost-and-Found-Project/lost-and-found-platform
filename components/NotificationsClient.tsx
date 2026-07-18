"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  assigned: "bg-gradient-to-br from-indigo-600 to-violet-600",
  new_request: "bg-gradient-to-br from-amber-500 to-orange-500",
  prayed_for: "bg-gradient-to-br from-emerald-500 to-teal-500",
  status_change: "bg-gradient-to-br from-sky-500 to-cyan-500",
  encouragement: "bg-gradient-to-br from-pink-500 to-rose-500",
  flagged: "bg-gradient-to-br from-amber-500 to-red-500",
  content_denied: "bg-gradient-to-br from-red-500 to-rose-600",
  content_approved: "bg-gradient-to-br from-emerald-500 to-green-600",
};

type Filter = "all" | "unread";

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const readCount = notifications.length - unreadCount;
  const visibleNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read_at) : notifications;

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      setUserId(user.id);

      channel = supabase
        .channel(`notifications-page-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [
              payload.new as Notification,
              ...prev,
            ]);
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAllRead() {
    if (!userId) return;
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: now }))
    );

    await supabase
      .from("notifications")
      .update({ read_at: now })
      .in("id", unreadIds);
  }

  async function markOneRead(id: string) {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? now } : n))
    );
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
  }

  async function deleteOne(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }

  async function clearRead() {
    if (!userId) return;
    const readIds = notifications.filter((n) => n.read_at).map((n) => n.id);
    if (readIds.length === 0) return;

    setNotifications((prev) => prev.filter((n) => !n.read_at));
    await supabase.from("notifications").delete().in("id", readIds);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Mark all read
            </button>
          )}
          {readCount > 0 && (
            <button
              onClick={clearRead}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-sm">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 font-medium transition ${
            filter === "all"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All{notifications.length > 0 ? ` (${notifications.length})` : ""}
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-full px-3 py-1 font-medium transition ${
            filter === "unread"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </button>
      </div>

      <div className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {visibleNotifications.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            {filter === "unread"
              ? "No unread notifications."
              : "No notifications yet."}
          </p>
        )}

        {visibleNotifications.map((n) => (
          <div
            key={n.id}
            className={`group flex items-start gap-3 px-5 py-4 transition hover:bg-gray-50 ${
              n.read_at ? "bg-white" : "bg-indigo-50/50"
            }`}
          >
            <Link
              href={n.link ?? "#"}
              onClick={() => markOneRead(n.id)}
              className="flex min-w-0 flex-1 items-start gap-3"
            >
              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  n.read_at ? "bg-gray-200" : TYPE_ICON[n.type] ?? "bg-indigo-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                {n.body && (
                  <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => deleteOne(n.id)}
              aria-label="Delete notification"
              className="shrink-0 rounded-full p-1.5 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
