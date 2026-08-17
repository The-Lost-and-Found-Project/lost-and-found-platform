"use client";

import { type MouseEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { announceUnreadCount } from "@/lib/notifications/unread-count";

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
  flagged: "bg-gradient-to-br from-amber-500 to-red-500",
  content_denied: "bg-gradient-to-br from-red-500 to-rose-600",
  content_approved: "bg-gradient-to-br from-emerald-500 to-green-600",
};

const TYPE_ACTION: Record<string, { label: string; action: string }> = {
  assigned: { label: "Legacy notice", action: "Open Prayer" },
  prayer_reassigned: { label: "Legacy notice", action: "Open Prayer" },
  prayer_request_updated: { label: "Care update", action: "Review update" },
  idle_assignment: { label: "Legacy notice", action: "Open Prayer" },
  follow_up_due: { label: "Follow-up due", action: "Complete follow-up" },
  prayer_escalated: { label: "Escalated care", action: "Review escalation" },
  check_in_needed: { label: "Check-in", action: "Respond now" },
  rotation_paused: { label: "Legacy notice", action: "Open Prayer" },
  prayer_care_application: { label: "Application", action: "Review application" },
  prayer_care_application_approved: { label: "Legacy notice", action: "Open Prayer" },
  prayer_care_application_denied: { label: "Application", action: "Review decision" },
  prayed_for: { label: "Prayer", action: "View your journey" },
  status_change: { label: "Care update", action: "Review update" },
  flagged: { label: "Action needed", action: "Review content" },
  new_request: { label: "Community prayer", action: "Open prayer" },
  new_praise: { label: "Praise report", action: "View praise" },
  new_testimony: { label: "Testimony", action: "View testimony" },
  new_member: { label: "New member", action: "Open People & Roles" },
  content_denied: { label: "Content review", action: "Review decision" },
  content_approved: { label: "Content review", action: "View update" },
};

const ATTENTION_TYPES = new Set([
  "assigned",
  "prayer_reassigned",
  "idle_assignment",
  "follow_up_due",
  "prayer_escalated",
  "check_in_needed",
  "rotation_paused",
  "flagged",
  "prayer_care_application",
]);

type Filter = "attention" | "unread" | "all";

function needsAttention(notification: Notification) {
  return !notification.read_at && ATTENTION_TYPES.has(notification.type);
}

