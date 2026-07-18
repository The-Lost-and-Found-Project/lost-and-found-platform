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
};

type Props = {
  users: UserRow[];
  currentUserId: string;
};

export default function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="mt-2 text-gray-600">
            Promote members to the care team, or deactivate an account.
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Prayer Care Admin
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isPending = pendingId === u.id;
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
                      value={u.role ?? "member"}
                      disabled={isSelf || isPending}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
                      value={u.is_active ? "active" : "deactivated"}
                      disabled={isSelf || isPending}
                      onChange={(e) =>
                        handleActiveToggle(u.id, e.target.value === "active")
                      }
                      className={`rounded-md border px-2 py-1 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                        u.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="deactivated">Deactivate</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isSelfNoteVisible(users, currentUserId) && (
        <p className="mt-4 text-xs text-gray-400">
          You can't change your own role or deactivate your own account from
          this page — have another admin do it if needed.
        </p>
      )}
    </div>
  );
}

function isSelfNoteVisible(users: UserRow[], currentUserId: string) {
  return users.some((u) => u.id === currentUserId);
}
