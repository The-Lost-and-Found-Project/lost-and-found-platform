"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

async function handleSignOut() {
  await supabase.auth.signOut();
  router.push("/login");
  router.refresh();
}

return (
  <button
    onClick={handleSignOut}
    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
    >Sign out</button>
  );
}
