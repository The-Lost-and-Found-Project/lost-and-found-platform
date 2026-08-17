"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  { value: "member", label: "Community Member" },
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

function formatJoinedDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${Number(month)}/${Number(day)}/${year}` : value;
}

export default function AdminUsersClient({ users: initialUsers, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function changeRole(userId: string, role: string) {
    setBusyId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Role could not be updated.");
      else setUsers((current) => current.map((member) => member.id === userId ? { ...member, role } : member));
    } catch {
      setError("Role could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeAccess(userId: string, isActive: boolean) {
    setBusyId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users/set-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Account access could not be updated.");
      else setUsers((current) => current.map((member) => member.id === userId ? { ...member, is_active: isActive } : member));
    } catch {
      setError("Account access could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId: string) {
    setBusyId(userId);
    setError("");
    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Account could not be deleted.");
      else setUsers((current) => current.filter((member) => member.id !== userId));
    } catch {
      setError("Account could not be deleted.");
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = users.filter((member) => {
    if (!showInactive && !member.is_active) return false;
    return !normalizedQuery || `${member.full_name ?? ""} ${member.email ?? ""}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Administration</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">People &amp; Roles</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Everyone uses one Community Member identity. Administrative access is the only elevated role managed here.</p>
          <a href="/admin" className="lfp-button mt-7 border border-white/20 bg-white/10 text-white">Back to Administration</a>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <div className="lfp-card p-5 sm:p-7">
          <div className="flex flex-wrap items-end gap-4">
            <label htmlFor="user-directory-search" className="min-w-64 flex-1 text-sm font-black text-slate-800">Find a member
              <input id="user-directory-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or email" className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} /> Show inactive accounts</label>
          </div>
          {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800" role="alert" aria-live="assertive">{error}</p>}
          <p className="mt-4 text-sm text-slate-500" role="status" aria-live="polite">Showing {visibleUsers.length} account{visibleUsers.length === 1 ? "" : "s"}.</p>

          <div className="mt-5 space-y-3">
            {visibleUsers.map((member) => {
              const busy = busyId === member.id;
              const isSelf = member.id === currentUserId;
              const role = member.role === "admin" ? "admin" : "member";
              const accessibleName = member.full_name ?? member.email ?? "unnamed member";
              return (
                <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-black text-slate-950">{member.full_name || "Unnamed member"}</h2>
                        <span className={`rounded-full px-2 py-1 text-xs font-bold ${member.is_active ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{member.is_active ? "Active" : "Inactive"}</span>
                        {isSelf && <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-800">You</span>}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{member.email}</p>
                      <p className="mt-1 text-xs text-slate-400">Joined {formatJoinedDate(member.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Role
                        <select aria-label={`Role for ${accessibleName}`} value={role} disabled={busy || isSelf} onChange={(event) => changeRole(member.id, event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 disabled:opacity-60">
                          {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <button type="button" aria-label={`${member.is_active ? "Deactivate" : "Reactivate"} account for ${accessibleName}`} disabled={busy || isSelf} onClick={() => changeAccess(member.id, !member.is_active)} className="lfp-button border border-slate-300 bg-white text-slate-800 disabled:opacity-50">{member.is_active ? "Deactivate" : "Reactivate"}</button>
                      {!isSelf && (confirmingId === member.id ? (
                        <span className="flex items-center gap-2">
                          <button type="button" disabled={busy} onClick={() => deleteUser(member.id)} className="lfp-button bg-rose-600 text-white">Confirm Delete</button>
                          <button type="button" onClick={() => setConfirmingId(null)} className="lfp-button border border-slate-300 bg-white text-slate-800">Cancel</button>
                        </span>
                      ) : <button type="button" aria-label={`Delete account for ${accessibleName}`} disabled={busy} onClick={() => setConfirmingId(member.id)} className="lfp-button border border-rose-200 bg-rose-50 text-rose-800">Delete</button>)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
