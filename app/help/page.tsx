import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";
import HelpClient from "@/components/HelpClient";

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role")
    .eq("id", user.id)
    .single();

  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  return (
    <HelpClient
      showPrayerTeamGuide={
        effectiveRole === "prayer_team" ||
        effectiveRole === "pastor" ||
        effectiveRole === "admin"
      }
      showAdminGuide={effectiveRole === "admin"}
    />
  );
}
