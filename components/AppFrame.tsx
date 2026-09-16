"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import UniversalAction from "@/components/UniversalAction";
import UpdateNotifier from "@/components/UpdateNotifier";
import MediaPlayer from "@/components/MediaPlayer";

export default function AppFrame({header,children}:{header:React.ReactNode;children:React.ReactNode}){
 const pathname=usePathname();
 const focused=pathname.startsWith("/live/")||(pathname.startsWith("/studies/")&&pathname.endsWith("/present"));
 if(focused)return <main id="main-content" className="min-h-screen" tabIndex={-1}>{children}</main>;
 return <>{header}<main id="main-content" className="pb-24" tabIndex={-1}>{children}</main><MediaPlayer/><UniversalAction/><BottomNav/><UpdateNotifier/></>;
}
