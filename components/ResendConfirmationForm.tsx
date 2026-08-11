"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getConfirmationRedirectUrl } from "@/lib/auth/confirmation";

type ResendConfirmationFormProps = {
  initialEmail?: string;
};

export default function ResendConfirmationForm({
  initialEmail = "",
}: ResendConfirmationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: getConfirmationRedirectUrl(window.location.origin),
      },
    });

    if (error) {
      setIsError(true);
      setMessage(
        error.status === 429
          ? "Please wait a moment before requesting another email."
          : "We could not resend the confirmation email. Please try again."
      );
    } else {
      setMessage(
        "If this address has an unconfirmed account, a new confirmation email is on its way."
      );
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleResend} className="mt-6 space-y-3">
      <div className="text-left">
        <label
          htmlFor="confirmation-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email address
        </label>
        <input
          id="confirmation-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="min-h-11 w-full rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Resend confirmation email"}
      </button>
      {message && (
        <p
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
          className={`rounded-lg px-3 py-2 text-sm ${
            isError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
