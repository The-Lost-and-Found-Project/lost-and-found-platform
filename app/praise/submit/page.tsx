import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PraiseSubmitClient from "@/components/PraiseSubmitClient";

export default async function SubmitPraisePage({
  searchParams,
}: {
  searchParams: Promise<{ prayer_request_id?: string }>;
}) {
  const { prayer_request_id } = await searchParams;
  const destination = prayer_request_id ? `/praise/submit?prayer_request_id=${encodeURIComponent(prayer_request_id)}` : "/praise/submit";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(destination)}`);
  }

  return (
    <PraiseSubmitClient prayerRequestId={prayer_request_id ?? null} />
  );
}
