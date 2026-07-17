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
      "full_name, avatar_url, faith_story, favorite_scripture, date_of_salvation, date_of_baptism, role, preview_role"
    )
    .eq("id", user.id)
    .single();

  return (
    <ProfileClient
      email={user.email ?? ""}
      initialFullName={profile?.full_name ?? ""}
      initialAvatarUrl={profile?.avatar_url ?? ""}
      initialTestimony={profile?.faith_story ?? ""}
      initialFavoriteScripture={profile?.favorite_scripture ?? ""}
      initialDateOfSalvation={profile?.date_of_salvation ?? ""}
      initialDateOfBaptism={profile?.date_of_baptism ?? ""}
      isRealAdmin={profile?.role === "admin"}
      initialPreviewRole={profile?.preview_role ?? ""}
    />
  );
}
