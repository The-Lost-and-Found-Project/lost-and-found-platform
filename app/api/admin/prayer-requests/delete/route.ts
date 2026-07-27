import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Permanently deletes a prayer request. Admin-only, irreversible — for
// spam, duplicate, or otherwise-shouldn't-exist submissions. For a request
// that should stop being active but is otherwise legitimate, prefer
// archiving/answering it over deleting it, since deletion also removes it
// from whichever member's My Journey timeline and from care-team history.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body ?? {};

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
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
      .from("prayer_requests")
      .delete()
      .eq("id", requestId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete prayer request error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting prayer request" },
      { status: 500 }
    );
  }
}
