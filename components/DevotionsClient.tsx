"use client";

import { useState } from "react";
import { devotions } from "@/lib/devotions-data";

// Renders the 7-Day Devotional Journey as an accordion of cards, styled to
// match the rest of the app (indigo/violet accents, white cards with a
// subtle border — the same language used by TestimonyTicker and
// PrayerWallTicker) rather than the marketing site's separate black/gold
// theme this content originally used.
export default function DevotionsClient() {
  const [openDay, setOpenDay] = useState<number | null>(1);

  return (
    <div className="mt-6 space-y-4">
      {devotions.map((d) => {
        const isOpen = openDay === d.day;

        return (
          <div
            key={d.day}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpenDay(isOpen ? null : d.day)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Day {d.day}
                  </span>
                  <span className="text-xs italic text-gray-500">
                    {d.verseRef}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-gray-900">
                  {d.title}
                </h3>
                {!isOpen && (
                  <p className="mt-1 text-sm text-gray-500">{d.teaser}</p>
                )}
              </div>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                <div className="rounded-md border-l-4 border-indigo-300 bg-indigo-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Scripture
                  </p>
                  <p className="mt-1 italic text-gray-700">
                    &ldquo;{d.scripture}&rdquo;
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Teaching Point
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">{d.teachingPoint}</p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Relatable Story
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">{d.story}</p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Daily Application
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">{d.application}</p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Reflection Questions
                  </h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {d.reflectionQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 rounded-md border-l-4 border-violet-300 bg-violet-50/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    Prayer
                  </p>
                  <p className="mt-1 italic text-gray-700">{d.prayer}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
