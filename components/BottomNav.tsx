"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/prayer",
    label: "Prayer Wall",
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
    href: "/my-journey",
    label: "My Journey",
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
  {
    href: "/prayer/submit",
    label: "Submit a Prayer",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" strokeLinecap="round" />
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
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
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
              <span>{item.label}</span>
            </Link>
          );
        })}
        <a
          href={GIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-indigo-100 transition hover:text-white"
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
          <span>Give</span>
        </a>
      </div>
    </nav>
  );
}
