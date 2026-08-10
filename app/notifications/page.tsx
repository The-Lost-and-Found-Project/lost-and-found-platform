import { redirect } from "next/navigation";
import Link from "next/link";
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
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-8 sm:py-12">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Notifications</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">Notifications for {firstName}</h1>
          <p className="mt-3 max-w-3xl leading-7 text-indigo-100/75 sm:text-lg">Priority care actions stay separate from routine ministry updates.</p>
        </div>
      </section>

      <div className="lfp-shell py-7 sm:py-10">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-950">Recent updates</h2>
            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600"
            >
              Notification settings →
            </Link>
          </div>
          <NotificationsClient initialNotifications={notificationRows} />
        </section>
      </div>
    </main>
  );
}
