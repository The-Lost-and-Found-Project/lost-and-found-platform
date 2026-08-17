import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lets a member permanently delete their own account — no admin needed.
// Mirrors /api/admin/users/delete, just triggered by the member themselves.
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

    const { data: selfProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Don't let the only remaining admin delete themselves — that would
    // lock everyone out with no way back short of direct database access.
    if (selfProfile?.role === "admin") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "You're the only remaining admin, so you can't delete your own account. Promote another member to admin first.",
          },
          { status: 400 }
        );
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("self-delete account error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting your account" },
      { status: 500 }
    );
  }
}
