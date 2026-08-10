import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["member", "prayer_team", "pastor", "admin"];
const CARE_ROLES = ["prayer_team", "pastor", "admin"];
const RESPONSIBILITY_ACTIONS = ["bulk_reassign", "return_to_queue"];

// Lets an admin change another user's role. Runs the actual update through
// the service-role client (bypasses RLS) since profiles.update policies only
// allow a user to edit their own row. Callers are re-verified as admin here
// on the server, regardless of what the client sends.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, responsibilityAction } = body ?? {};

    if (!userId || !role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Missing or invalid userId/role" },
        { status: 400 }
      );
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

    // Guard against an admin locking themselves out by changing their own
    // role away from admin through this UI.
    if (userId === user.id && role !== "admin") {
      return NextResponse.json(
        { error: "You can't change your own role here. Ask another admin." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: targetProfile, error: targetProfileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetProfileError) throw targetProfileError;

    const removesCareAccess =
      CARE_ROLES.includes(targetProfile.role) && !CARE_ROLES.includes(role);

    if (removesCareAccess) {
      const { data: responsibilities, error: responsibilitiesError } = await admin
        .from("prayer_requests")
        .select("id")
        .eq("assigned_to", userId)
        .eq("answered", false)
        .eq("archived", false);

      if (responsibilitiesError) throw responsibilitiesError;

      if (
        (responsibilities?.length ?? 0) > 0 &&
        !RESPONSIBILITY_ACTIONS.includes(responsibilityAction)
      ) {
        return NextResponse.json(
          {
            error: "Active care responsibilities must move before this role changes.",
            code: "ACTIVE_RESPONSIBILITIES",
            count: responsibilities?.length ?? 0,
          },
          { status: 409 }
        );
      }

      // Stop new work from arriving before the selected handoff runs. The
      // final role update below converts this to assignment-only Inactive.
      if ((responsibilities?.length ?? 0) > 0) {
        const { error: pauseError } = await admin
          .from("profiles")
          .update({
            ministry_availability: "limited",
            paused_at: new Date().toISOString(),
          })
          .eq("id", userId);
        if (pauseError) throw pauseError;
      }

      for (const responsibility of responsibilities ?? []) {
        if (responsibilityAction === "return_to_queue") {
          const { error } = await admin
            .from("prayer_requests")
            .update({ assigned_to: null, status: "Needs Reassignment" })
            .eq("id", responsibility.id)
            .eq("assigned_to", userId);
          if (error) throw error;
          continue;
        }

        const { error } = await admin.rpc("reassign_prayer_request", {
          request_id: responsibility.id,
          exclude_user_id: userId,
        });
        if (error) throw error;
      }
    }

    const { error } = await admin
      .from("profiles")
      .update(
        CARE_ROLES.includes(role)
          ? { role }
          : {
              role,
              ministry_availability: "inactive",
              availability_review_required: false,
              paused_at: new Date().toISOString(),
            }
      )
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ministryAvailability: CARE_ROLES.includes(role) ? undefined : "inactive",
    });
  } catch (err) {
    console.error("set-role error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating role" },
      { status: 500 }
    );
  }
}
