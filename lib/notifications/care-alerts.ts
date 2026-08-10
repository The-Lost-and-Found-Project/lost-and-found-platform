import type { SupabaseClient } from "@supabase/supabase-js";

export async function notifyPrayerEscalation({
  admin,
  prayerRequestId,
  assignedTo,
  actorUserId,
}: {
  admin: SupabaseClient;
  prayerRequestId: string;
  assignedTo: string | null;
  actorUserId: string;
}) {
  const { data: leaders, error: leadersError } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["admin", "pastor"]);

  if (leadersError) throw leadersError;

  const recipients = new Map<string, string>();
  if (assignedTo && assignedTo !== actorUserId) {
    recipients.set(assignedTo, "/prayer-assignments");
  }
  for (const leader of leaders ?? []) {
    if (leader.id !== actorUserId) recipients.set(leader.id, "/admin");
  }

  if (recipients.size === 0) return;

  const { error } = await admin.from("notifications").insert(
    Array.from(recipients, ([userId, link]) => ({
      user_id: userId,
      type: "prayer_escalated",
      title: "A prayer request was escalated",
      body: "Open the care workspace to review ownership, next steps, and any support needed.",
      link,
      prayer_request_id: prayerRequestId,
    }))
  );

  if (error) throw error;
}
