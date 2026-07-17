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
    const { userId, isActive } = body ?? {};

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

    const { error: profileError } = await admin
      .from("profiles")
      .update({ is_active: isActive })
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
