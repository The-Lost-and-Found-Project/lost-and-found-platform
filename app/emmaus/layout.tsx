import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmmausBottomNav from "@/components/emmaus/EmmausBottomNav";

export default async function EmmausLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {children}
      <EmmausBottomNav />
    </div>
  );
}
