import Image from "next/image";
import Link from "next/link";
import BackButton from "./BackButton";
import NotificationBell from "./NotificationBell";
import AuthControls from "./AuthControls";
import { createClient } from "@/lib/supabase/server";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/72 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[78rem] items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <BackButton />
          <Link href={user ? "/dashboard" : "/"} aria-label="The Lost and Found Project home" className="group flex min-w-0 items-center gap-3 rounded-2xl px-1.5 py-1 transition hover:bg-white/80">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-slate-200/80 bg-white shadow-sm">
              <Image src="/logo.svg" alt="" width={34} height={34} priority />
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-black tracking-[-0.02em] text-slate-950">Lost & Found</span>
              <span className="block truncate text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Project</span>
            </span>
          </Link>
        </div>

        {!user && (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
            <Link href="/#compass" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">Start Here</Link>
            <Link href="/ministries" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">Ministries</Link>
            <Link href="/about" className="rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-950">About</Link>
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          {user && <Link href="/feedback" aria-label="Send feedback" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-blue-700"><span aria-hidden="true">✎</span></Link>}
          <NotificationBell />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
