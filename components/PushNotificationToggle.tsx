"use client";

import { useEffect, useState } from "react";

// Converts the VAPID public key (base64url string) into the Uint8Array
// format the Push API's applicationServerKey option expects.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type SupportState = "checking" | "unsupported" | "supported";

export default function PushNotificationToggle() {
  const [support, setSupport] = useState<SupportState>("checking");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) {
        if (active) setSupport("unsupported");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = await registration?.pushManager.getSubscription();
        if (active) {
          setSupport("supported");
          setEnabled(Boolean(existing) && Notification.permission === "granted");
        }
      } catch {
        if (active) setSupport("supported");
      }
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  async function handleEnable() {
    setError("");
    setBusy(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Push notifications aren't configured yet.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setEnabled(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong turning on push notifications."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setError("");
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setEnabled(false);
    } catch {
      setError("Something went wrong turning off push notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (support === "unsupported") {
    return null;
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Push notifications
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Get a notification on this device even when the app isn&apos;t
            open. On iPhone, add the app to your Home Screen first (see
            below) for this to work.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy || support === "checking"}
          onClick={() => (enabled ? handleDisable() : handleEnable())}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
            enabled
              ? "bg-gradient-to-r from-indigo-600 to-violet-600"
              : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
              enabled ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
