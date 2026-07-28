import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin-only approval for a member requesting reinstatement after being
// marked 'inactive' (see /api/rotation/request-reinstatement). Brings them
// straight back to 'active' in the rotation.
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

    const admin = createAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({
        rotation_status: "active",
        paused_at: null,
        reinstatement_requested_at: null,
      })
      .eq("id", userId)
      .eq("rotation_status", "inactive");

    if (error) throw error;

    await admin.from("notifications").insert({
      user_id: userId,
      type: "reinstatement_approved",
      title: "You're back in the prayer rotation",
      body: "Your reinstatement request was approved — you're active in the rotation again and can receive new prayer assignments.",
      link: "/profile",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("approve-reinstatement error:", err);
    return NextResponse.json(
      { error: "Unexpected error approving reinstatement" },
      { status: 500 }
    );
  }
}
