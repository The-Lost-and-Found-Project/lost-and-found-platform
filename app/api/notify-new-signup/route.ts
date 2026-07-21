import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push/send";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

// Sent whenever someone creates a new account (calls supabase.auth.signUp()
// on the signup page). Push-only — admins used to also get an individual
// email per signup, but that got noisy and was retired in favor of rolling
// new members into the weekly digest instead (see
// app/api/cron/weekly-digest/route.ts). This push is just a lightweight,
// real-time heads-up to the care team; the digest still has the full detail.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(
    `notify-new-signup:${ip}`,
    10,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { fullName } = body ?? {};

    const supabase = createAdminClient();
    const { data: careTeam, error: careTeamError } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "prayer_team", "pastor"]);

    if (careTeamError) throw careTeamError;

    const careTeamIds = (careTeam ?? []).map((m) => m.id);

    if (careTeamIds.length === 0) {
      return NextResponse.json({ success: true, skipped: "no care team" });
    }

    const displayName =
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : "Someone";

    try {
      await sendPushToUsers(careTeamIds, {
        title: "New member joined",
        body: `${displayName} just signed up for Lost and Found.`,
        url: "/admin/users",
      });
    } catch (err) {
      console.error("Failed to send new-signup push notification:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-new-signup error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-signup notification" },
      { status: 500 }
    );
  }
}
