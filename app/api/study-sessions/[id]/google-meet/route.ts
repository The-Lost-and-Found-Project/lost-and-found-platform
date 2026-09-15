import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMeetSpace } from "@/lib/google-meet/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const admin = createAdminClient();
    const [{ data: profile }, { data: session, error: sessionError }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      admin
        .from("study_sessions")
        .select("id, facilitator_user_id, google_space_name, google_meeting_uri, google_meeting_code, google_organizer_email")
        .eq("id", id)
        .maybeSingle(),
    ]);

    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json({ error: "Study session not found." }, { status: 404 });
    }

    const isAdmin = profile?.role === "admin";
    const isAssignedFacilitator = session.facilitator_user_id === user.id;
    if (!isAdmin && !isAssignedFacilitator) {
      return NextResponse.json({ error: "You do not have permission to provision this meeting." }, { status: 403 });
    }

    if (session.google_space_name && session.google_meeting_uri) {
      return NextResponse.json({
        meeting: {
          spaceName: session.google_space_name,
          meetingCode: session.google_meeting_code,
          meetingUri: session.google_meeting_uri,
          organizerEmail: session.google_organizer_email,
        },
        reused: true,
      });
    }

    let facilitatorEmail: string | null = null;
    if (session.facilitator_user_id) {
      const { data: facilitator } = await admin
        .from("profiles")
        .select("email")
        .eq("id", session.facilitator_user_id)
        .maybeSingle();
      facilitatorEmail = facilitator?.email || null;
    }

    const meeting = await provisionMeetSpace(facilitatorEmail);

    const { error: updateError } = await admin
      .from("study_sessions")
      .update({
        google_space_name: meeting.spaceName,
        google_meeting_code: meeting.meetingCode,
        google_meeting_uri: meeting.meetingUri,
        google_organizer_email: meeting.organizerEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("google_space_name", null);

    if (updateError) throw updateError;

    return NextResponse.json({ meeting, reused: false }, { status: 201 });
  } catch (error) {
    console.error("Google Meet provisioning failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to provision Google Meet." },
      { status: 500 },
    );
  }
}
