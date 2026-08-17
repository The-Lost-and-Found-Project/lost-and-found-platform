import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Only these columns can ever be touched through this route — an allowlist
// rather than passing whatever "changes" object the client sends straight
// through, so this can't be turned into a generic "update any column"
// endpoint even by an admin's own compromised browser session.
const ALLOWED_FIELDS = [
  "status",
  "answered",
  "praise_report",
  "moderation_status",
  "flagged",
  "flag_reason",
  "request_text",
  "category_id",
  "is_public",
  "is_anonymous",
];

const ALLOWED_STATUSES = [
  "Submitted", "Reviewed", "Resolved", "Closed", "Escalated", "Withdrawn",
];

// Backs every prayer-request moderation action in the admin dashboard —
// approve, deny, manual flag, edit, and answered
// toggles. These used to go straight from the browser to Supabase with the
// anon key, which meant enforcement depended entirely on RLS policies that
// aren't version-controlled anywhere. This route re-verifies the caller is
// an admin on the server (matching the same pattern already used for
// delete/set-role/set-active) before making any change, using the
// service-role client to perform the actual write.
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
      (key) => !ALLOWED_FIELDS.includes(key)
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

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prayer_requests")
      .update(changes)
      .eq("id", requestId)
      .select(
        "id, status, answered, praise_report, moderation_status, flagged, flag_reason, request_text, category_id, is_public, is_anonymous"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    console.error("update prayer request error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating prayer request" },
      { status: 500 }
    );
  }
}
