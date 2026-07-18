"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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

const baseMenuItems = [
  {
    href: "/account",
    label: "Account",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="12" r="2" />
        <path d="M14 10h4M14 14h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M21 18h.01" strokeLinecap="round" />
        <circle cx="16" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="18" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/programs",
    label: "Programs",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <circle cx="5" cy="5" r="1.6" />
        <circle cx="12" cy="5" r="1.6" />
        <circle cx="19" cy="5" r="1.6" />
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="19" cy="12" r="1.6" />
        <circle cx="5" cy="19" r="1.6" />
        <circle cx="12" cy="19" r="1.6" />
        <circle cx="19" cy="19" r="1.6" />
      </svg>
    ),
  },
];

const adminMenuItem = {
  href: "/admin",
  label: "Admin",
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function AuthControls() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);

  // Header (and this component) persists across client-side navigations —
  // it isn't remounted per page — so without this the menu would stay open
  // after clicking a link elsewhere (e.g. the notification bell or a
  // BottomNav tab) instead of closing when you navigate away.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        if (active) {
          setEmail(null);
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      if (active) setEmail(user.email ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role, preview_role")
        .eq("id", user.id)
        .single();

      if (active) {
        setProfile((profileData as Profile) ?? null);
        setLoading(false);
      }
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  if (!email) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500"
      >
        Login
      </Link>
    );
  }

  const displayName = profile?.full_name?.trim() || email;
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);
  const isPreviewing =
    profile?.role === "admin" &&
    !!profile?.preview_role &&
    profile.preview_role !== "admin";
  const menuItems =
    effectiveRole === "admin"
      ? [...baseMenuItems, adminMenuItem]
      : baseMenuItems;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-indigo-100"
        aria-label="Account menu"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
                  {initial}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {profile?.full_name?.trim() || "Add your name"}
                </p>
                <p className="truncate text-xs text-gray-500">{email}</p>
              </div>
            </div>

            {isPreviewing && (
              <div className="border-b border-gray-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                Previewing as {ROLE_LABELS[effectiveRole]} —{" "}
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="underline hover:text-amber-800"
                >
                  end preview
                </Link>
              </div>
            )}

            <div className="py-1.5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="text-gray-400">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path
                  d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
