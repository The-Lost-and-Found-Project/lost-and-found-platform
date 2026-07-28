import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a praise report. Admin-only, irreversible — for spam,
// inappropriate content, or a member's own request to have theirs taken
// down.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { praiseReportId } = body ?? {};

    if (!praiseReportId) {
      return NextResponse.json({ error: "Missing praiseReportId" }, { status: 400 });
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
      .from("praise_reports")
      .delete()
      .eq("id", praiseReportId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete praise report error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting praise report" },
      { status: 500 }
    );
  }
}
