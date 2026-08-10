import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A first missed assignment can be restored to Available by the volunteer.
// Repeated misses require a care leader's review through the admin workflow.
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

    const { data: profile } = await admin
      .from("profiles")
      .select("rotation_status, missed_assignment_count")
      .eq("id", user.id)
      .single();

    if (profile?.rotation_status !== "paused_neglect") {
      return NextResponse.json(
        { error: "Your account isn't currently paused for inactivity." },
        { status: 400 }
      );
    }

    if ((profile.missed_assignment_count ?? 0) >= 2) {
      return NextResponse.json(
        { error: "A care leader must review repeated missed assignments before new assignments resume." },
        { status: 403 }
      );
    }

    const { error } = await admin
      .from("profiles")
      .update({ rotation_status: "active", ministry_availability: "available", availability_review_required: false, paused_at: null })
      .eq("id", user.id)
      .eq("rotation_status", "paused_neglect");

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("rotation unpause error:", err);
    return NextResponse.json(
      { error: "Unexpected error unpausing your account" },
      { status: 500 }
    );
  }
}
