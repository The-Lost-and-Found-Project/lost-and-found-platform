import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Approves a whole batch of pending questions in one call -- used for the
// "Approve all pending in this category" button so reviewing a freshly
// AI-authored batch doesn't mean clicking Approve twenty separate times.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can approve trivia questions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids } = body ?? {};

    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "No question ids provided" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("trivia_questions")
      .update({
        status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .in("id", ids)
      .select("id");

    if (error) throw error;
    return NextResponse.json({ approvedCount: data?.length ?? 0 });
  } catch (err) {
    console.error("admin trivia bulk-approve error:", err);
    return NextResponse.json(
      { error: "Unexpected error approving questions" },
      { status: 500 }
    );
  }
}
