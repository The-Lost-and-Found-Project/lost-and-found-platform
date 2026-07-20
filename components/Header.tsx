import Image from "next/image";
import Link from "next/link";
import BackButton from "./BackButton";
import NotificationBell from "./NotificationBell";
import AuthControls from "./AuthControls";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const logo = (
    <Image
      src="/logo.svg"
      alt="The Lost and Found Project"
      width={44}
      height={44}
      priority
    />
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <BackButton />
          {user ? (
            <Link
              href="/dashboard"
              aria-label="Home"
              className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-gray-100"
            >
              {logo}
            </Link>
          ) : (
            <span className="flex items-center gap-2 rounded-full p-1.5">
              {logo}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && (
            <Link
              href="/feedback"
              aria-label="Send feedback"
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path
                  d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M8 10h8M8 13h5" strokeLinecap="round" />
              </svg>
            </Link>
          )}
          <NotificationBell />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
