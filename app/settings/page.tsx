import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/SettingsClient";

const DEFAULT_SETTINGS = {
  email_notifications: true,
  prayer_reaction_notifications: true,
  default_anonymous: false,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("user_settings")
    .select("email_notifications, prayer_reaction_notifications, default_anonymous")
    .eq("user_id", user.id)
    .single();

  let settings = existing;
  if (!settings) {
    const { data: created } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("email_notifications, prayer_reaction_notifications, default_anonymous")
      .single();
    settings = created;
  }

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Settings</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Choose how the platform supports you.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Manage notification preferences and default privacy choices without changing the ministry workflows already connected to your account.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <InfoCard icon="🔔" title="Stay informed" text="Control which ministry updates reach you by email and inside the platform." />
          <InfoCard icon="🙏" title="Prayer activity" text="Choose whether to receive updates when members pray for your requests." />
          <InfoCard icon="🛡" title="Privacy defaults" text="Set your preferred default while retaining the ability to choose on each submission." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
          <SettingsClient initialSettings={settings ?? DEFAULT_SETTINGS} />
        </section>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
