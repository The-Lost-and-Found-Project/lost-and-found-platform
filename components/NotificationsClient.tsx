"use client";

import { useCallback, useEffect, useState } from "react";
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
  prayer: "bg-gradient-to-br from-emerald-500 to-teal-500",
};

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

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const loadNotifications = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, link, read_at, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifications((data as Notification[]) ?? []);
    },
    [supabase]
  );

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
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
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {notifications.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-500">
            No notifications yet.
          </p>
        )}

        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.link ?? "#"}
            onClick={() => markOneRead(n.id)}
            className={`flex items-start gap-3 px-5 py-4 transition hover:bg-gray-50 ${
              n.read_at ? "bg-white" : "bg-indigo-50/50"
            }`}
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
        ))}
      </div>
    </div>
  );
}
