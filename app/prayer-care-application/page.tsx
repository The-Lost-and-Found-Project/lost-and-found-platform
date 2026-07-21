import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerCareApplicationClient from "@/components/PrayerCareApplicationClient";

export default async function PrayerCareApplicationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: existingApplication } = await supabase
    .from("prayer_care_applications")
    .select("id, status, created_at, reviewed_at, review_note")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PrayerCareApplicationClient
      currentRole={profile?.role ?? "member"}
      existingApplication={existingApplication ?? null}
    />
  );
}
