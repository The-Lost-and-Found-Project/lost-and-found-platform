import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile.is_active === false) {
    redirect("/emmaus/walk");
  }

  return children;
}
