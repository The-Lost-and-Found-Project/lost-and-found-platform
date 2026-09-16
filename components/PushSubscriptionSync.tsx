"use client";

import { useEffect } from "react";
import { ensureCurrentPushSubscription } from "@/lib/push/client";

export default function PushSubscriptionSync() {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // Silent maintenance only. Members who have already granted permission do
    // not need to approve a key rotation again; browsers allow us to replace
    // the subscription while the permission remains granted.
    ensureCurrentPushSubscription().catch((error) => {
      console.warn("Push subscription sync deferred", error);
    });
  }, []);

  return null;
}
