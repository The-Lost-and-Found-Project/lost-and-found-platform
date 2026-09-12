"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const actions = [
  { href: "/prayer/submit", icon: "♡", label: "Prayer", note: "Ask the community to carry a need" },
  { href: "/praise/submit", icon: "✦", label: "Praise", note: "Celebrate what God has done" },
  { href: "/testimonies/submit", icon: "◎", label: "Testimony", note: "Share a story that may give hope" },
  { href: "/events", icon: "◫", label: "Gather", note: "Find your next place to show up" },
];

export default function UniversalAction() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (["/", "/login", "/signup", "/share"].includes(pathname) || pathname.startsWith("/admin")) return null;

  return <div className="fixed bottom-24 right-4 z-[85] sm:right-6">
    {open && <div className="mb-3 w-[min(21rem,calc(100vw-2rem))] rounded-[1.6rem] border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="px-2 pb-2 pt-1"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">Quick action</p><p className="mt-1 text-sm text-slate-500">Do the next meaningful thing without hunting through menus.</p></div>
      <div className="space-y-1">{actions.map((a)=><Link key={a.href} href={a.href} onClick={()=>setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-slate-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg text-blue-700">{a.icon}</span><span><span className="block font-black text-slate-950">{a.label}</span><span className="block text-xs leading-5 text-slate-500">{a.note}</span></span></Link>)}</div>
    </div>}
    <button type="button" aria-label={open?"Close quick actions":"Open quick actions"} aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl font-light text-white shadow-[0_16px_38px_rgba(44,94,210,.38)] transition hover:-translate-y-1">{open?"×":"+"}</button>
  </div>;
}
