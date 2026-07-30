"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "member", label: "Community Member" },
  { value: "prayer_team", label: "Community Prayer Member" },
  { value: "pastor", label: "Community Mentor" },
  { value: "admin", label: "Community Admin" },
];

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
  rotation_status?: string | null;
  reinstatement_requested_at?: string | null;
};

type Props = {
  users: UserRow[];
  currentUserId: string;
};

export default function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleRoleChange(userId: string, role: string) {
    setError("");
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        setUsers(previous);
        setError(body?.error ?? "Failed to update role");
      }
    } catch {
      setUsers(previous);
      setError("Failed to update role");
    } finally {
      setPendingId(null);
    }
  }

  async function handleActiveToggle(userId: string, isActive: boolean) {
    setError("");
    const previous = users;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u))
    );
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      const body = await res.json();
      if (!res.ok) {
        setUsers(previous);
        setError(body?.error ?? "Failed to update account status");
      }
    } catch {
      setUsers(previous);
      setError("Failed to update account status");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(userId: string) {
    setError("");
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to delete user");
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch {
      setError("Failed to delete user");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  async function handleApproveReinstatement(userId: string) {
    setError("");
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/approve-reinstatement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to approve reinstatement");
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, rotation_status: "active", reinstatement_requested_at: null }
              : u
          )
        );
      }
    } catch {
      setError("Failed to approve reinstatement");
    } finally {
      setPendingId(null);
    }
  }

  const pendingReinstatements = users.filter(
    (u) => u.rotation_status === "inactive" && u.reinstatement_requested_at
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-2 text-gray-600">
            Promote members to the care team, deactivate an account, or
            permanently delete one.
          </p>
        </div>
        <a
          href="/admin"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Prayer Care Admin
        </a>
      </div>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {pendingReinstatements.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Pending Reinstatement Requests
          </h2>
          <p className="mt-1 text-xs text-amber-700">
            These members were marked inactive after being paused for 30+
            days and have asked to be reinstated to the prayer rotation.
          </p>
          <div className="mt-3 space-y-2">
            {pendingReinstatements.map((u) => {
              const isPending = pendingId === u.id;
              const accessibleName = u.full_name ?? u.email ?? "unnamed user";
              return (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-sm text-gray-900">
                    {u.full_name ?? u.email ?? "Unnamed"}
                  </span>
                  <button
                    type="button"
                    aria-label={`Approve reinstatement for ${accessibleName}`}
                    disabled={isPending}
                    onClick={() => handleApproveReinstatement(u.id)}
                    className="min-h-11 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isPending ? "Approving..." : "Approve Reinstatement"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table layout for wider screens — narrow phones use the stacked
          cards below instead, since columns of user data don't fit a
          phone-width viewport without forcing horizontal scrolling. */}
      <div className="mt-6 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm sm:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isPending = pendingId === u.id;
              const isConfirming = confirmingId === u.id;
              const accessibleName = u.full_name ?? u.email ?? "unnamed user";
              return (
                <tr key={u.id} className={u.is_active ? "" : "bg-gray-50 opacity-60"}>
                  <td className="px-4 py-3 text-gray-900">
                    {u.full_name ?? "Unnamed"}
                    {isSelf && (
                      <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.email ? (
                      <a
                        href={`mailto:${u.email}`}
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {u.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Role for ${accessibleName}`}
                      value={u.role ?? "member"}
                      disabled={isSelf || isPending}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="min-h-11 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Account status for ${accessibleName}`}
                      value={u.is_active ? "active" : "deactivated"}
                      disabled={isSelf || isPending}
                      onChange={(e) =>
                        handleActiveToggle(u.id, e.target.value === "active")
                      }
                      className={`min-h-11 rounded-md border px-2 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                        u.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivate</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? null : isConfirming ? (
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button
                          type="button"
                          aria-label={`Confirm deletion of ${accessibleName}`}
                          disabled={isPending}
                          onClick={() => handleDelete(u.id)}
                          className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {isPending ? "Deleting…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Cancel deletion of ${accessibleName}`}
                          disabled={isPending}
                          onClick={() => setConfirmingId(null)}
                          className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete account for ${accessibleName}`}
                        disabled={isPending}
                        onClick={() => setConfirmingId(u.id)}
                        className="min-h-11 px-2 text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stacked cards for narrow phone screens. */}
      <div className="mt-6 space-y-3 sm:hidden">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const isPending = pendingId === u.id;
          const isConfirming = confirmingId === u.id;
          const accessibleName = u.full_name ?? u.email ?? "unnamed user";
          return (
            <div
              key={u.id}
              className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
                u.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                {u.full_name ?? "Unnamed"}
                {isSelf && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    You
                  </span>
                )}
              </div>
              {u.email ? (
                <a
                  href={`mailto:${u.email}`}
                  className="mt-0.5 block break-all text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {u.email}
                </a>
              ) : (
                <p className="mt-0.5 text-sm text-gray-400">N/A</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <select
                  aria-label={`Role for ${accessibleName}`}
                  value={u.role ?? "member"}
                  disabled={isSelf || isPending}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="min-h-11 min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={`Account status for ${accessibleName}`}
                  value={u.is_active ? "active" : "deactivated"}
                  disabled={isSelf || isPending}
                  onChange={(e) =>
                    handleActiveToggle(u.id, e.target.value === "active")
                  }
                  className={`min-h-11 min-w-0 flex-1 rounded-md border px-2 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                    u.is_active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivate</option>
                </select>
              </div>

              {!isSelf && (
                <div className="mt-3">
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Permanently delete this account?
                      </span>
                      <button
                        type="button"
                        aria-label={`Confirm deletion of ${accessibleName}`}
                        disabled={isPending}
                        onClick={() => handleDelete(u.id)}
                        className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {isPending ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        aria-label={`Cancel deletion of ${accessibleName}`}
                        disabled={isPending}
                        onClick={() => setConfirmingId(null)}
                        className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete account for ${accessibleName}`}
                      disabled={isPending}
                      onClick={() => setConfirmingId(u.id)}
                      className="min-h-11 px-2 text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      Delete account
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isSelfNoteVisible(users, currentUserId) && (
        <p className="mt-4 text-xs text-gray-400">
          You can't change your own role, deactivate, or delete your own
          account from this page — have another admin do it if needed.
        </p>
      )}
    </div>
  );
}

function isSelfNoteVisible(users: UserRow[], currentUserId: string) {
  return users.some((u) => u.id === currentUserId);
}
