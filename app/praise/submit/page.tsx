import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PraiseSubmitClient from "@/components/PraiseSubmitClient";

export default async function SubmitPraisePage({
  searchParams,
}: {
  searchParams: Promise<{ prayer_request_id?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { prayer_request_id } = await searchParams;

  return (
    <PraiseSubmitClient prayerRequestId={prayer_request_id ?? null} />
  );
}
