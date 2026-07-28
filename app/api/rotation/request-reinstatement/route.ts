import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A member whose account has gone fully 'inactive' (30 days paused for
// neglect with no self-unpause) can't bring themselves back on their own —
// unlike sabbatical or the 30-day neglect-pause window, reinstatement from
// inactive requires admin sign-off. This just records the request and lets
// admins know; approval happens via /api/admin/users/approve-reinstatement.
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
      .select("rotation_status, full_name, reinstatement_requested_at")
      .eq("id", user.id)
      .single();

    if (profile?.rotation_status !== "inactive") {
      return NextResponse.json(
        { error: "Your account isn't currently inactive." },
        { status: 400 }
      );
    }

    if (profile?.reinstatement_requested_at) {
      return NextResponse.json({ success: true, alreadyRequested: true });
    }

    const { error } = await admin
      .from("profiles")
      .update({ reinstatement_requested_at: new Date().toISOString() })
      .eq("id", user.id)
      .eq("rotation_status", "inactive");

    if (error) throw error;

    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      await admin.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          type: "reinstatement_requested",
          title: "A reinstatement request needs review",
          body: `${profile?.full_name || "A prayer care team member"} has requested to be reinstated to the prayer rotation after being marked inactive.`,
          link: "/admin/users",
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("request-reinstatement error:", err);
    return NextResponse.json(
      { error: "Unexpected error requesting reinstatement" },
      { status: 500 }
    );
  }
}
