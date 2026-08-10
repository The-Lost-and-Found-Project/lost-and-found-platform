import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_AVAILABILITY = ["available", "limited", "away", "inactive"];

export async function POST(request: NextRequest) {
  try {
    const { userId, availability } = await request.json();
    if (!userId || !ALLOWED_AVAILABILITY.includes(availability)) {
      return NextResponse.json({ error: "Missing or invalid availability" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

    const admin = createAdminClient();
    if (availability !== "available") {
      const { data: responsibilities, error: responsibilitiesError } = await admin
        .from("prayer_requests")
        .select("id")
        .eq("assigned_to", userId)
        .eq("answered", false)
        .eq("archived", false);
      if (responsibilitiesError) throw responsibilitiesError;

      for (const responsibility of responsibilities ?? []) {
        const { data: newAssignee, error: reassignError } = await admin.rpc("reassign_prayer_request", {
          request_id: responsibility.id,
          exclude_user_id: userId,
        });
        if (reassignError) throw reassignError;

        const { error: statusError } = await admin
          .from("prayer_requests")
          .update({ status: newAssignee ? "Assigned" : "Needs Reassignment" })
          .eq("id", responsibility.id);
        if (statusError) throw statusError;
      }
    }

    const changes = {
      ministry_availability: availability,
      availability_review_required: false,
      paused_at: availability === "available" ? null : new Date().toISOString(),
    };
    const { error } = await admin.from("profiles").update(changes).eq("id", userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("set-availability error:", error);
    return NextResponse.json({ error: "Unexpected error updating ministry availability" }, { status: 500 });
  }
}
