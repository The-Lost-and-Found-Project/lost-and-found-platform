"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SocialProvider = "google" | "apple";

const labels: Record<SocialProvider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
};

export default function SocialSignIn({ destination }: { destination: string }) {
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: SocialProvider) {
    setPending(provider);
    setError("");

    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", destination);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    });

    if (oauthError) {
      setError("That sign-in method is not available yet. Please use email for now.");
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {(["google", "apple"] as const).map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={pending !== null}
            onClick={() => signIn(provider)}
            className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {pending === provider ? "Connecting..." : labels[provider]}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-3 py-1" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">or use email</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
