import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TestimonySubmitClient from "@/components/TestimonySubmitClient";

export default async function SubmitTestimonyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <TestimonySubmitClient />;
}
