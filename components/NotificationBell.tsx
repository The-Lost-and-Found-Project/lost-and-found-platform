"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UNREAD_COUNT_CHANGED_EVENT } from "@/lib/notifications/unread-count";

export default function NotificationBell() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    function applyUnreadCount(next: number) {
      setUnreadCount(next);
      if ("setAppBadge" in navigator) {
        if (next > 0) navigator.setAppBadge(next).catch(() => {});
        else navigator.clearAppBadge().catch(() => {});
      }
    }

    function handleUnreadCountChanged(event: Event) {
      const next = (event as CustomEvent<{ unreadCount?: number }>).detail?.unreadCount;
      if (typeof next === "number" && Number.isFinite(next)) applyUnreadCount(Math.max(0, next));
    }

    window.addEventListener(UNREAD_COUNT_CHANGED_EVENT, handleUnreadCountChanged);

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
        applyUnreadCount(count ?? 0);
      }

      await refreshUnreadCount();
      channel = supabase
        .channel(`notifications-bell-${uid}`)
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${uid}`,
        }, refreshUnreadCount)
        .subscribe();
    }

    init();
    return () => {
      window.removeEventListener(UNREAD_COUNT_CHANGED_EVENT, handleUnreadCountChanged);
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!userId) return null;

  const ariaLabel = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : "Notifications, none unread";

  return (
    <Link
      href="/notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md focus-visible:text-indigo-700"
      aria-label={ariaLabel}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path fillRule="evenodd" d="M12 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 104 0h-4z" clipRule="evenodd" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-black text-white shadow-sm" aria-hidden="true">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
