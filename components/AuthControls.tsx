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
  { href: "/support", label: "Help & Support", icon: "?" },
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
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("touchstart", closeOutside);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("touchstart", closeOutside);
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
      <button onClick={() => setOpen((value) => !value)} className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-indigo-100" aria-label="Account menu" aria-expanded={open}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-md" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md">{initial}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white/96 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 font-black text-white">{initial}</span>}
            <div className="min-w-0">
              <p className="truncate font-black text-slate-950">{profile?.full_name?.trim() || "Add your name"}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
          </div>

          {isPreviewing && (
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800">
              Previewing as {ROLE_LABELS[effectiveRole]}. <Link href="/profile" className="underline">End preview</Link>
            </div>
          )}

          <div className="p-2">
            {[...accountItems, ...roleItems].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-800">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 p-2">
            <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-rose-700 transition hover:bg-rose-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50" aria-hidden="true">↪</span>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
