"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "member", label: "Community Member" },
  { value: "prayer_team", label: "Community Prayer Member" },
  { value: "pastor", label: "Community Mentor" },
  { value: "admin", label: "Community Admin" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited" },
  { value: "away", label: "Away" },
  { value: "inactive", label: "Inactive" },
];

const CARE_ROLES = ["prayer_team", "pastor", "admin"];

function formatJoinedDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${Number(month)}/${Number(day)}/${year}`;
}

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
  rotation_status?: string | null;
  ministry_availability?: string | null;
  missed_assignment_count?: number;
  availability_review_required?: boolean;
  reinstatement_requested_at?: string | null;
  active_responsibility_count?: number;
};

type DirectoryView = "review" | "care" | "members" | "inactive" | "all";

type Props = {
  users: UserRow[];
  currentUserId: string;
};

export default function AdminUsersClient({ users: initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [directoryView, setDirectoryView] = useState<DirectoryView>(() =>
    initialUsers.some((u) => u.availability_review_required || u.reinstatement_requested_at)
      ? "review"
      : "care"
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deactivationReview, setDeactivationReview] = useState<{ userId: string; count: number } | null>(null);
  const [roleChangeReview, setRoleChangeReview] = useState<{
    userId: string;
    role: string;
    count: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleRoleChange(
    userId: string,
    role: string,
    responsibilityAction?: "bulk_reassign" | "return_to_queue"
  ) {
    setError("");
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role, responsibilityAction }),
      });
      const body = await res.json();
      if (res.status === 409 && body?.code === "ACTIVE_RESPONSIBILITIES") {
        setUsers(previous);
        setRoleChangeReview({ userId, role, count: body.count ?? 0 });
      } else if (!res.ok) {
        setUsers(previous);
        setError(body?.error ?? "Failed to update role");
      } else {
        setUsers((current) => current.map((u) => u.id === userId ? {
          ...u,
          role,
          ministry_availability: body?.ministryAvailability ?? u.ministry_availability,
          active_responsibility_count: CARE_ROLES.includes(role) ? u.active_responsibility_count : 0,
        } : u));
        setRoleChangeReview(null);
      }
    } catch {
      setUsers(previous);
      setError("Failed to update role");
    } finally {
      setPendingId(null);
    }
  }

  async function handleActiveToggle(userId: string, isActive: boolean, responsibilityAction?: "bulk_reassign" | "return_to_queue") {
    setError("");
    setPendingId(userId);

    try {
      const res = await fetch("/api/admin/users/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive, responsibilityAction }),
      });
      const body = await res.json();
      if (res.status === 409 && body?.code === "ACTIVE_RESPONSIBILITIES") {
        setDeactivationReview({ userId, count: body.count ?? 0 });
        return;
      }
      if (!res.ok) {
        setError(body?.error ?? "Failed to update account status");
      } else {
        setUsers((prev) => prev.map((u) => u.id === userId ? {
          ...u,
          is_active: isActive,
          ministry_availability: isActive ? u.ministry_availability : "inactive",
          active_responsibility_count: isActive ? u.active_responsibility_count : 0,
        } : u));
        setDeactivationReview(null);
      }
    } catch {
      setError("Failed to update account status");
    } finally {
      setPendingId(null);
    }
  }

  async function handleAvailabilityChange(userId: string, availability: string) {
    setError("");
    setPendingId(userId);
    try {
      const res = await fetch("/api/admin/users/set-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, availability }),
      });
      const body = await res.json();
      if (!res.ok) setError(body?.error ?? "Failed to update ministry availability");
      else setUsers((prev) => prev.map((u) => u.id === userId ? {
        ...u,
        ministry_availability: availability,
        availability_review_required: false,
        active_responsibility_count: availability === "available" ? u.active_responsibility_count : 0,
      } : u));
    } catch {
      setError("Failed to update ministry availability");
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
              ? { ...u, rotation_status: "active", ministry_availability: "available", availability_review_required: false, reinstatement_requested_at: null }
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
  const reviewCount = users.filter(
    (u) => u.availability_review_required || u.reinstatement_requested_at
  ).length;
  const careCount = users.filter((u) => CARE_ROLES.includes(u.role ?? "member") && u.is_active).length;
  const memberCount = users.filter((u) => !CARE_ROLES.includes(u.role ?? "member") && u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = users.filter((u) => {
    const matchesQuery = !normalizedQuery ||
      `${u.full_name ?? ""} ${u.email ?? ""}`.toLowerCase().includes(normalizedQuery);
    if (!matchesQuery) return false;
    if (directoryView === "review") {
      return Boolean(u.availability_review_required || u.reinstatement_requested_at);
    }
    if (directoryView === "care") return CARE_ROLES.includes(u.role ?? "member") && u.is_active;
    if (directoryView === "members") return !CARE_ROLES.includes(u.role ?? "member") && u.is_active;
    if (directoryView === "inactive") return !u.is_active;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">People &amp; Roles</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">Manage people safely</h1>
          <p className="mt-2 text-gray-600">
            Manage account access separately from ministry availability and assignment responsibility.
          </p>
        </div>
        <a
          href="/admin"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Admin Center
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

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="People summary">
        <DirectoryStat label="Needs review" value={reviewCount} tone={reviewCount > 0 ? "attention" : "neutral"} />
        <DirectoryStat label="Care team" value={careCount} tone="care" />
        <DirectoryStat label="Members" value={memberCount} tone="neutral" />
        <DirectoryStat label="Login inactive" value={inactiveCount} tone="inactive" />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="People directory filters">
        <label htmlFor="user-directory-search" className="block text-xs font-bold uppercase tracking-wide text-slate-500">
          Search people
        </label>
        <input
          id="user-directory-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or email"
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Directory view">
          {([
            ["review", `Review (${reviewCount})`],
            ["care", `Care team (${careCount})`],
            ["members", `Members (${memberCount})`],
            ["inactive", `Inactive (${inactiveCount})`],
            ["all", `All (${users.length})`],
          ] as [DirectoryView, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={directoryView === value}
              onClick={() => setDirectoryView(value)}
              className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition ${
                directoryView === value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500" role="status" aria-live="polite">
          Showing {visibleUsers.length} {visibleUsers.length === 1 ? "person" : "people"}.
        </p>
      </section>

      {pendingReinstatements.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Pending Reinstatement Requests
          </h2>
          <p className="mt-1 text-xs text-amber-700">
            These legacy requests remain available for review. New unattended assignments no longer deactivate accounts automatically.
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
      {visibleUsers.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-slate-600">
          No people match this view and search.
        </p>
      )}

      {visibleUsers.length > 0 && (
      <div className="mt-6 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm xl:block">
        <table className="min-w-[68rem] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Access &amp; availability</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleUsers.map((u) => {
              const isSelf = u.id === currentUserId;
              const isPending = pendingId === u.id;
              const isConfirming = confirmingId === u.id;
              const accessibleName = u.full_name ?? u.email ?? "unnamed user";
              const responsibilityCount = u.active_responsibility_count ?? 0;
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
                        className="inline-flex min-h-11 items-center text-indigo-600 hover:text-indigo-500"
                      >
                        {u.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <time dateTime={u.created_at}>{formatJoinedDate(u.created_at)}</time>
                  </td>
                  <td className="space-y-2 px-4 py-3">
                    <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Ministry role</span>
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
                    {roleChangeReview?.userId === u.id && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                        <p>{roleChangeReview.count} active {roleChangeReview.count === 1 ? "responsibility" : "responsibilities"} must move before this role changes.</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleRoleChange(u.id, roleChangeReview.role, "bulk_reassign")} className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white">Bulk reassign</button>
                          <button type="button" onClick={() => handleRoleChange(u.id, roleChangeReview.role, "return_to_queue")} className="min-h-11 rounded-md border border-amber-300 bg-white px-3 py-2 font-semibold">Return to queue</button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Account access</span>
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
                      <option value="active">Login active</option>
                      <option value="deactivated">Deactivate login</option>
                    </select>
                    {CARE_ROLES.includes(u.role ?? "member") ? (
                      <>
                        <span className="mt-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Ministry availability</span>
                        <select
                          aria-label={`Ministry availability for ${accessibleName}`}
                          value={u.ministry_availability ?? "available"}
                          disabled={isPending}
                          onChange={(e) => handleAvailabilityChange(u.id, e.target.value)}
                          className="block min-h-11 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-2 text-sm font-medium text-indigo-700 shadow-sm disabled:opacity-50"
                        >
                          {AVAILABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        {u.availability_review_required && <p className="text-xs font-semibold text-amber-700">Human review required · {u.missed_assignment_count ?? 0} missed</p>}
                        <p className={`mt-2 text-xs font-semibold ${responsibilityCount > 0 ? "text-amber-700" : "text-slate-500"}`}>
                          {responsibilityCount} active care {responsibilityCount === 1 ? "responsibility" : "responsibilities"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">No ministry assignments</p>
                    )}
                    {deactivationReview?.userId === u.id && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                        <p>{deactivationReview.count} active {deactivationReview.count === 1 ? "responsibility" : "responsibilities"} must move first.</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleActiveToggle(u.id, false, "bulk_reassign")} className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white">Bulk reassign</button>
                          <button type="button" onClick={() => handleActiveToggle(u.id, false, "return_to_queue")} className="min-h-11 rounded-md border border-amber-300 bg-white px-3 py-2 font-semibold">Return to queue</button>
                        </div>
                      </div>
                    )}
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
      )}

      {/* Stacked cards keep every control readable until the full table fits. */}
      <div className="mt-6 space-y-3 xl:hidden">
        {visibleUsers.map((u) => {
          const isSelf = u.id === currentUserId;
          const isPending = pendingId === u.id;
          const isConfirming = confirmingId === u.id;
          const accessibleName = u.full_name ?? u.email ?? "unnamed user";
          const isCareRole = CARE_ROLES.includes(u.role ?? "member");
          const roleLabel = ROLE_OPTIONS.find((option) => option.value === (u.role ?? "member"))?.label ?? "Community Member";
          const availabilityLabel = AVAILABILITY_OPTIONS.find((option) => option.value === (u.ministry_availability ?? "available"))?.label ?? "Available";
          const responsibilityCount = u.active_responsibility_count ?? 0;
          return (
            <details
              key={u.id}
              className={`group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${
                u.is_active ? "" : "opacity-60"
              }`}
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-start gap-3 p-4 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-black text-gray-950">
                    {u.full_name ?? "Unnamed"}
                    {isSelf && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">You</span>}
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{u.email ?? "No email address"}</span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">{roleLabel}</span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {u.is_active ? "Login active" : "Login inactive"}
                    </span>
                    {isCareRole && (
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700">{availabilityLabel}</span>
                    )}
                    {responsibilityCount > 0 && (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">
                        {responsibilityCount} active {responsibilityCount === 1 ? "request" : "requests"}
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-open:rotate-180" aria-hidden="true">⌄</span>
              </summary>

              <div className="border-t border-slate-200 p-4">
              {u.email ? (
                <a
                  href={`mailto:${u.email}`}
                  className="inline-flex min-h-11 items-center break-all text-sm font-medium text-indigo-700 hover:text-indigo-600"
                >
                  {u.email}
                </a>
              ) : (
                <p className="mt-0.5 text-sm text-gray-400">N/A</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Joined <time dateTime={u.created_at}>{formatJoinedDate(u.created_at)}</time>
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ministry role
                  <select
                    aria-label={`Role for ${accessibleName}`}
                    value={u.role ?? "member"}
                    disabled={isSelf || isPending}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Account access
                  <select
                    aria-label={`Account status for ${accessibleName}`}
                    value={u.is_active ? "active" : "deactivated"}
                    disabled={isSelf || isPending}
                    onChange={(e) => handleActiveToggle(u.id, e.target.value === "active")}
                    className={`mt-1 min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-medium normal-case tracking-normal shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${u.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}
                  >
                    <option value="active">Login active</option>
                    <option value="deactivated">Deactivate login</option>
                  </select>
                </label>
                {isCareRole && (
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 sm:col-span-2">
                    Ministry availability
                    <select
                      aria-label={`Ministry availability for ${accessibleName}`}
                      value={u.ministry_availability ?? "available"}
                      disabled={isPending}
                      onChange={(e) => handleAvailabilityChange(u.id, e.target.value)}
                      className="mt-1 min-h-11 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium normal-case tracking-normal text-indigo-800 shadow-sm disabled:opacity-50"
                    >
                      {AVAILABILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                )}
              </div>

              {isCareRole ? (
                <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${responsibilityCount > 0 ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-600"}`}>
                  {responsibilityCount > 0
                    ? `${responsibilityCount} active care ${responsibilityCount === 1 ? "responsibility" : "responsibilities"}. These must be reassigned or returned to the team queue before role removal or login deactivation.`
                    : "No active care responsibilities."}
                </p>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No ministry assignment controls for this role.</p>
              )}
              {u.availability_review_required && isCareRole && <p className="mt-2 text-sm font-semibold text-amber-700">Human review required · {u.missed_assignment_count ?? 0} missed assignments</p>}
              {roleChangeReview?.userId === u.id && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p>{roleChangeReview.count} active {roleChangeReview.count === 1 ? "responsibility" : "responsibilities"} must move before this role changes.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleRoleChange(u.id, roleChangeReview.role, "bulk_reassign")} className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white">Bulk reassign</button>
                    <button type="button" onClick={() => handleRoleChange(u.id, roleChangeReview.role, "return_to_queue")} className="min-h-11 rounded-md border border-amber-300 bg-white px-3 py-2 font-semibold">Return to queue</button>
                  </div>
                </div>
              )}
              {deactivationReview?.userId === u.id && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <p>{deactivationReview.count} active {deactivationReview.count === 1 ? "responsibility" : "responsibilities"} must move before deactivation.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleActiveToggle(u.id, false, "bulk_reassign")} className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 font-semibold text-white">Bulk reassign</button>
                    <button type="button" onClick={() => handleActiveToggle(u.id, false, "return_to_queue")} className="min-h-11 rounded-md border border-amber-300 bg-white px-3 py-2 font-semibold">Return to queue</button>
                  </div>
                </div>
              )}

              {!isSelf && (
                <div className="mt-3">
                  {isConfirming ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-900">Permanently delete this login and profile?</p>
                      <p className="mt-1 text-xs leading-5 text-red-800">
                        This cannot be undone. {responsibilityCount > 0 ? `${responsibilityCount} active care ${responsibilityCount === 1 ? "responsibility will" : "responsibilities will"} be reassigned automatically.` : "There are no active care responsibilities."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
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
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete account for ${accessibleName}`}
                      disabled={isPending}
                      onClick={() => setConfirmingId(u.id)}
                      className="min-h-11 px-2 text-xs font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                    >
                      Permanently delete account
                    </button>
                  )}
                </div>
              )}
              </div>
            </details>
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

function DirectoryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "attention" | "care" | "inactive";
}) {
  const toneClasses = {
    neutral: "border-slate-200 bg-white text-slate-950",
    attention: "border-amber-200 bg-amber-50 text-amber-950",
    care: "border-indigo-200 bg-indigo-50 text-indigo-950",
    inactive: "border-rose-200 bg-rose-50 text-rose-950",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}
