"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function changeMentorShare(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey/sharing");
  const mentorId = String(formData.get("mentorId") ?? "").trim();
  const operation = String(formData.get("operation") ?? "");
  if (!uuid.test(mentorId) || mentorId === user.id || !["grant","revoke"].includes(operation)) throw new Error("Invalid sharing request");
  if (operation === "revoke") {
    const { error } = await supabase.from("marriage_mentor_shares").delete().eq("participant_id", user.id).eq("mentor_id", mentorId);
    if (error) throw new Error("Could not revoke access");
  } else {
    if (formData.get("verifiedMentor") !== "on") throw new Error("Confirm the mentor identity before granting access");
    const { error } = await supabase.from("marriage_mentor_shares").upsert({
      participant_id: user.id, mentor_id: mentorId, status: "active",
      share_progress: formData.get("shareProgress") === "on",
      share_commitments: formData.get("shareCommitments") === "on",
      updated_at: new Date().toISOString(),
    }, { onConflict: "participant_id,mentor_id" });
    if (error) throw new Error("Could not grant access. Confirm the mentor has an account.");
  }
  revalidatePath("/marriage-journey/sharing");
  revalidatePath("/marriage-journey/mentor");
  redirect("/marriage-journey/sharing?updated=1");
}
export async function shareMarriageUpdate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey/sharing");
  const mentorId = String(formData.get("mentorId") ?? "");
  const session = Number(formData.get("session"));
  if (!uuid.test(mentorId) || !Number.isInteger(session) || session < 1 || session > 21) throw new Error("Invalid update");
  const { data: grant, error: grantError } = await supabase.from("marriage_mentor_shares")
    .select("share_progress,share_commitments").eq("participant_id", user.id).eq("mentor_id", mentorId).eq("status", "active").single();
  if (grantError || !grant) throw new Error("Sharing permission is unavailable");
  const { data: progress, error: progressError } = await supabase.from("marriage_journey_progress")
    .select("completed_at,shared_commitment").eq("user_id", user.id).eq("session_number", session).maybeSingle();
  if (progressError) throw new Error("Progress unavailable");
  const { error } = await supabase.from("marriage_mentor_updates").upsert({
    participant_id: user.id, mentor_id: mentorId, session_number: session,
    completed: grant.share_progress && Boolean(progress?.completed_at),
    commitment: grant.share_commitments ? (progress?.shared_commitment ?? "") : "",
    shared_at: new Date().toISOString(),
  }, { onConflict: "participant_id,mentor_id,session_number" });
  if (error) throw new Error("Unable to share this update");
  revalidatePath("/marriage-journey/mentor");
  redirect("/marriage-journey/sharing?updated=1");
}
