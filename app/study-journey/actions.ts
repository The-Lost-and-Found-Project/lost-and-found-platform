"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeJourneyDay(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const sessionId = String(formData.get("session_id") || "");
  const journeyDayId = String(formData.get("journey_day_id") || "");
  if (!sessionId || !journeyDayId) return;
  const { error } = await supabase.from("bible_study_day_completions").insert({ session_id: sessionId, journey_day_id: journeyDayId, user_id: user.id });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/study-journey");
}
