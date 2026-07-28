import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, favorite_scripture, date_of_salvation, date_of_baptism, role, preview_role, rotation_status, reinstatement_requested_at"
    )
    .eq("id", user.id)
    .single();

  return (
    <ProfileClient
      email={user.email ?? ""}
      createdAt={user.created_at}
      initialFullName={profile?.full_name ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? ""}
      initialFavoriteScripture={profile?.favorite_scripture ?? ""}
      initialDateOfSalvation={profile?.date_of_salvation ?? ""}
      initialDateOfBaptism={profile?.date_of_baptism ?? ""}
      isRealAdmin={profile?.role === "admin"}
      initialPreviewRole={profile?.preview_role ?? ""}
      isCareTeamMember={["admin", "prayer_team", "pastor"].includes(profile?.role ?? "")}
      initialRotationStatus={profile?.rotation_status ?? "active"}
      initialReinstatementRequestedAt={profile?.reinstatement_requested_at ?? null}
    />
  );
}
