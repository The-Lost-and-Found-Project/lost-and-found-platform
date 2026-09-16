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

// Supabase Database Webhooks call this route after INSERTs into notifications.
// A configured shared secret is honored when present, but delivery does not
// depend on it: the webhook payload is treated only as a pointer to an
// unguessable notification UUID. We load the canonical row from the database
// with the service role and only deliver a row that really exists and is still
// pending. Payload-provided user/title/body values are never trusted.
//
// This prevents the endpoint from becoming an arbitrary push relay while also
// avoiding a silent outage when the Supabase webhook header and Vercel secret
// drift out of sync. The scheduled push worker remains a second retry path.
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

    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const providedSecret = request.headers.get("x-webhook-secret");
    const secretMatched = Boolean(webhookSecret && providedSecret === webhookSecret);

    const admin = createAdminClient();
    const { data: row, error: lookupError } = await admin
      .from("notifications")
      .select("id,user_id,title,body,link,push_status")
      .eq("id", payload.record.id)
      .maybeSingle();

    if (lookupError) {
      console.error("notification webhook lookup error:", lookupError);
      return NextResponse.json({ error: "Notification lookup failed" }, { status: 500 });
    }

    if (!row || row.push_status !== "pending") {
      return NextResponse.json({
        success: true,
        skipped: row ? "notification already handled" : "notification not found",
      });
    }

    if (!secretMatched) {
      console.warn("notification webhook secret mismatch; using database-verified fallback", {
        notificationId: row.id,
      });
    }

    const attemptedAt = new Date().toISOString();
    const delivery = await sendPushToUser(row.user_id, {
      title: row.title,
      body: row.body ?? "",
      url: row.link ?? undefined,
    });

    const { error: trackingError } = await admin
      .from("notifications")
      .update({
        push_status: delivery.status,
        push_attempted_at: attemptedAt,
        push_delivered_at:
          delivery.status === "sent" ? new Date().toISOString() : null,
        push_error: delivery.reason ?? null,
      })
      .eq("id", row.id)
      .eq("push_status", "pending");

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
