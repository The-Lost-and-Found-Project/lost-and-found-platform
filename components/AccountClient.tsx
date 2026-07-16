"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";

export default function AccountClient({
  email,
  createdAt,
}: {
  email: string;
  createdAt: string;
}) {
  const supabase = createClient();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleResetPassword() {
    setStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Account
      </h1>
      <p className="mt-2 text-gray-600">
        Manage your login details and account security.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-500">Email</p>
          <p className="mt-1 text-gray-900">{email}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500">Member since</p>
          <p className="mt-1 text-gray-900">
            {new Date(createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm font-medium text-gray-900">Password</p>
          <p className="mt-1 text-sm text-gray-600">
            Send yourself a secure link to reset your password.
          </p>
          <button
            onClick={handleResetPassword}
            disabled={status === "sending" || status === "sent"}
            className="mt-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
          >
            {status === "sent"
              ? "Reset link sent"
              : status === "sending"
              ? "Sending..."
              : "Send password reset email"}
          </button>
          {status === "error" && (
            <p className="mt-2 text-sm text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
