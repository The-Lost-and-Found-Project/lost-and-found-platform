"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getEffectiveRole } from "@/lib/effective-role";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  preview_role: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  member: "Community Member",
  prayer_team: "Community Prayer Member",
  pastor: "Community Mentor",
  admin: "Community Admin",
};

const accountItems = [
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/settings", label: "Settings", icon: "⚙" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
  { href: "/help", label: "Help & User Manuals", icon: "?" },
];

export default function AuthControls() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    function closeOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("touchstart", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        if (active) {
          setEmail(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, preview_role")
        .eq("id", user.id)
        .single();

      if (active) {
        setEmail(user.email ?? null);
        setProfile((profileData as Profile) ?? null);
        setLoading(false);
      }
    }

    load();
    const { data: listener } = supabase.auth.onAuthStateChange(load);
    window.addEventListener("lf:profile-updated", load);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("lf:profile-updated", load);
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="h-10 w-10" aria-hidden="true" />;
  if (!email) return <Link href="/login" className="lfp-button lfp-button-primary">Login</Link>;

  const displayName = profile?.full_name?.trim() || email;
  const initial = displayName.charAt(0).toUpperCase() || "?";
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);
  const isPreviewing = profile?.role === "admin" && !!profile?.preview_role && profile.preview_role !== "admin";

  const roleItems = effectiveRole === "admin"
    ? [
        { href: "/admin", label: "Administration Center", icon: "🛡" },
        { href: "/prayer-assignments", label: "My Prayer Assignments", icon: "🙏" },
      ]
    : effectiveRole === "prayer_team" || effectiveRole === "pastor"
      ? [{ href: "/prayer-assignments", label: "My Prayer Assignments", icon: "🙏" }]
      : [];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-indigo-100 focus-visible:ring-indigo-500"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md">{initial}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account options"
          className="absolute right-0 z-[100] mt-3 w-[min(18rem,calc(100vw-1rem))] overflow-hidden rounded-3xl border border-slate-300 bg-white text-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.35)] ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-black text-white">{initial}</span>
            )}
            <div className="min-w-0">
              <p className="truncate font-black text-slate-950">{profile?.full_name?.trim() || "Add your name"}</p>
              <p className="truncate text-xs font-medium text-slate-600">{email}</p>
            </div>
          </div>

          {isPreviewing && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900">
              Previewing as {ROLE_LABELS[effectiveRole]}. <Link href="/profile" className="underline underline-offset-2">End preview</Link>
            </div>
          )}

          <div className="bg-white p-2">
            {[...accountItems, ...roleItems].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-indigo-50 hover:text-indigo-900 focus-visible:bg-indigo-50 focus-visible:text-indigo-900"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-800" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 bg-white p-2">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-black text-rose-700 transition hover:bg-rose-50 focus-visible:bg-rose-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50" aria-hidden="true">↪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
