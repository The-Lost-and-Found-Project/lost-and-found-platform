import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error(
      "VAPID keys are not configured — skipping push notification"
    );
    return false;
  }
  webpush.setVapidDetails(
    "mailto:noreply@lostandfoundproject.org",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };
export type PushDeliveryResult = {
  status: "sent" | "skipped" | "failed";
  deliveredCount: number;
  failedCount: number;
  reason?: string;
};

// Sends a web push notification to every device a user has subscribed on.
// Returns a small delivery summary so the notification webhook can expose
// failed or skipped attempts without storing endpoint or payload secrets.
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<PushDeliveryResult> {
  if (!ensureConfigured()) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 1,
      reason: "Push delivery is not configured",
    };
  }

  const supabase = createAdminClient();
  const { data: subs, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (subscriptionsError) {
    console.error("Push subscription lookup failed:", subscriptionsError);
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 1,
      reason: "Subscription lookup failed",
    };
  }

  if (!subs || subs.length === 0) {
    return {
      status: "skipped",
      deliveredCount: 0,
      failedCount: 0,
      reason: "No subscribed devices",
    };
  }

  // Include the member's current unread count with every push so the
  // service worker can set the PWA's home-screen app badge (the "red
  // circle") the moment a push arrives, even if the app isn't open. This is
  // Android/desktop Chrome only — iOS Safari/PWA doesn't support the
  // Badging API yet, so members on iPhone just won't see a badge.
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  // This send.ts call runs from the notification-created webhook, which
  // fires after the triggering INSERT into notifications has already
  // committed — so this count already reflects the new notification, no
  // manual +1 needed.
  const payloadWithBadge = { ...payload, badgeCount: unreadCount ?? 0 };

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payloadWithBadge)
        );
        return "sent" as const;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // The push service says this subscription is gone for good
          // (uninstalled, permission revoked, browser data cleared) —
          // prune it so we stop wasting sends on it.
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          return "expired" as const;
        } else {
          console.error("Push send failed:", err);
          return "failed" as const;
        }
      }
    })
  );

  const deliveredCount = results.filter((result) => result === "sent").length;
  const failedCount = results.filter((result) => result === "failed").length;
  const expiredCount = results.filter((result) => result === "expired").length;

  if (failedCount > 0) {
    return {
      status: "failed",
      deliveredCount,
      failedCount,
      reason:
        deliveredCount > 0
          ? `${failedCount} device delivery failed after ${deliveredCount} succeeded`
          : "Push service rejected delivery",
    };
  }

  if (deliveredCount === 0) {
    return {
      status: "skipped",
      deliveredCount: 0,
      failedCount: 0,
      reason: expiredCount > 0 ? "Subscribed devices had expired" : "No subscribed devices",
    };
  }

  return { status: "sent", deliveredCount, failedCount: 0 };
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
) {
  await Promise.all(
    Array.from(new Set(userIds)).map((id) => sendPushToUser(id, payload))
  );
}
