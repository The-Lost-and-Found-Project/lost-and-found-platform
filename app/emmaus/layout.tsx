import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Emmaus is founder-only during development. All routes nested beneath
  // /emmaus inherit this server-side authorization check.
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return children;
}
