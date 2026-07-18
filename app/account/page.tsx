import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountClient from "@/components/AccountClient";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AccountClient email={user.email ?? ""} createdAt={user.created_at} />;
}
