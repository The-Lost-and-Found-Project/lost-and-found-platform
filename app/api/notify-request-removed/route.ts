import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called when a member picks "Remove it" from the check-in options on My
// Journey. The request itself is archived client-side (same mechanism as
// the 30-day auto-archive — it drops off the public Prayer Wall but stays
// on the member's own timeline). This route just lets the currently
// assigned prayer partner know they can stop following up, so they're not
// left praying over something the member has moved on from. Any future new
// request from this member is a brand-new row with its own fresh rotation
// assignment — nothing here "resurrects" this one.
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

    const admin = createAdminClient();

    // Confirm the caller actually owns this request before telling anyone
    // it was removed.
    const { data: prayerRequest } = await admin
      .from("prayer_requests")
      .select("user_id, assigned_to, is_anonymous, name")
      .eq("id", requestId)
      .single();

    if (!prayerRequest || prayerRequest.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!prayerRequest.assigned_to) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const submitterLabel = prayerRequest.is_anonymous
      ? "The member you're praying for"
      : prayerRequest.name ?? "The member you're praying for";

    const { error: insertError } = await admin.from("notifications").insert({
      user_id: prayerRequest.assigned_to,
      type: "request_removed",
      title: "A prayer request was removed",
      body: `${submitterLabel} let us know they no longer need follow-up on this request — no further action needed.`,
      link: "/prayer-assignments",
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-request-removed error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending removal notification" },
      { status: 500 }
    );
  }
}
