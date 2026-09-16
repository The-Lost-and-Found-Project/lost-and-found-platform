"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const memberItems=[{href:"/dashboard",label:"Home",icon:"⌂"},{href:"/discover",label:"Discover",icon:"◇"},{href:"/prayer",label:"Prayer",icon:"♡",featured:true},{href:"/community",label:"Community",icon:"◎"},{href:"/more",label:"Me",icon:"◉"}];
const fullAdminItems=[{href:"/admin",label:"Requests",icon:"▤"},{href:"/admin/analytics",label:"Analytics",icon:"⌁"},{href:"/admin/users",label:"Users",icon:"◉"},{href:"/admin/applications",label:"Applications",icon:"✓"},{href:"/admin/content",label:"Content",icon:"▦"},{href:"/dashboard",label:"App",icon:"⌂"}];
const studyLeaderItems=[{href:"/admin/studies",label:"Studies",icon:"▣"},{href:"/dashboard",label:"App",icon:"⌂"}];

type Role="member"|"facilitator"|"supervisor"|"admin";

export default function BottomNav(){
 const pathname=usePathname();const[role,setRole]=useState<Role|null>(null);
 useEffect(()=>{let alive=true;fetch("/api/me/role").then(r=>r.json()).then(x=>{if(alive)setRole(x.role||"member")}).catch(()=>{if(alive)setRole("member")});return()=>{alive=false}},[]);
 if(pathname==="/"||pathname==="/share"||pathname==="/login"||pathname==="/signup")return null;
 const inAdmin=pathname.startsWith("/admin");const items=!inAdmin?memberItems:role==="admin"?fullAdminItems:role==="facilitator"||role==="supervisor"?studyLeaderItems:[{href:"/dashboard",label:"App",icon:"⌂"}];
 return <nav aria-label={inAdmin?"Administration":"Primary"} className="fixed inset-x-0 bottom-0 z-[90] px-2 sm:px-4" style={{paddingBottom:"max(0.55rem, env(safe-area-inset-bottom))"}}><div className={`mx-auto border border-white/80 bg-white/88 shadow-[0_18px_55px_rgba(15,23,42,0.2)] backdrop-blur-2xl grid rounded-[1.6rem] p-1.5 ${items.length===2?"max-w-md grid-cols-2":items.length===1?"max-w-xs grid-cols-1":inAdmin?"max-w-4xl grid-cols-6":"max-w-xl grid-cols-5"}`}>{items.map(item=>{const active=pathname===item.href||(item.href!=="/dashboard"&&pathname.startsWith(`${item.href}/`));const featured="featured" in item&&item.featured;return <Link key={item.href} href={item.href} aria-current={active?"page":undefined} className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center rounded-[1.25rem] px-1 py-1.5 text-[10px] font-black transition sm:text-[11px] ${active?"bg-slate-950 text-white shadow-lg":"text-slate-500 hover:bg-slate-100 hover:text-slate-950"} ${featured&&!active?"text-blue-700":""}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none ${featured&&!active?"bg-blue-50":""}`}>{item.icon}</span><span className="mt-0.5 truncate">{item.label}</span>{active&&<span className="absolute -bottom-0.5 h-1 w-5 rounded-full bg-blue-400"/>}</Link>})}</div></nav>;
}
