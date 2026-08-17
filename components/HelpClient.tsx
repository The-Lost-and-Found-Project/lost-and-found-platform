"use client";

import Link from "next/link";

function Card({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-indigo-100 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">
          {title}
        </span>
        <span className="mt-0.5 block text-sm text-gray-500">
          {description}
        </span>
      </span>
    </Link>
  );
}

const chatIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M4 5h16v10a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" strokeLinejoin="round" />
    <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const bookIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M4 5.5A2.5 2.5 0 016.5 3H20v15.5a1 1 0 01-1 1H6.5A2.5 2.5 0 004 22V5.5z" strokeLinejoin="round" />
    <path d="M4 19a2.5 2.5 0 012.5-2.5H20" strokeLinecap="round" />
  </svg>
);

const shieldIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const appleIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M16.7 12.4c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.2-4-2.2-1.7-.2-3.3 1-4.2 1-.9 0-2.2-1-3.6-1-1.9 0-3.6 1.1-4.6 2.8-2 3.4-.5 8.5 1.4 11.3 1 1.4 2.1 2.9 3.5 2.9 1.4-.1 1.9-.9 3.6-.9s2.2.9 3.6.9c1.5 0 2.5-1.4 3.4-2.7 1.1-1.6 1.5-3.1 1.5-3.2-.1 0-2.9-1.1-3-4.7zM14 3.8c.8-1 1.3-2.3 1.2-3.6-1.1.1-2.5.8-3.3 1.7-.7.8-1.3 2.1-1.2 3.4 1.3.1 2.5-.6 3.3-1.5z" />
  </svg>
);

const androidIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M6.6 8.5h10.8v8.3a1 1 0 01-1 1h-.9v2.4a1.2 1.2 0 01-2.4 0v-2.4h-2.2v2.4a1.2 1.2 0 01-2.4 0v-2.4h-.9a1 1 0 01-1-1V8.5zM6 8a4.5 4.5 0 019 0M4.8 9.2v5.6a1 1 0 002 0V9.2a1 1 0 00-2 0zM17.2 9.2v5.6a1 1 0 002 0V9.2a1 1 0 00-2 0zM8.5 5.3l-.9-1.6M15.5 5.3l.9-1.6" strokeWidth="1" />
  </svg>
);

export default function HelpClient({
  showAdminGuide,
}: {
  showAdminGuide: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Help</h1>
      <p className="mt-2 text-gray-600">
        Get in touch with our team, install the app on your phone, or read
        the guide for your part of the community.
      </p>

      <div className="mt-8 space-y-3">
        <Card
          href="/feedback"
          title="Contact Us"
          description="Send a message to our team. We read every note, though this is one-way — we'll follow up by email if needed."
          icon={chatIcon}
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Install the App
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          href="/help/install/ios"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:border-indigo-100 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            {appleIcon}
          </span>
          <span className="text-sm font-semibold text-gray-900">iPhone / iPad</span>
        </Link>
        <Link
          href="/help/install/android"
          className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition hover:border-indigo-100 hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            {androidIcon}
          </span>
          <span className="text-sm font-semibold text-gray-900">Android</span>
        </Link>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-gray-400">
        User Manual
      </h2>
      <div className="mt-3 space-y-3">
        <Card
          href="/help/manual/member"
          title="Member Guide"
          description="Prayer, Praise, Testimony reactions, notifications, privacy, and your profile."
          icon={bookIcon}
        />
        {showAdminGuide && (
          <Card
            href="/help/manual/admin"
            title="Admin Guide"
            description="Moderation, Community Members, content, and analytics."
            icon={shieldIcon}
          />
        )}
      </div>
    </div>
  );
}
