"use client";

import { useRef, useState } from "react";
import type { DevotionAudio } from "@/lib/devotion-types";

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function DevotionAudioPlayer({
  audio,
  devotionTitle,
}: {
  audio: DevotionAudio | null;
  devotionTitle: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedSecond = useRef(-1);
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(Boolean(audio));
  const [hasError, setHasError] = useState(false);

  const positionKey = audio
    ? `lfp:devotion-audio:${audio.id}:v${audio.audio_version}:position`
    : null;

  function restorePosition() {
    const player = audioRef.current;
    if (!player || !positionKey) return;

    const saved = Number(window.localStorage.getItem(positionKey));
    if (Number.isFinite(saved) && saved > 0 && saved < player.duration - 3) {
      player.currentTime = saved;
    }
    player.playbackRate = speed;
    setIsLoading(false);
  }

  function savePosition() {
    const player = audioRef.current;
    if (!player || !positionKey) return;

    const wholeSecond = Math.floor(player.currentTime);
    if (wholeSecond === lastSavedSecond.current) return;
    lastSavedSecond.current = wholeSecond;

    if (player.ended || player.duration - player.currentTime < 3) {
      window.localStorage.removeItem(positionKey);
      return;
    }
    window.localStorage.setItem(positionKey, String(player.currentTime));
  }

  function restart() {
    const player = audioRef.current;
    if (!player) return;
    player.currentTime = 0;
    if (positionKey) window.localStorage.removeItem(positionKey);
    void player.play();
  }

  function changeSpeed(value: number) {
    setSpeed(value);
    if (audioRef.current) audioRef.current.playbackRate = value;
  }

  if (!audio) {
    return (
      <div
        className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4"
        aria-label={`Listen to ${devotionTitle}`}
      >
        <div className="flex items-center gap-2">
          <AudioIcon />
          <h4 className="text-sm font-semibold text-gray-900">Listen</h4>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Audio for this devotion isn&rsquo;t available yet. You can continue
          reading the full devotion below.
        </p>
      </div>
    );
  }

  return (
    <section
      className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-4"
      aria-label={`Listen to ${devotionTitle}`}
    >
      <div className="flex items-center gap-2">
        <AudioIcon />
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Listen</h4>
          <p className="text-xs text-gray-600">
            Audio devotion
            {audio.voice ? ` · Voice: ${audio.voice}` : ""}
          </p>
        </div>
      </div>

      {hasError ? (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          The audio could not be loaded. The written devotion remains available below.
        </p>
      ) : (
        <>
          {isLoading && (
            <p role="status" className="mt-3 text-sm text-gray-600">
              Loading audio…
            </p>
          )}
          <audio
            ref={audioRef}
            className="mt-3 w-full"
            controls
            preload="metadata"
            src={audio.audio_url}
            aria-label={`Audio devotion: ${devotionTitle}`}
            onLoadedMetadata={restorePosition}
            onCanPlay={() => setIsLoading(false)}
            onTimeUpdate={savePosition}
            onEnded={savePosition}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          >
            Your browser does not support audio playback.
          </audio>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={restart}
              className="min-h-11 rounded-md border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Restart
            </button>
            <label className="text-sm font-medium text-gray-700">
              Playback speed
              <select
                value={speed}
                onChange={(event) => changeSpeed(Number(event.target.value))}
                className="ml-2 min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2"
                aria-label={`Playback speed for ${devotionTitle}`}
              >
                {PLAYBACK_SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </section>
  );
}

function AudioIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 shrink-0 text-indigo-600"
      aria-hidden="true"
    >
      <path d="M5 9v6h4l5 4V5L9 9H5z" strokeLinejoin="round" />
      <path d="M17 9.5a4 4 0 010 5M19.5 7a7.5 7.5 0 010 10" strokeLinecap="round" />
    </svg>
  );
}
