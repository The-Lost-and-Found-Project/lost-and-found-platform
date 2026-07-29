import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called when a member picks "Remove it" from the check-in options on My
// Journey. The database prevents members from changing the privileged
// `archived` field directly, so this authenticated route verifies ownership,
// archives the request with the service-role client, and then lets the
// currently assigned prayer partner know they can stop following up.
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

    const { data: archivedRequest, error: archiveError } = await admin
      .from("prayer_requests")
      .update({ archived: true })
      .eq("id", requestId)
      .eq("user_id", user.id)
      .select(
        "id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status, answered, answered_update, archived"
      )
      .single();

    if (archiveError || !archivedRequest) {
      throw archiveError ?? new Error("Prayer request could not be archived");
    }

    let notificationSent = false;

    if (prayerRequest.assigned_to) {
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

      if (insertError) {
        // Archiving is the member's primary action. A notification outage
        // should not make the successful removal look like it failed.
        console.error("request-removed notification error:", insertError);
      } else {
        notificationSent = true;
      }
    }

    return NextResponse.json({
      success: true,
      request: archivedRequest,
      notificationSent,
    });
  } catch (err) {
    console.error("notify-request-removed error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending removal notification" },
      { status: 500 }
    );
  }
}
