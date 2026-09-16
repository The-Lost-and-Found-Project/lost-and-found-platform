"use client";

import { useEffect, useRef, useState } from "react";

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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
          knownBuildId.current = buildId;
          return;
        }
        if (buildId !== knownBuildId.current) {
          setUpdateAvailable(true);
          setDismissed(false);
        }
      } catch {}
    }
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
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

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-950/5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-700" aria-hidden="true">↻</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">Update ready</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">A newer version of The Lost & Found Project is ready.</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => setDismissed(true)} className="rounded-xl px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Later</button>
          <button type="button" onClick={() => { if (reloading.current) return; reloading.current = true; window.location.reload(); }} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800">Update now</button>
        </div>
      </div>
    </div>
  );
}
