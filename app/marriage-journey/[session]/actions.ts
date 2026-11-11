"use server";
import { requireMarriageAssignment } from "@/lib/marriage-assignment";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveMarriageSession(formData: FormData) {
  const session = Number(formData.get("session"));
  if (!Number.isInteger(session) || session < 1 || session > 21) throw new Error("Invalid session");
  const privateReflection = String(formData.get("privateReflection") ?? "").trim();
  const sharedCommitment = String(formData.get("sharedCommitment") ?? "").trim();
  if (privateReflection.length > 10000 || sharedCommitment.length > 3000) throw new Error("Response is too long");
  const completed = formData.get("completed") === "on";
  const { supabase, user } = await requireMarriageAssignment(`/marriage-journey/${session}`);
  const { error: saveError } = await supabase.from("marriage_journey_progress").upsert({
    user_id: user.id,
    session_number: session,
    private_reflection: privateReflection,
    shared_commitment: sharedCommitment,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,session_number" });
  if (saveError) throw new Error("Could not save your responses. Please try again.");
  revalidatePath("/marriage-journey");
  revalidatePath(`/marriage-journey/${session}`);
  redirect(`/marriage-journey/${session}?saved=1`);
}
