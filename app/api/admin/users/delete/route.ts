import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a user account. This is admin-only, irreversible, and
// distinct from deactivation (set-active): deactivation just bans sign-in
// while keeping all their data intact, whereas this actually removes the
// auth.users row (which cascades to profiles and everything tied to it).
// Only use this for accounts that genuinely shouldn't exist anymore (spam
// signups, test accounts, a member's own request to be forgotten) — for
// anyone who might come back, deactivate instead.
//
// Before the user is actually removed, any prayer requests still actively
// assigned to them (not answered, not archived) are handed off to the next
// eligible rotation candidate via the reassign_prayer_request() DB function,
// and the new assignee gets a notification explaining the handoff plus the
// pertinent context they'd otherwise have to dig for: whether it's already
// been prayed for, whether the submitter has been contacted, and whether
// the submitter wants to be contacted at all. Requests that are answered or
// archived are left alone — there's nothing left to hand off.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body ?? {};

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You can't delete your own account here." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Don't allow the last remaining admin to be deleted — that would lock
    // everyone out of this dashboard with no way back in short of direct
    // database access.
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", userId)
      .single();

    if (targetProfile?.role === "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "You can't delete the only remaining admin." },
          { status: 400 }
        );
      }
    }

    // Hand off anything still actively assigned to this person before we
    // remove them.
    const { data: activeAssignments } = await admin
      .from("prayer_requests")
      .select(
        "id, contact_requested, prayer_count, action_contacted_at, action_prayed_at"
      )
      .eq("assigned_to", userId)
      .eq("answered", false)
      .eq("archived", false);

    const oldAssigneeName = targetProfile?.full_name || "the previous care team member";

    for (const req of activeAssignments ?? []) {
      const { data: newAssigneeId, error: reassignError } = await admin.rpc(
        "reassign_prayer_request",
        { request_id: req.id, exclude_user_id: userId }
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
        body: `This request was previously assigned to ${oldAssigneeName}, whose account has been removed. It's now yours to follow up on. ${prayedText} ${contactText}`,
        link: "/prayer-assignments",
      });
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ success: true, reassigned: activeAssignments?.length ?? 0 });
  } catch (err) {
    console.error("delete user error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting user" },
      { status: 500 }
    );
  }
}
