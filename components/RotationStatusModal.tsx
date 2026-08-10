"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Ministry availability controls new care assignments only. It never disables
// login; account access remains an explicit administrative decision.
export default function RotationStatusModal() {
  const supabase = useMemo(() => createClient(), []);
  const [availability, setAvailability] = useState<string | null>(null);
  const [missedAssignmentCount, setMissedAssignmentCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("ministry_availability, missed_assignment_count")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        setAvailability(profile?.ministry_availability ?? "available");
        setMissedAssignmentCount(profile?.missed_assignment_count ?? 0);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [supabase]);

  if (dismissed || (availability !== "limited" && availability !== "inactive")) {
    return null;
  }

  const limited = availability === "limited";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {limited ? "New prayer assignments are limited" : "You are not receiving ministry assignments"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {limited
            ? `An unattended request was reassigned so the person receives timely care. Your login and normal app access remain active. ${missedAssignmentCount >= 2 ? "A care leader must review repeated missed assignments before new assignments resume." : "You can return to Available from your Profile when you are ready."}`
            : "Your ministry availability is inactive, but your account and login remain active. An administrator can restore assignment availability after a human review."}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-5 min-h-11 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
