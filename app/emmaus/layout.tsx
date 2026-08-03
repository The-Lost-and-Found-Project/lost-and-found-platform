import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmmausBottomNav from "@/components/emmaus/EmmausBottomNav";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoumdproject.org";

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

  if (user.email?.toLowerCase() !== EMMAUS_FOUNDER_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {children}
      <EmmausBottomNav />
    </div>
  );
}
