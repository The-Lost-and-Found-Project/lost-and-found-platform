"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getSafeDestination() {
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.includes("\\")
    ? requested
    : "/study";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) {
        router.replace(getSafeDestination());
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        signInError.code === "email_not_confirmed"
          ? "Please confirm your email address before signing in."
          : "We could not sign you in with those credentials."
      );
      setLoading(false);
      return;
    }

    router.replace(getSafeDestination());
    router.refresh();
  }

  return (
    <main className="shell">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="eyebrow">Emmaus</p>
        <h1 id="login-title">Sign in</h1>
        <p className="lede">Continue reading, discovering, and studying Scripture.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="auth-error" role="alert">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