export default function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(() =>
    initialNotifications.some(needsAttention) ? "attention" : "all"
  );

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const attentionCount = notifications.filter(needsAttention).length;
  const readCount = notifications.length - unreadCount;
  const visibleNotifications = notifications.filter((notification) => {
    if (filter === "attention") return needsAttention(notification);
    if (filter === "unread") return !notification.read_at;
    return true;
  });

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;
      setUserId(user.id);
      channel = supabase
        .channel(`notifications-page-${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications((previous) => [payload.new as Notification, ...previous]);
        })
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
    const unreadIds = notifications.filter((notification) => !notification.read_at).map((notification) => notification.id);
    if (unreadIds.length === 0) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).in("id", unreadIds);
    if (!error) {
      setNotifications((previous) => previous.map((notification) => notification.read_at ? notification : { ...notification, read_at: now }));
      announceUnreadCount(0);
    }
  }

  async function markOneRead(notification: Notification) {
    if (notification.read_at) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("id", notification.id);
    if (!error) {
      setNotifications((previous) => previous.map((item) => item.id === notification.id ? { ...item, read_at: item.read_at ?? now } : item));
      announceUnreadCount(unreadCount - 1);
    }
  }

  async function openNotification(event: MouseEvent<HTMLAnchorElement>, notification: Notification) {
    const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (isModifiedClick) {
      void markOneRead(notification);
      return;
    }
    event.preventDefault();
    await markOneRead(notification);
    router.push(notification.link ?? "/notifications");
  }

  async function deleteOne(id: string) {
    const deletedNotification = notifications.find((notification) => notification.id === id);
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      setNotifications((previous) => previous.filter((notification) => notification.id !== id));
      if (deletedNotification && !deletedNotification.read_at) announceUnreadCount(Math.max(0, unreadCount - 1));
    }
  }

  async function clearRead() {
    if (!userId) return;
    const readIds = notifications.filter((notification) => notification.read_at).map((notification) => notification.id);
    if (readIds.length === 0) return;
    const previous = notifications;
    setNotifications((items) => items.filter((notification) => !notification.read_at));
    const { error } = await supabase.from("notifications").delete().in("id", readIds);
    if (error) setNotifications(previous);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-600" role="status">
          {unreadCount > 0 ? `${unreadCount} unread` : "You’re all caught up"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && <button onClick={markAllRead} className="lfp-button lfp-button-secondary min-h-11 px-4 py-2">Mark all read</button>}
          {readCount > 0 && <button onClick={clearRead} className="lfp-button min-h-11 border border-slate-200 bg-white px-4 py-2 text-slate-600">Remove read</button>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 rounded-2xl border border-slate-200 bg-slate-100 p-1 text-sm" role="group" aria-label="Notification view">
        {(["attention", "unread", "all"] as const).map((option) => (
          <button key={option} onClick={() => setFilter(option)} aria-pressed={filter === option} className={`min-h-11 rounded-xl px-2 py-2 font-bold transition sm:px-4 ${filter === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {option === "attention" ? "Priority" : option === "unread" ? "Unread" : "All"}
            {option === "attention" && attentionCount > 0 ? ` (${attentionCount})` : option === "unread" && unreadCount > 0 ? ` (${unreadCount})` : option === "all" && notifications.length > 0 ? ` (${notifications.length})` : ""}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-500" aria-live="polite">
        {filter === "attention"
          ? attentionCount > 0 ? "Showing unread care items that need a response." : "No priority actions need a response."
          : filter === "unread" ? "Showing every unread update." : "Showing your complete recent notification history."}
      </p>

      <div className="mt-6 space-y-3">
        {visibleNotifications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">🔔</span>
            <h3 className="mt-4 text-xl font-black text-slate-950">{filter === "attention" ? "No priority actions" : filter === "unread" ? "No unread notifications" : "No notifications yet"}</h3>
            <p className="mt-2 text-sm text-slate-500">{filter === "attention" ? "Important moderation and account updates will appear here." : filter === "unread" ? "Everything has been reviewed." : "Meaningful community updates will appear here."}</p>
          </div>
        )}

        {visibleNotifications.map((notification) => {
          const action = TYPE_ACTION[notification.type] ?? {
            label: "Update",
            action: "Open update",
          };
          return (
          <article key={notification.id} className={`group flex items-start gap-3 rounded-3xl border p-4 transition sm:p-5 ${notification.read_at ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50/70 shadow-sm"}`}>
            <Link href={notification.link ?? "/notifications"} onClick={(event) => void openNotification(event, notification)} className="flex min-w-0 flex-1 items-start gap-4 rounded-2xl">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${notification.read_at ? "bg-slate-200" : TYPE_ICON[notification.type] ?? "bg-indigo-500"}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-950">{notification.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${needsAttention(notification) ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>{action.label}</span>
                  {!notification.read_at && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">New</span>}
                </div>
                {notification.body && <p className="mt-2 leading-7 text-slate-600">{notification.body}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
                  <span className="text-slate-400">{new Date(notification.created_at).toLocaleString()}</span>
                  <span className="font-black text-indigo-700">{action.action} →</span>
                </div>
              </div>
            </Link>
            <button type="button" onClick={() => deleteOne(notification.id)} aria-label={`Delete notification: ${notification.title}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:text-rose-700 sm:opacity-40 sm:group-hover:opacity-100 sm:focus-visible:opacity-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </article>
          );
        })}
      </div>
    </div>
  );
}
