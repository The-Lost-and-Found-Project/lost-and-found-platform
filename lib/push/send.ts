import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;
let configPromise: Promise<boolean> | null = null;

async function ensureConfigured() {
  if (configured) return true;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    let privateKey = process.env.VAPID_PRIVATE_KEY || "";

    if (!publicKey || !privateKey) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("app_runtime_secrets")
        .select("key,value")
        .in("key", ["vapid_public_key", "vapid_private_key"]);

      if (error) {
        console.error("VAPID runtime secret lookup failed:", error);
      } else {
        const values = new Map((data || []).map((row) => [row.key, row.value]));
        publicKey ||= values.get("vapid_public_key") || "";
        privateKey ||= values.get("vapid_private_key") || "";
      }
    }

    if (!publicKey || !privateKey) {
      console.error("VAPID keys are not configured — skipping push notification");
      return false;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:noreply@lostandfoundproject.org",
      publicKey,
      privateKey
    );
    configured = true;
    console.info("Web push VAPID configuration loaded");
    return true;
  })();

  return configPromise;
}

export type PushPayload = { title: string; body: string; url?: string };
export type PushDeliveryResult = {
  status: "sent" | "skipped" | "failed";
  deliveredCount: number;
  failedCount: number;
  deliveredSubscriptionIds: string[];
  reason?: string;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  alreadyDeliveredSubscriptionIds: string[] = []
): Promise<PushDeliveryResult> {
  if (!(await ensureConfigured())) {
    return {
      status: "failed",
      deliveredCount: 0,
      failedCount: 1,
      deliveredSubscriptionIds: alreadyDeliveredSubscriptionIds,
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
      deliveredSubscriptionIds: alreadyDeliveredSubscriptionIds,
      reason: "Subscription lookup failed",
    };
  }

  if (!subs || subs.length === 0) {
    return alreadyDeliveredSubscriptionIds.length > 0
      ? {
          status: "sent",
          deliveredCount: alreadyDeliveredSubscriptionIds.length,
          failedCount: 0,
          deliveredSubscriptionIds: alreadyDeliveredSubscriptionIds,
        }
      : {
          status: "skipped",
          deliveredCount: 0,
          failedCount: 0,
          deliveredSubscriptionIds: [],
          reason: "No subscribed devices",
        };
  }

  const alreadyDelivered = new Set(alreadyDeliveredSubscriptionIds);
  const pendingSubscriptions = subs.filter((sub) => !alreadyDelivered.has(sub.id));

  if (pendingSubscriptions.length === 0) {
    return {
      status: "sent",
      deliveredCount: alreadyDeliveredSubscriptionIds.length,
      failedCount: 0,
      deliveredSubscriptionIds: alreadyDeliveredSubscriptionIds,
    };
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  const payloadWithBadge = { ...payload, badgeCount: unreadCount ?? 0 };

  const results = await Promise.all(
    pendingSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payloadWithBadge)
        );
        return { id: sub.id, status: "sent" as const };
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          return { id: sub.id, status: "expired" as const };
        }
        console.error("Push send failed:", err);
        return { id: sub.id, status: "failed" as const };
      }
    })
  );

  const newlyDeliveredIds = results
    .filter((result) => result.status === "sent")
    .map((result) => result.id);
  const deliveredSubscriptionIds = [...new Set([...alreadyDeliveredSubscriptionIds, ...newlyDeliveredIds])];
  const deliveredCount = newlyDeliveredIds.length;
  const failedCount = results.filter((result) => result.status === "failed").length;
  const expiredCount = results.filter((result) => result.status === "expired").length;

  if (failedCount > 0) {
    return {
      status: "failed",
      deliveredCount,
      failedCount,
      deliveredSubscriptionIds,
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
      deliveredSubscriptionIds,
      reason: expiredCount > 0 ? "Subscribed devices had expired" : "No subscribed devices",
    };
  }

  return { status: "sent", deliveredCount, failedCount: 0, deliveredSubscriptionIds };
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
) {
  await Promise.all(
    Array.from(new Set(userIds)).map((id) => sendPushToUser(id, payload))
  );
}
