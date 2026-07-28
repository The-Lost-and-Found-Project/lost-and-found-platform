import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Self-service unpause: a member who was auto-paused from the rotation for
// neglecting an assignment (rotation_status = 'paused_neglect') can bring
// themselves straight back to 'active' any time within the 30-day window,
// no admin approval needed. Once the 30 days are up and the cron has moved
// them to 'inactive', this route no longer applies — see
// /api/rotation/request-reinstatement instead.
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
      .select("rotation_status")
      .eq("id", user.id)
      .single();

    if (profile?.rotation_status !== "paused_neglect") {
      return NextResponse.json(
        { error: "Your account isn't currently paused for inactivity." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("profiles")
      .update({ rotation_status: "active", paused_at: null })
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
