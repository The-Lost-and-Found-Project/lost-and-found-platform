import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPrayerEscalation } from "@/lib/notifications/care-alerts";

const ALLOWED_FIELDS = [
  "action_contacted_at",
  "action_prayed_at",
  "action_update_sent_at",
  "last_action_at",
  "follow_up_needed",
  "follow_up_date",
  "answered",
  "status",
  "praise_report",
] as const;

const ALLOWED_STATUSES = [
  "Submitted", "Reviewed", "Assigned", "Active Care", "Follow-Up",
  "Resolved", "Closed", "Needs Reassignment", "Escalated",
  "Unable to Contact", "Withdrawn",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, changes } = body ?? {};

    if (!requestId || !changes || typeof changes !== "object") {
      return NextResponse.json(
        { error: "Missing requestId or changes" },
        { status: 400 }
      );
    }

    const invalidField = Object.keys(changes).find(
      (key) => !ALLOWED_FIELDS.includes(key as (typeof ALLOWED_FIELDS)[number])
    );
    if (invalidField) {
      return NextResponse.json(
        { error: `Field not allowed: ${invalidField}` },
        { status: 400 }
      );
    }

    if (changes.status && !ALLOWED_STATUSES.includes(changes.status)) {
      return NextResponse.json({ error: "Invalid prayer workflow status" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: previousRequest, error: previousError } = await admin
      .from("prayer_requests")
      .select("status")
      .eq("id", requestId)
      .eq("assigned_to", user.id)
      .eq("archived", false)
      .maybeSingle();

    if (previousError) throw previousError;

    const { data, error } = await admin
      .from("prayer_requests")
      .update(changes)
      .eq("id", requestId)
      .eq("assigned_to", user.id)
      .eq("archived", false)
      .select(
        "id, action_contacted_at, action_prayed_at, action_update_sent_at, last_action_at, follow_up_needed, follow_up_date, answered, status, praise_report"
      )
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: "Assignment not found or no longer assigned to you" },
        { status: 404 }
      );
    }

    if (previousRequest?.status !== "Escalated" && data.status === "Escalated") {
      try {
        await notifyPrayerEscalation({
          admin,
          prayerRequestId: data.id,
          assignedTo: user.id,
          actorUserId: user.id,
        });
      } catch (notificationError) {
        console.error("prayer escalation notification error:", notificationError);
      }
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    console.error("update prayer assignment error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating prayer assignment" },
      { status: 500 }
    );
  }
}
