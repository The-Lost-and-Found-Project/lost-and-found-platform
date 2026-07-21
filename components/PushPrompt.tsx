"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Push notifications were previously only discoverable by a member digging
// into Settings on their own. This is a one-time, dismissible nudge shown on
// the Dashboard (the default landing page after sign-in) inviting them to
// turn push on right away instead. Once enabled or dismissed, it stays
// hidden — this should never nag.
const DISMISSED_KEY = "lf-push-prompt-dismissed";

// iOS only exposes the Push API to a site once it's been added to the Home
// Screen (running in standalone/PWA mode) — in a normal Safari tab,
// `"PushManager" in window` is simply false. Without this check the whole
// component silently renders nothing for the many members on iPhone who
// haven't installed the app yet, so they never even learn push notifications
// are an option. This is a separate, milder nudge pointing them to Settings
// (where the actual "Add to Home Screen" steps live) instead.
const IOS_INSTALL_DISMISSED_KEY = "lf-push-prompt-ios-install-dismissed";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true || window.matchMedia?.("(display-mode: standalone)").matches
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [needsIosInstall, setNeedsIosInstall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      const isIOS = isIosDevice();
      const isStandalone = isStandaloneDisplay();

      // iPhone/iPad, not yet added to the Home Screen: the Push API isn't
      // available at all here, so don't even attempt the feature-detection
      // below — just offer the lighter "install first" nudge instead.
      if (isIOS && !isStandalone) {
        if (localStorage.getItem(IOS_INSTALL_DISMISSED_KEY)) return;
        if (active) {
          setNeedsIosInstall(true);
          setVisible(true);
        }
        return;
      }

      if (localStorage.getItem(DISMISSED_KEY)) return;

      const isSupported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!isSupported) return;

      // Already decided one way or another (granted+subscribed, or
      // explicitly denied) — nothing useful to prompt for.
      if (Notification.permission === "denied") return;

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = await registration?.pushManager.getSubscription();
        if (existing && Notification.permission === "granted") return;
      } catch {
        // Fall through and still offer the prompt.
      }

      if (active) setVisible(true);
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  function dismiss() {
    localStorage.setItem(
      needsIosInstall ? IOS_INSTALL_DISMISSED_KEY : DISMISSED_KEY,
      "1"
    );
    setVisible(false);
  }

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
        dismiss();
        return;
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
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      dismiss();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong turning on push notifications."
      );
      setBusy(false);
    }
  }

  if (!visible) return null;

  if (needsIosInstall) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            Get notified the moment someone prays for you
          </p>
          <p className="mt-1 text-sm text-gray-600">
            On iPhone, push notifications only work once this app is added to
            your Home Screen. See{" "}
            <Link
              href="/settings"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Settings
            </Link>{" "}
            for how, then turn push notifications on from there.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full px-3 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          Get notified the moment someone prays for you
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Turn on push notifications for this device. You can change this
          anytime in Settings.
        </p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full px-3 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
        >
          {busy ? "Enabling..." : "Enable"}
        </button>
      </div>
    </div>
  );
}
