"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NotificationBell() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const uid = user.id;
      setUserId(uid);

      async function refreshUnreadCount() {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .is("read_at", null);
        setUnreadCount(count ?? 0);
      }

      await refreshUnreadCount();

      // Re-derive the count from the DB on every insert/update/delete rather
      // than incrementing/decrementing locally — that way "mark read",
      // "delete", and "clear read" on the notifications page (and any other
      // tab/device) always leave the bell's badge in sync, instead of only
      // ever growing on new notifications.
      channel = supabase
        .channel(`notifications-bell-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          () => {
            refreshUnreadCount();
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

  if (!userId) return null;

  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
      aria-label="Notifications"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path
          fillRule="evenodd"
          d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 104 0h-4z"
          clipRule="evenodd"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
