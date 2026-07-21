import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is actually an admin before touching anything.
    // Never trust a role sent from the client.
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
        { error: "Only admins can review applications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { applicationId, decision, reviewNote } = body ?? {};

    if (
      typeof applicationId !== "string" ||
      (decision !== "approved" && decision !== "denied")
    ) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: application, error: fetchError } = await admin
      .from("prayer_care_applications")
      .select("id, user_id, status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "This application has already been reviewed" },
        { status: 409 }
      );
    }

    const { error: updateError } = await admin
      .from("prayer_care_applications")
      .update({
        status: decision,
        review_note:
          typeof reviewNote === "string" && reviewNote.trim()
            ? reviewNote.trim()
            : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      throw updateError;
    }

    // Only bump the applicant's role on approval, and only if they're still
    // a plain member -- don't downgrade a pastor/admin who happened to apply,
    // and don't clobber a role that changed for some other reason.
    if (decision === "approved") {
      const { data: applicantProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", application.user_id)
        .single();

      if (applicantProfile?.role === "member") {
        const { error: roleError } = await admin
          .from("profiles")
          .update({ role: "prayer_team" })
          .eq("id", application.user_id);

        if (roleError) {
          console.error(
            "Application approved but failed to update role:",
            roleError
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin applications decide error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating application" },
      { status: 500 }
    );
  }
}
