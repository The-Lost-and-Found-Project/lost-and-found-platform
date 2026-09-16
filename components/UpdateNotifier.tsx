"use client";

import { useEffect, useRef, useState } from "react";

const BUILD_KEY = "lfp-active-build";

export default function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const latestBuild = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    let active = true;
    async function checkForUpdate() {
      try {
        const res = await fetch(`/api/build-info?t=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
        if (!res.ok) return;
        const { buildId } = await res.json();
        if (!active || !buildId || buildId === "dev") return;
        latestBuild.current = buildId;
        const activeBuild = window.localStorage.getItem(BUILD_KEY);
        if (!activeBuild) {
          window.localStorage.setItem(BUILD_KEY, buildId);
          return;
        }
        if (buildId !== activeBuild) {
          setUpdateAvailable(true);
          setDismissed(false);
        }
      } catch {}
    }
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    function handleVisibility() { if (document.visibilityState === "visible") checkForUpdate(); }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { active = false; clearInterval(interval); document.removeEventListener("visibilitychange", handleVisibility); };
  }, []);

  async function activateUpdate() {
    if (reloading.current) return;
    reloading.current = true;
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(async registration => {
          await registration.update().catch(() => {});
          registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        }));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("next-") || key.startsWith("workbox-") || key.startsWith("lfp-")).map(key => caches.delete(key)));
      }
      if (latestBuild.current) window.localStorage.setItem(BUILD_KEY, latestBuild.current);
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.set("_build", latestBuild.current?.slice(0, 12) || Date.now().toString());
      window.location.replace(url.toString());
    }
  }

  if (!updateAvailable || dismissed) return null;
  return <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-sm" style={{marginBottom:"env(safe-area-inset-bottom)"}}><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl ring-1 ring-slate-950/5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg text-indigo-700">↻</div><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-950">Update ready</p><p className="mt-0.5 text-xs leading-5 text-slate-600">A newer version of The Lost & Found Project is ready.</p></div></div><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={()=>setDismissed(true)} className="rounded-xl px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Later</button><button type="button" onClick={activateUpdate} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-slate-800">Update now</button></div></div></div>;
}
