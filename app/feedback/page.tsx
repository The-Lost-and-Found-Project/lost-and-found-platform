import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedbackClient from "@/components/FeedbackClient";

export default async function FeedbackPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <FeedbackClient
      defaultName={profile?.full_name ?? ""}
      defaultEmail={profile?.email ?? user.email ?? ""}
    />
  );
}
