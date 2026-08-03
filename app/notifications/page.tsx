import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationsClient from "@/components/NotificationsClient";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notificationRows = notifications ?? [];
  const unreadCount = notificationRows.filter((notification) => !notification.read_at).length;
  const linkedCount = notificationRows.filter((notification) => Boolean(notification.link)).length;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Notifications</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Stay connected to what needs your attention, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Review prayer updates, ministry activity, approvals, reminders, and other meaningful changes without searching across the platform.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <NotificationStat label="Unread" value={String(unreadCount)} />
            <NotificationStat label="Recent notifications" value={String(notificationRows.length)} />
            <NotificationStat label="Linked actions" value={String(linkedCount)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <NotificationValue icon="🔔" title="Notice" text="See the updates that matter without turning the platform into a stream of distractions." />
          <NotificationValue icon="✓" title="Respond" text="Open linked notifications when an approval, prayer update, or ministry action needs attention." />
          <NotificationValue icon="🕊" title="Stay focused" text="Use read status to keep the list clear and return to unresolved items when needed." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-2xl sm:p-8">
          <div className="mb-8 max-w-3xl">
            <p className="lfp-eyebrow">Activity center</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Your recent updates</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Unread items remain prominent until they are reviewed. Existing actions and destinations are preserved.</p>
          </div>
          <NotificationsClient initialNotifications={notificationRows} />
        </section>
      </div>
    </main>
  );
}

function NotificationStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/60">{label}</p></div>;
}

function NotificationValue({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
