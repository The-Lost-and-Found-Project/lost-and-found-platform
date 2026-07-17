import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["member", "prayer_team", "pastor", "admin"];

// Lets an admin change another user's role. Runs the actual update through
// the service-role client (bypasses RLS) since profiles.update policies only
// allow a user to edit their own row. Callers are re-verified as admin here
// on the server, regardless of what the client sends.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role } = body ?? {};

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
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("set-role error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating role" },
      { status: 500 }
    );
  }
}
