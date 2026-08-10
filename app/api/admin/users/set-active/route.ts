import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A "long enough to be permanent" ban duration. Supabase's admin API takes a
// duration string rather than a boolean, so this is the standard way to
// disable sign-in indefinitely (until explicitly reactivated).
const PERMANENT_BAN = "876000h"; // 100 years

// Lets an admin activate/deactivate another user's account. Deactivating
// both flips profiles.is_active (so the UI and any RLS-based checks reflect
// it immediately) and bans the underlying Supabase Auth user so they're
// actually locked out of signing in, not just hidden in the app.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, isActive, responsibilityAction } = body ?? {};

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid userId/isActive" },
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

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You can't deactivate your own account here." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (!isActive) {
      const { data: responsibilities, error: responsibilitiesError } = await admin
        .from("prayer_requests")
        .select("id")
        .eq("assigned_to", userId)
        .eq("answered", false)
        .eq("archived", false);

      if (responsibilitiesError) throw responsibilitiesError;

      if ((responsibilities?.length ?? 0) > 0 && !["bulk_reassign", "return_to_queue"].includes(responsibilityAction)) {
        return NextResponse.json({
          error: "Active care responsibilities must be reassigned before deactivation.",
          code: "ACTIVE_RESPONSIBILITIES",
          count: responsibilities?.length ?? 0,
        }, { status: 409 });
      }

      // Once the admin has chosen how to move active work, remove this user
      // from rotation before handing anything off. That closes the window in
      // which a new request could be assigned during deactivation.
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
        } else if (responsibilityAction === "bulk_reassign") {
          const { data: newAssignee, error } = await admin.rpc("reassign_prayer_request", {
            request_id: responsibility.id,
            exclude_user_id: userId,
          });
          if (error) throw error;
          if (newAssignee) {
            const { error: assignedError } = await admin
              .from("prayer_requests")
              .update({ status: "Assigned" })
              .eq("id", responsibility.id)
              .eq("assigned_to", newAssignee);
            if (assignedError) throw assignedError;
          } else {
            const { error: queueError } = await admin
              .from("prayer_requests")
              .update({ assigned_to: null, status: "Needs Reassignment" })
              .eq("id", responsibility.id);
            if (queueError) throw queueError;
          }
        }
      }
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update(isActive ? { is_active: true } : { is_active: false, ministry_availability: "inactive" })
      .eq("id", userId);

    if (profileError) throw profileError;

    const { error: authError } = await admin.auth.admin.updateUserById(
      userId,
      { ban_duration: isActive ? "none" : PERMANENT_BAN }
    );

    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-active error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating account status" },
      { status: 500 }
    );
  }
}
