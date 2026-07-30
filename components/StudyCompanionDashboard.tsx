"use client";

import { useState, useTransition } from "react";
import { updateCompanionFeaturePreference } from "@/app/study-companion/actions";
import type { CompanionFeature } from "@/lib/study-companion/access";

export default function StudyCompanionDashboard({
  initialFeatures,
}: {
  initialFeatures: CompanionFeature[];
}) {
  const [features, setFeatures] = useState(initialFeatures);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const chatEnabled =
    features.find((feature) => feature.featureKey === "chat")?.enabled ?? false;

  function toggleFeature(featureKey: string, enabled: boolean) {
    if (isPending) return;

    const previous = features;
    setFeatures((current) =>
      current.map((feature) =>
        feature.featureKey === featureKey
          ? { ...feature, enabled }
          : feature
      )
    );
    setError(null);

    startTransition(async () => {
      try {
        await updateCompanionFeaturePreference(featureKey, enabled);
      } catch {
        setFeatures(previous);
        setError("That preference could not be saved. Please try again.");
      }
    });
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Private Alpha · Owner Only
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Study Companion
            </h1>
            <p className="mt-3 text-gray-600">
              A quiet workspace for Scripture-centered study, reflection, and
              prayer. Each module can be turned on or off independently.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Secure owner access is active
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Study Chat
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Text interface placeholder
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  chatEnabled
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {chatEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="mt-6 min-h-72 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5">
              {chatEnabled ? (
                <div className="max-w-lg rounded-2xl rounded-tl-sm bg-white p-4 text-sm text-gray-700 shadow-sm">
                  When the secure study engine is connected, your conversation
                  will begin here with a discovery question.
                </div>
              ) : (
                <div className="flex min-h-60 items-center justify-center text-center">
                  <div>
                    <p className="font-medium text-gray-700">
                      Study Chat is turned off
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Enable it in your modules to show this workspace.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <label htmlFor="study-message" className="sr-only">
                Study message
              </label>
              <input
                id="study-message"
                disabled
                placeholder={
                  chatEnabled
                    ? "AI connection comes after the security foundation…"
                    : "Enable Study Chat to use this area"
                }
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Your modules
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your choices stay within the access limits assigned to your role.
            </p>

            <div className="mt-5 divide-y divide-gray-100">
              {features.map((feature) => {
                return (
                  <div
                    key={feature.featureKey}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-label={feature.title}
                      aria-checked={feature.enabled}
                      disabled={isPending}
                      onClick={() =>
                        toggleFeature(feature.featureKey, !feature.enabled)
                      }
                      className="relative -my-2 h-11 w-11 shrink-0 disabled:opacity-60"
                    >
                      <span
                        className={`absolute inset-x-0 top-2.5 h-6 rounded-full transition ${
                          feature.enabled
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            feature.enabled ? "left-5" : "left-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
