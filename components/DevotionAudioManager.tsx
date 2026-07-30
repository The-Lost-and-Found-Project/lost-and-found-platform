"use client";

import { useState } from "react";
import { buildNarrationText } from "@/lib/devotion-narration";
import type { DevotionAudio, DevotionDay } from "@/lib/devotion-types";

async function readAudioDuration(file: File): Promise<number | null> {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () =>
        resolve(Number.isFinite(audio.duration) ? audio.duration : null);
      audio.onerror = () => resolve(null);
      audio.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function DevotionAudioManager({
  weekId,
  day,
  contentVersion,
  audio,
  onChange,
}: {
  weekId: string;
  day: DevotionDay;
  contentVersion: string;
  audio: DevotionAudio | null;
  onChange: (audio: DevotionAudio | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const isStale = Boolean(audio && audio.content_version !== contentVersion);
  const [voice, setVoice] = useState(audio?.voice ?? "");
  const [narrationText, setNarrationText] = useState(
    audio && !isStale ? audio.narration_text : buildNarrationText(day)
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function upload() {
    if (!file) {
      setError("Choose an audio file first.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const duration = await readAudioDuration(file);
      const form = new FormData();
      form.set("weekId", weekId);
      form.set("dayNumber", String(day.day));
      form.set("narrationText", narrationText);
      form.set("voice", voice);
      if (duration) form.set("durationSeconds", String(duration));
      form.set("file", file);

      const response = await fetch("/api/admin/devotions/audio", {
        method: "POST",
        body: form,
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "The audio could not be saved.");
        return;
      }

      onChange(body.audio as DevotionAudio);
      setFile(null);
      setMessage("Audio devotion saved.");
    } catch (uploadError) {
      console.error("devotion audio upload error:", uploadError);
      setError("The audio could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!audio || !confirm(`Remove the audio for Day ${day.day}: "${day.title}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/devotions/audio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, dayNumber: day.day }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "The audio could not be removed.");
        return;
      }

      onChange(null);
      setMessage("Audio devotion removed.");
    } catch (removeError) {
      console.error("devotion audio removal error:", removeError);
      setError("The audio could not be removed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h5 className="text-sm font-semibold text-gray-900">Listen</h5>
          <p className="text-xs text-gray-600">
            Upload narration recorded from the reviewed script below.
          </p>
        </div>
        {audio && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              isStale
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isStale ? "New audio needed" : `Audio ready · v${audio.audio_version}`}
          </span>
        )}
      </div>

      {isStale && (
        <p role="status" className="mt-3 text-sm text-amber-800">
          The devotion changed after this audio was uploaded. Visitors will see the
          written devotion until replacement audio is ready.
        </p>
      )}

      <label
        htmlFor={`narration-${weekId}-${day.day}`}
        className="mt-4 block text-xs font-medium text-gray-600"
      >
        Narration script
      </label>
      <textarea
        id={`narration-${weekId}-${day.day}`}
        rows={10}
        value={narrationText}
        onChange={(event) => setNarrationText(event.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
      />
      <p className="mt-1 text-xs text-gray-500">
        This script is separate from the devotion fields so spoken transitions can
        sound natural.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-600">
          Voice or narrator
          <input
            type="text"
            value={voice}
            maxLength={100}
            onChange={(event) => setVoice(event.target.value)}
            placeholder="Optional"
            className="mt-1 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Audio file
          <input
            type="file"
            accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/x-wav,audio/webm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 block min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={upload}
          className="min-h-11 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving…" : audio ? "Replace audio" : "Upload audio"}
        </button>
        {audio && (
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="min-h-11 rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Remove audio
          </button>
        )}
      </div>

      <div aria-live="polite" className="mt-2 min-h-5 text-sm">
        {message && <p className="text-emerald-700">{message}</p>}
        {error && <p role="alert" className="text-rose-700">{error}</p>}
      </div>
    </div>
  );
}
