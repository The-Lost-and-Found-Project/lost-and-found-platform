"use client";

import { useEffect, useRef, useState } from "react";

// Detects when a newer version of the app has been deployed and lets the
// member choose when to pick it up, instead of requiring them to fully
// close and reopen the app. This works independently of the push-notification
// service worker (which most members never register) — it's a plain poll of
// /api/build-info, which always reports the currently-running deployment's
// commit SHA. No SW, no caching involved, so it covers every visitor.
export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const knownBuildId = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    let active = true;

    async function checkForUpdate() {
      try {
        const res = await fetch("/api/build-info", { cache: "no-store" });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (!active || !buildId || buildId === "dev") return;

        if (knownBuildId.current === null) {
          // First check just establishes the baseline for this page load.
          knownBuildId.current = buildId;
          return;
        }
        if (buildId !== knownBuildId.current) {
          setUpdateAvailable(true);
        }
      } catch {
        // Offline or a blip — just try again on the next interval/visibility
        // change rather than surfacing an error to the member.
      }
    }

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Reopening the installed app (or switching back to its tab) is exactly
    // the moment a member is most likely to be on a stale bundle, so check
    // right away whenever the page becomes visible again.
    function handleVisibility() {
      if (document.visibilityState === "visible") checkForUpdate();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3 shadow-xl ring-1 ring-black/5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="text-sm text-gray-700">
        A new version of the app is available.
      </p>
      <button
        onClick={() => {
          if (reloading.current) return;
          reloading.current = true;
          window.location.reload();
        }}
        className="shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
      >
        Refresh
      </button>
    </div>
  );
}
