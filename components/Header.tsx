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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <BackButton />
          {user ? (
            <Link href="/dashboard" aria-label="Home" className="group flex min-w-0 items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 ring-1 ring-slate-200">
                <Image src="/logo.svg" alt="The Lost and Found Project" width={38} height={38} priority />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-black tracking-tight text-slate-950">The Lost and Found Project</span>
                <span className="block truncate text-xs font-medium text-slate-500">Pray. Grow. Serve. Connect.</span>
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-amber-50 ring-1 ring-slate-200">
                <Image src="/logo.svg" alt="The Lost and Found Project" width={38} height={38} priority />
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && (
            <Link href="/feedback" aria-label="Send feedback" className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
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
