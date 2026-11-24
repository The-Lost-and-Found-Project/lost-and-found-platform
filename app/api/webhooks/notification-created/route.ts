import { NextRequest, NextResponse } from "next/server";

type SupabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: { id?: string };
};

// Push delivery is handled only by the authorized scheduled worker. This
// webhook acknowledges valid notification inserts for compatibility with the
// existing Supabase configuration, but never sends push itself; that avoids
// a race between webhook delivery and the cron retry worker.
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SupabaseWebhookPayload;
    if (
      payload.schema !== "public" ||
      payload.table !== "notifications" ||
      payload.type !== "INSERT" ||
      !payload.record?.id
    ) {
      return NextResponse.json({ success: true, skipped: "not a notification insert" });
    }
    return NextResponse.json({ success: true, queued: true }, { status: 202 });
  } catch (error) {
    console.error("notification-created webhook payload error:", error);
    return NextResponse.json(
      { error: "Invalid notification webhook payload" },
      { status: 400 }
    );
  }
}
