import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lets a member permanently delete their own account — no admin needed.
// Mirrors /api/admin/users/delete (same last-admin guard, same reassignment
// of anything still actively assigned to them), just triggered by the
// member themselves rather than an admin acting on their behalf.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: selfProfile } = await admin
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    // Don't let the only remaining admin delete themselves — that would
    // lock everyone out with no way back short of direct database access.
    if (selfProfile?.role === "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "You're the only remaining admin, so you can't delete your own account. Promote another member to admin first.",
          },
          { status: 400 }
        );
      }
    }

    // Hand off anything still actively assigned to this person before we
    // remove them, same as the admin-initiated delete flow.
    const { data: activeAssignments } = await admin
      .from("prayer_requests")
      .select(
        "id, contact_requested, prayer_count, action_contacted_at, action_prayed_at"
      )
      .eq("assigned_to", user.id)
      .eq("answered", false)
      .eq("archived", false);

    const oldAssigneeName = selfProfile?.full_name || "the previous care team member";

    for (const req of activeAssignments ?? []) {
      const { data: newAssigneeId, error: reassignError } = await admin.rpc(
        "reassign_prayer_request",
        { request_id: req.id, exclude_user_id: user.id }
      );

      if (reassignError) {
        console.error("reassign_prayer_request error:", reassignError);
        continue;
      }

      if (!newAssigneeId) continue;

      const prayedText =
        (req.prayer_count ?? 0) > 0 || req.action_prayed_at
          ? `It has already been prayed for${req.prayer_count ? ` (${req.prayer_count} time${req.prayer_count === 1 ? "" : "s"})` : ""}.`
          : "It has not been prayed for yet.";

      const contactText = req.contact_requested
        ? req.action_contacted_at
          ? "The submitter asked to be contacted and has already been reached out to."
          : "The submitter asked to be contacted and has not been reached out to yet."
        : "The submitter did not request direct contact.";

      await admin.from("notifications").insert({
        user_id: newAssigneeId,
        type: "prayer_reassigned",
        title: "A prayer request has been reassigned to you",
        body: `This request was previously assigned to ${oldAssigneeName}, who has left the community. It's now yours to follow up on. ${prayedText} ${contactText}`,
        link: "/prayer-assignments",
      });
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("self-delete account error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting your account" },
      { status: 500 }
    );
  }
}
