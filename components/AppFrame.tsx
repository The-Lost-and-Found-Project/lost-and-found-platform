"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import UpdateNotifier from "@/components/UpdateNotifier";

export default function AppFrame({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEmmaus = pathname.startsWith("/emmaus");

  return (
    <>
      {!isEmmaus && header}
      <main id="main-content" className={isEmmaus ? "" : "pb-24"} tabIndex={-1}>
        {children}
      </main>
      {!isEmmaus && <BottomNav />}
      <UpdateNotifier />
    </>
  );
}
