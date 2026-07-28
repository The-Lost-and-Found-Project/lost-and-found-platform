"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Mounted once, globally (see app/layout.tsx), so it checks the signed-in
// user's rotation_status on every fresh app open, per Chad's spec: a
// member paused for neglecting an assignment gets a popup with a
// self-service "Unpause" option (30-day window), and a member who's
// fallen all the way through to 'inactive' gets a popup with a "Reactivate"
// option that submits a request pending admin approval. Regular members
// (rotation_status stays 'active' by default) never see this — it's a
// no-op for them. Dismissing just closes it for the current app session;
// it'll check again next time the app is opened, since nothing here is
// persisted to localStorage.
export default function RotationStatusModal() {
  const supabase = createClient();
  const [status, setStatus] = useState<string | null>(null);
  const [reinstatementRequestedAt, setReinstatementRequestedAt] = useState<
    string | null
  >(null);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("rotation_status, reinstatement_requested_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setStatus(profile.rotation_status ?? "active");
        setReinstatementRequestedAt(profile.reinstatement_requested_at ?? null);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnpause() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/rotation/unpause", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to unpause your account");
      } else {
        setDismissed(true);
      }
    } catch {
      setError("Failed to unpause your account");
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestReinstatement() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/rotation/request-reinstatement", {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to request reinstatement");
      } else {
        setReinstatementRequestedAt(new Date().toISOString());
      }
    } catch {
      setError("Failed to request reinstatement");
    } finally {
      setBusy(false);
    }
  }

  if (dismissed || (status !== "paused_neglect" && status !== "inactive")) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {status === "paused_neglect" && (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              You&apos;ve been paused from the prayer rotation
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              It looks like an assignment went 7+ days without an update, so
              you&apos;ve been paused from receiving new prayer requests and
              what you had was reassigned. You can unpause anytime in the
              next 30 days — after that your account moves to inactive.
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={handleUnpause}
                disabled={busy}
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                {busy ? "Unpausing..." : "Unpause My Account"}
              </button>
              <button
                onClick={() => setDismissed(true)}
                disabled={busy}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                Later
              </button>
            </div>
          </>
        )}

        {status === "inactive" && (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              Your prayer care team account is inactive
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {reinstatementRequestedAt
                ? "You've requested reinstatement — an admin needs to approve it before you're back in the rotation. You can still use the rest of the app normally in the meantime."
                : "30 days passed without unpausing, so your account moved to inactive. You can request reinstatement any time — an admin will need to approve it. You can still use the rest of the app normally in the meantime."}
            </p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex gap-2">
              {!reinstatementRequestedAt && (
                <button
                  onClick={handleRequestReinstatement}
                  disabled={busy}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
                >
                  {busy ? "Requesting..." : "Reactivate"}
                </button>
              )}
              <button
                onClick={() => setDismissed(true)}
                disabled={busy}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                {reinstatementRequestedAt ? "OK" : "Later"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
