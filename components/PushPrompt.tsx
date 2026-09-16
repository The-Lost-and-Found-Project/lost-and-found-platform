"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureCurrentPushSubscription } from "@/lib/push/client";

const DISMISSED_KEY = "lf-push-prompt-dismissed";
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
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches
  );
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

      if (!isSupported || Notification.permission === "denied") return;

      try {
        if (Notification.permission === "granted") {
          const result = await ensureCurrentPushSubscription();
          if (result.enabled) return;
        }
      } catch {
        // If silent sync fails, leave the prompt available so the member can retry.
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
      const result = await ensureCurrentPushSubscription({ requestPermission: true });
      if (!result.enabled) {
        dismiss();
        return;
      }
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
          Turn on push notifications for this device. You can change this anytime in Settings.
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
