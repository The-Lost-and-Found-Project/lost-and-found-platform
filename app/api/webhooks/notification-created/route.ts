import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
};

type SupabaseWebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: NotificationRow;
  old_record: NotificationRow | null;
};

// Fired by a Supabase Database Webhook on every INSERT into public.notifications
// (configured in the Supabase dashboard: Database > Webhooks). This is what
// guarantees 1:1 parity between in-app notifications and home-screen push
// notifications — every current trigger that inserts a notification row
// (prayed_for, status_change, flagged, content_denied, content_approved,
// new_request, new_member, new_testimony, new_praise, feedback, etc.)
// automatically also fires a push, without each trigger needing its own
// push-sending code.
//
// Gated by a shared secret (set as a custom header on the webhook itself,
// since Supabase Database Webhooks don't support signing) so this can't be
// used as an open relay to push arbitrary messages to arbitrary users.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  const providedSecret = request.headers.get("x-webhook-secret");
  if (!webhookSecret || providedSecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as SupabaseWebhookPayload;

    if (payload.table !== "notifications" || payload.type !== "INSERT") {
      return NextResponse.json({ success: true, skipped: "not a notification insert" });
    }

    const row = payload.record;
    if (!row?.user_id || !row?.title) {
      return NextResponse.json({ success: true, skipped: "missing fields" });
    }

    const attemptedAt = new Date().toISOString();
    const delivery = await sendPushToUser(row.user_id, {
      title: row.title,
      body: row.body ?? "",
      url: row.link ?? undefined,
    });

    const admin = createAdminClient();
    const { error: trackingError } = await admin
      .from("notifications")
      .update({
        push_status: delivery.status,
        push_attempted_at: attemptedAt,
        push_delivered_at:
          delivery.status === "sent" ? new Date().toISOString() : null,
        push_error: delivery.reason ?? null,
      })
      .eq("id", row.id);

    if (trackingError) {
      console.error("notification delivery tracking error:", trackingError);
      return NextResponse.json(
        { error: "Push completed but delivery tracking failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, delivery: delivery.status });
  } catch (err) {
    console.error("notification-created webhook error:", err);
    return NextResponse.json(
      { error: "Unexpected error processing notification webhook" },
      { status: 500 }
    );
  }
}
