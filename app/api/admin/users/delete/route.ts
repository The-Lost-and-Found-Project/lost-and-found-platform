import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a user account. This is admin-only, irreversible, and
// distinct from deactivation (set-active): deactivation just bans sign-in
// while keeping all their data intact, whereas this actually removes the
// auth.users row (which cascades to profiles and everything tied to it).
// Only use this for accounts that genuinely shouldn't exist anymore (spam
// signups, test accounts, a member's own request to be forgotten) — for
// anyone who might come back, deactivate instead.
//
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

    if (userId === user.id) {
      return NextResponse.json(
        { error: "You can't delete your own account here." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Don't allow the last remaining admin to be deleted — that would lock
    // everyone out of this dashboard with no way back in short of direct
    // database access.
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("role, full_name, email")
      .eq("id", userId)
      .single();

    if (targetProfile?.role === "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "You can't delete the only remaining admin." },
          { status: 400 }
        );
      }
    }

    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete user error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting user" },
      { status: 500 }
    );
  }
}
