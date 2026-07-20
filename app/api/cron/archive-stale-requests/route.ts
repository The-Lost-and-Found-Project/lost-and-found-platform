import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Runs daily via Vercel Cron (see vercel.json). Archives prayer requests that
// have gone 30+ days without activity (no new prayers, no updated_at
// changes) — this removes them from the public Prayer Wall and ticker, but
// they remain visible to the member on their own My Journey page. Protected
// by CRON_SECRET like the other cron routes.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc(
      "archive_stale_prayer_requests"
    );

    if (error) throw error;

    return NextResponse.json({ success: true, archivedCount: data ?? 0 });
  } catch (err) {
    console.error("archive-stale-requests error:", err);
    return NextResponse.json(
      { error: "Unexpected error archiving stale prayer requests" },
      { status: 500 }
    );
  }
}
