import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyJourneyClient from "@/components/MyJourneyClient";

export default async function MyJourneyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("faith_story, favorite_scripture")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select("id, created_at, request_text, status, category_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("prayer_categories")
    .select("id, name");

  const categoryMap: Record<string, string> = {};
  (categories ?? []).forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  return (
    <MyJourneyClient
      email={user.email ?? ""}
      initialFaithStory={profile?.faith_story ?? ""}
      initialFavoriteScripture={profile?.favorite_scripture ?? ""}
      requests={requests ?? []}
      categoryMap={categoryMap}
    />
  );
}
