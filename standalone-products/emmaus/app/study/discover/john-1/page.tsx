import { redirect } from "next/navigation";
import JohnOneDiscovery from "@/components/JohnOneDiscovery";
import { createClient } from "@/lib/supabase/server";

export default async function JohnOneDiscoveryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/study/discover/john-1");
  }

  return <JohnOneDiscovery />;
}
