import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a testimony. Admin-only, irreversible — for spam,
// inappropriate content, or a member's own request to have theirs taken
// down. Members can already edit/replace their own testimony themselves
// (TestimonySubmitClient); this is specifically for admin-initiated removal.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testimonyId } = body ?? {};

    if (!testimonyId) {
      return NextResponse.json({ error: "Missing testimonyId" }, { status: 400 });
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
      .from("testimonies")
      .delete()
      .eq("id", testimonyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete testimony error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting testimony" },
      { status: 500 }
    );
  }
}
