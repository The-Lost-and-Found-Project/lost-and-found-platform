"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

async function handleSignIn(e: React.FormEvent) {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

if (error) {
  setError(error.message);
  setLoading(false);
  return;
}

router.push("/dashboard");
  router.refresh();
}

  async function handleSignUp() {
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <h1 className="text-2xl font-bold text-gray-900">Login</h1>

      <form onSubmit={handleSignIn} className="mt-8 max-w-sm space-y-4">
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
        />
      
      <input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
        />
      
<p className="text-sm text-red-600">{error}</p>

        <p className="text-sm text-green-600">{message}</p>

        <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
        Log in</button>
        
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
        Sign up</button></div>
      </form>
    </div>
    );
}
