"use client";

import BottomNav from "@/components/BottomNav";
import UniversalAction from "@/components/UniversalAction";
import UpdateNotifier from "@/components/UpdateNotifier";
import MediaPlayer from "@/components/MediaPlayer";

export default function AppFrame({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      {header}
      <main id="main-content" className="pb-24" tabIndex={-1}>
        {children}
      </main>
      <MediaPlayer />
      <UniversalAction />
      <BottomNav />
      <UpdateNotifier />
    </>
  );
}
