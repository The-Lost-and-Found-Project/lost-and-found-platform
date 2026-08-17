"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ResendConfirmationForm from "@/components/ResendConfirmationForm";

function getSafeDestination() {
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.includes("\\")
    ? requested
    : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  // If someone is already signed in and lands on /login (e.g. an old
  // bookmark, a shared link, or just hitting back), send them straight to
  // their dashboard instead of showing them a sign-in form they don't need.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data?.user) {
        router.replace(getSafeDestination());
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const isUnconfirmed = error.code === "email_not_confirmed";
      setEmailNotConfirmed(isUnconfirmed);
      setError(
        isUnconfirmed
          ? "Please confirm your email address before signing in."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(getSafeDestination());
    router.refresh();
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 sm:px-6 sm:py-28">
        <div className="max-w-md text-center">
          <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-inset ring-indigo-100">
            Welcome back
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Sign In
          </h1>
          <p className="mt-4 text-gray-600">
            Sign in to submit prayer requests, celebrate praise, share a
            testimony, and stay connected with the community.
          </p>
        </div>

        <div className="mt-10 w-full max-w-sm rounded-2xl border border-gray-100 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}

            {emailNotConfirmed && (
              <ResendConfirmationForm initialEmail={email} />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don&rsquo;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
