"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const memberItems=[{href:"/dashboard",label:"Home",icon:"⌂"},{href:"/discover",label:"Discover",icon:"◇"},{href:"/prayer",label:"Prayer",icon:"♡",featured:true},{href:"/community",label:"Community",icon:"◎"},{href:"/more",label:"Me",icon:"◉"}];

export default function BottomNav(){
 const pathname=usePathname();
 if(pathname==="/"||pathname==="/share"||pathname==="/login"||pathname==="/signup"||pathname.startsWith("/admin"))return null;
 return <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-[90] px-2 pt-2 sm:px-4" style={{paddingBottom:"max(0.55rem, env(safe-area-inset-bottom))"}}><div className="mx-auto border border-white/80 bg-white/88 shadow-[0_18px_55px_rgba(15,23,42,0.2)] backdrop-blur-2xl grid max-w-xl grid-cols-5 rounded-[1.6rem] p-1.5">{memberItems.map(item=>{const active=pathname===item.href||(item.href!=="/dashboard"&&pathname.startsWith(`${item.href}/`));const featured="featured" in item&&item.featured;return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center rounded-[1.25rem] px-1 py-1.5 text-[10px] font-black transition sm:text-[11px] ${active?"bg-slate-950 text-white shadow-lg":"text-slate-500 hover:bg-slate-100 hover:text-slate-950"} ${featured&&!active?"text-blue-700":""}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none ${featured&&!active?"bg-blue-50":""}`}>{item.icon}</span><span className="mt-0.5 truncate">{item.label}</span>{active&&<span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-blue-400"/>}</Link>})}</div></nav>;
}
