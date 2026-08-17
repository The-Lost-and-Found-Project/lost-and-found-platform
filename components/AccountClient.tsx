"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleResetPassword() {
    setStatus("sending");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setStatus(error ? "error" : "sent");
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete-self", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setDeleteError(body?.error ?? "Failed to delete your account");
        setDeleting(false);
        return;
      }
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleteError("Failed to delete your account");
      setDeleting(false);
    }
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

      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50/50 p-6 shadow-sm">
        <p className="text-sm font-semibold text-red-800">Danger Zone</p>
        <p className="mt-1 text-sm text-red-700">
          Permanently delete your account. This can&apos;t be undone. If you
          delete your account, your existing community contributions will be
          handled according to the ministry&apos;s privacy and record-retention policy.
        </p>

        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
          >
            Delete My Account
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-red-800">
              Type <span className="font-semibold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full max-w-xs rounded-md border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder="DELETE"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Permanently Delete My Account"}
              </button>
              <button
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteConfirmText("");
                  setDeleteError("");
                }}
                disabled={deleting}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            {deleteError && (
              <p className="text-sm text-red-700">{deleteError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
