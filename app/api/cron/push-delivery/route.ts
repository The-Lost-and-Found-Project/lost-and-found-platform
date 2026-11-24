import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

async function sendAndTrack(admin: ReturnType<typeof createAdminClient>, notificationId: string) {
  const { data: claimedRows, error: claimError } = await admin.rpc(
    "claim_notification_push_delivery",
    { p_notification_id: notificationId }
  );
  if (claimError) throw claimError;
  const row = Array.isArray(claimedRows) ? claimedRows[0] : claimedRows;
  if (!row) return { status: "claimed_elsewhere" as const };

  const delivery = await sendPushToUser(row.user_id, {
    title: row.title,
    body: row.body ?? "",
    url: row.link ?? undefined,
  }, row.delivered_subscription_ids ?? []);
  const { data: tracked, error: trackingError } = await admin.rpc(
    "complete_notification_push_delivery",
    {
      p_notification_id: row.id,
      p_claim_token: row.claim_token,
      p_status: delivery.status,
      p_error: delivery.reason ?? null,
      p_delivered_subscription_ids: delivery.deliveredSubscriptionIds,
    }
  );
  if (trackingError) throw trackingError;
  if (!tracked) throw new Error("Push result was not recorded because its claim expired");

  return delivery;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  let remindersCreated = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Create today's devotional reminder notification when the member's local
  // clock is at the configured reminder time. The delivery table makes this
  // idempotent even if the cron fires more than once in the same window.
  const { data: reminders, error: reminderError } = await admin
    .from("devotional_push_reminders")
    .select("id,user_id,study_session_id,local_time,timezone,starts_on,ends_on,is_active")
    .eq("is_active", true);

  if (reminderError) {
    console.error("devotional reminder lookup failed", reminderError);
  } else {
    for (const reminder of reminders ?? []) {
      const local = localParts(now, reminder.timezone || "America/New_York");
      const target = String(reminder.local_time || "10:00").slice(0, 5);
      if (local.time !== target || local.date < reminder.starts_on || local.date > reminder.ends_on) continue;

      const { data: claimed, error: claimError } = await admin
        .from("devotional_push_deliveries")
        .insert({ reminder_id: reminder.id, delivery_date: local.date })
        .select("id")
        .maybeSingle();

      if (claimError) {
        // Unique violation means another cron invocation already claimed today.
        if ((claimError as any).code !== "23505") console.error("devotional reminder claim failed", claimError);
        continue;
      }
      if (!claimed) continue;

      const { data: session } = await admin
        .from("study_sessions")
        .select("daily_path_released_at,bible_studies(title,devotional_cards)")
        .eq("id", reminder.study_session_id)
        .maybeSingle();
      if (!session?.daily_path_released_at) continue;

      const study: any = Array.isArray((session as any).bible_studies)
        ? (session as any).bible_studies[0]
        : (session as any).bible_studies;
      const cards = Array.isArray(study?.devotional_cards) ? study.devotional_cards : [];
      const release = new Date(session.daily_path_released_at);
      const day = Math.min(cards.length || 1, Math.max(1, Math.floor((now.getTime() - release.getTime()) / 86400000) + 1));
      const title = `Day ${day} is ready`;
      const body = `Continue ${study?.title || "your Bible study"} in Daily Path.`;
      const link = `/study-path/${reminder.study_session_id}/${day}`;

      const { data: notification, error: notificationError } = await admin
        .from("notifications")
        .insert({
          user_id: reminder.user_id,
          type: "daily_study_reminder",
          title,
          body,
          link,
          push_status: "pending",
        })
        .select("id,user_id,title,body,link")
        .single();

      if (notificationError || !notification) {
        console.error("devotional reminder notification failed", notificationError);
        continue;
      }
      await admin
        .from("devotional_push_deliveries")
        .update({ notification_id: notification.id })
        .eq("id", claimed.id);
      remindersCreated += 1;
    }
  }

  // This cron is the sole sender. Database webhooks only acknowledge queueing,
  // so overlapping cron runs cannot race a webhook send. The database claim
  // RPC serializes workers and applies the persisted retry schedule.
  const { data: pending, error: pendingError } = await admin
    .from("notifications")
    .select("id,created_at")
    .in("push_status", ["pending", "failed"])
    .or("push_next_attempt_at.is.null,push_next_attempt_at.lte." + now.toISOString())
    .or("push_claimed_until.is.null,push_claimed_until.lte." + now.toISOString())
    .lt("push_attempt_count", 8)
    .order("created_at", { ascending: true })
    .limit(100);

  if (pendingError) {
    console.error("pending push lookup failed", pendingError);
    return NextResponse.json({ error: "Pending push lookup failed" }, { status: 500 });
  }

  for (const row of pending ?? []) {
    try {
      const result = await sendAndTrack(admin, row.id);
      if (result.status === "sent") sent += 1;
      else if (result.status === "skipped") skipped += 1;
      else if (result.status === "failed") failed += 1;
    } catch (error) {
      // Keep the claim until its lease expires. The DB retry schedule handles
      // delivery failures; tracking failures are surfaced for admin review.
      failed += 1;
      console.error("push delivery attempt failed", { notificationId: row.id, error });
    }
  }

  console.info("push delivery cron complete", { remindersCreated, sent, skipped, failed, pending: pending?.length ?? 0 });
  return NextResponse.json({ ok: true, remindersCreated, sent, skipped, failed, pending: pending?.length ?? 0 });
}
