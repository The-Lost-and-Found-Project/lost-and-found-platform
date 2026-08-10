import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contentText =
      typeof body?.contentText === "string" ? body.contentText.trim() : "";
    const prayerRequestId =
      typeof body?.prayerRequestId === "string" && body.prayerRequestId
        ? body.prayerRequestId
        : null;

    if (!contentText) {
      return NextResponse.json(
        { error: "Please enter a praise report." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createAdminClient();

    if (prayerRequestId) {
      const { data: ownedRequest } = await admin
        .from("prayer_requests")
        .select("id")
        .eq("id", prayerRequestId)
        .eq("user_id", user.id)
        .single();

      if (!ownedRequest) {
        return NextResponse.json({ error: "Prayer request not found" }, { status: 404 });
      }
    }

    const { error: insertError } = await admin.from("praise_reports").insert({
      user_id: user.id,
      content_text: contentText,
      prayer_request_id: prayerRequestId,
    });

    if (insertError) throw insertError;

    if (prayerRequestId) {
      const { error: updateError } = await admin
        .from("prayer_requests")
        .update({ answered: true, status: "Resolved" })
        .eq("id", prayerRequestId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("praise-report submission error:", err);
    return NextResponse.json(
      { error: "Unexpected error sharing praise report" },
      { status: 500 }
    );
  }
}
