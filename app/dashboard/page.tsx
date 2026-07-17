import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrayerWallTicker from "@/components/PrayerWallTicker";
import TestimonyTicker from "@/components/TestimonyTicker";
import ShareButton from "@/components/ShareButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-4 text-gray-600">Signed in as {user.email}.</p>
        </div>
        <ShareButton />
      </div>

      <PrayerWallTicker />
      <TestimonyTicker />
    </div>
  );
}
