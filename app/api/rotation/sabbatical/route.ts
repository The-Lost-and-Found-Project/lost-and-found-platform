import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Self-service sabbatical toggle for care team members (admin/prayer_team/
// pastor). Starting a sabbatical immediately hands off anything currently
// assigned to the next eligible rotation candidate (same "reassign
// immediately, either way" rule as neglect-pause and account deletion) and
// pauses them from receiving new assignments. Ending a sabbatical is fully
// self-service too, any time — no admin approval needed, unlike coming back
// from 'inactive'. They can keep using the rest of the app as a regular
// member the whole time; this only affects rotation participation.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body ?? {};

    if (action !== "start" && action !== "end") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("role, full_name, rotation_status")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "prayer_team", "pastor"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Sabbatical status only applies to prayer care team members." },
        { status: 400 }
      );
    }

    if (action === "start") {
      if (profile.rotation_status !== "active") {
        return NextResponse.json(
          { error: "Your account isn't currently active in the rotation." },
          { status: 400 }
        );
      }

      const { error: pauseError } = await admin
        .from("profiles")
        .update({
          rotation_status: "paused_sabbatical",
          paused_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .eq("rotation_status", "active");

      if (pauseError) throw pauseError;

      const { data: activeAssignments } = await admin
        .from("prayer_requests")
        .select(
          "id, contact_requested, prayer_count, action_contacted_at, action_prayed_at"
        )
        .eq("assigned_to", user.id)
        .eq("answered", false)
        .eq("archived", false);

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
          body: `This request was previously assigned to ${profile.full_name || "a prayer partner"}, who has stepped away on sabbatical. ${prayedText} ${contactText}`,
          link: "/prayer-assignments",
        });
      }

      return NextResponse.json({ success: true, reassigned: activeAssignments?.length ?? 0 });
    }

    // action === "end"
    if (profile.rotation_status !== "paused_sabbatical") {
      return NextResponse.json(
        { error: "You're not currently on sabbatical." },
        { status: 400 }
      );
    }

    const { error: resumeError } = await admin
      .from("profiles")
      .update({ rotation_status: "active", paused_at: null })
      .eq("id", user.id)
      .eq("rotation_status", "paused_sabbatical");

    if (resumeError) throw resumeError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("rotation sabbatical toggle error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating your sabbatical status" },
      { status: 500 }
    );
  }
}
