import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmmausBottomNav from "@/components/emmaus/EmmausBottomNav";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoundproject.org";
const EMMAUS_FOUNDER_USER_ID = process.env.EMMAUS_FOUNDER_USER_ID?.trim();

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

  const matchesPermanentFounderId = Boolean(
    EMMAUS_FOUNDER_USER_ID && user.id === EMMAUS_FOUNDER_USER_ID
  );
  const matchesBootstrapEmail = Boolean(
    !EMMAUS_FOUNDER_USER_ID &&
      user.email?.toLowerCase() === EMMAUS_FOUNDER_EMAIL
  );

  if (!matchesPermanentFounderId && !matchesBootstrapEmail) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {children}
      <EmmausBottomNav />
    </div>
  );
}
