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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      .select(
        "email_notifications, prayer_reaction_notifications, default_anonymous"
      )
      .single();
    settings = created;
  }

  return (
    <SettingsClient initialSettings={settings ?? DEFAULT_SETTINGS} />
  );
}
