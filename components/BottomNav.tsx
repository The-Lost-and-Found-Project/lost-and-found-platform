"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const memberItems = [
  {
    href: "/prayer",
    label: "Prayer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/testimonies",
    label: "Testimonies",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M7 8h10M7 12h6" strokeLinecap="round" />
        <path
          d="M4 5h16v10a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/praise",
    label: "Praise",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          d="M12 3v3M12 3l-2.5 2.5M12 3l2.5 2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 20l1.5-6M19 20l-1.5-6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 20h6" strokeLinecap="round" />
        <circle cx="12" cy="11" r="4" />
      </svg>
    ),
  },
  {
    href: "/my-journey",
    label: "Journey",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M5 8v3a4 4 0 004 4h6a4 4 0 014 4" />
      </svg>
    ),
  },
];

// Admins spend real time under /admin/*, but until now they saw the same
// member tabs down there (Prayer/Testimonies/Praise/Journey), which don't
// do anything useful on those pages. This swaps in admin-specific tabs
// instead, so getting between the admin screens doesn't depend on the small
// pill buttons at the top of the Prayer Care Admin page.
const adminItems = [
  {
    href: "/admin",
    label: "Requests",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1z" strokeLinejoin="round" />
        <rect x="5" y="5" width="14" height="16" rx="2" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <path d="M16 4.5a3 3 0 010 6M20 20c0-2.8-2-5.1-4.7-5.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path d="M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1z" strokeLinejoin="round" />
        <rect x="5" y="5" width="14" height="16" rx="2" />
        <path d="M9 12.5l1.8 1.8L15 10.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/feedback",
    label: "Feedback",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <path
          d="M4 5h16v10a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const GIVE_URL =
  "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

export default function BottomNav() {
  const pathname = usePathname();

  // The marketing landing page and the sign-in/create-account pages are
  // public-facing and don't need the authenticated app's bottom nav.
  if (pathname === "/" || pathname === "/login" || pathname === "/signup")
    return null;

  const inAdmin = pathname.startsWith("/admin");
  const items = inAdmin ? adminItems : memberItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_-4px_16px_rgba(79,70,229,0.25)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around divide-x divide-white/20">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                active
                  ? "text-white"
                  : "text-indigo-100 hover:text-white"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  active ? "bg-white/20" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}

        {inAdmin ? (
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-indigo-100 transition hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  d="M4 11l8-7 8 7M6 10v9a1 1 0 001 1h4v-6h2v6h4a1 1 0 001-1v-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="whitespace-nowrap">App</span>
          </Link>
        ) : (
          <a
            href={GIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-indigo-100 transition hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  d="M12 20.25c-.36 0-.71-.1-1.02-.28C7.9 18.36 3.5 15.24 3.5 10.5 3.5 7.74 5.74 5.5 8.5 5.5c1.4 0 2.73.6 3.5 1.6.77-1 2.1-1.6 3.5-1.6 2.76 0 5 2.24 5 5 0 4.74-4.4 7.86-7.48 9.47-.31.18-.66.28-1.02.28z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="whitespace-nowrap">Give</span>
          </a>
        )}
      </div>
    </nav>
  );
}
