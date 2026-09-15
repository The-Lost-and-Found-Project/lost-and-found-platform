"use client";

import { useState } from "react";
import { createLiveSession } from "@/app/admin/studies/actions";

type Study = { id: string; title: string; ministry_slug: string | null };
type Facilitator = { id: string; full_name: string | null; email: string | null };
type Ministry = { slug: string; title: string };

export default function LiveStudySessionForm({
  studies,
  facilitators,
  ministries,
}: {
  studies: Study[];
  facilitators: Facilitator[];
  ministries: Ministry[];
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const startLocal = String(formData.get("scheduled_start_local") || "");
      const endLocal = String(formData.get("scheduled_end_local") || "");
      if (!startLocal) throw new Error("Choose a start date and time.");
      formData.set("scheduled_start", new Date(startLocal).toISOString());
      if (endLocal) formData.set("scheduled_end", new Date(endLocal).toISOString());
      await createLiveSession(formData);
      setMessage("Live study scheduled. You can create its Google Meet below.");
      const form = document.getElementById("live-study-session-form") as HTMLFormElement | null;
      form?.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to schedule the live study.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="live-study-session-form" action={submit} className="lfp-card mt-6 grid gap-4 p-6 sm:grid-cols-2">
      <label className="text-sm font-bold sm:col-span-2">
        Bible study
        <select required name="bible_study_id" className="mt-1 w-full rounded-xl border p-3">
          <option value="">Choose a study</option>
          {studies.map((study) => (
            <option key={study.id} value={study.id}>{study.title}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Ministry
        <select required name="ministry_slug" className="mt-1 w-full rounded-xl border p-3">
          <option value="">Choose ministry</option>
          {ministries.map((ministry) => (
            <option key={ministry.slug} value={ministry.slug}>{ministry.title}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Facilitator
        <select name="facilitator_user_id" className="mt-1 w-full rounded-xl border p-3">
          <option value="">Organizer only for now</option>
          {facilitators.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name || person.email || "L&F member"}{person.email ? ` · ${person.email}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-bold">
        Starts
        <input required name="scheduled_start_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3" />
      </label>
      <label className="text-sm font-bold">
        Ends
        <input name="scheduled_end_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3" />
      </label>
      <p className="text-sm text-slate-500 sm:col-span-2">
        Times are saved using your device&apos;s local timezone. Creating the schedule does not start a meeting or notify members.
      </p>
      {message && <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold sm:col-span-2">{message}</p>}
      <button disabled={pending} className="lfp-button bg-slate-950 text-white sm:col-span-2 disabled:opacity-60">
        {pending ? "Scheduling…" : "Schedule Live Study"}
      </button>
    </form>
  );
}
