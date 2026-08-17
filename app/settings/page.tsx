import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/SettingsClient";

const DEFAULT_SETTINGS = {
  email_notifications: true,
  prayer_reaction_notifications: true,
  praise_reaction_notifications: true,
  testimony_reaction_notifications: true,
  default_anonymous: false,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("user_settings")
    .select("email_notifications, prayer_reaction_notifications, praise_reaction_notifications, testimony_reaction_notifications, default_anonymous")
    .eq("user_id", user.id)
    .single();

  let settings = existing;
  if (!settings) {
    const { data: created } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id })
      .select("email_notifications, prayer_reaction_notifications, praise_reaction_notifications, testimony_reaction_notifications, default_anonymous")
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
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <SettingsClient initialSettings={settings ?? DEFAULT_SETTINGS} />
        </section>
      </div>
    </main>
  );
}
