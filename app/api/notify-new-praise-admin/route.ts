import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push/send";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.lostandfoundproject.org";

// Sent whenever a new praise report is submitted. Unlike the flagged/decision
// moderation notifications (which only go to whoever needs to act), this goes
// to the whole care team — admins, prayer team, and pastors — so everyone
// gets to celebrate the good news and admins know there's something new to
// review for the public Praise Wall.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`notify-new-praise-admin:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { contentText } = body ?? {};

    if (!contentText) {
      return NextResponse.json(
        { error: "Missing praise report text" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: careTeam, error: careTeamError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("role", ["admin", "prayer_team", "pastor"])
      .not("email", "is", null);

    if (careTeamError) throw careTeamError;

    const recipients = (careTeam ?? [])
      .map((m) => m.email)
      .filter((e): e is string => Boolean(e));
    const careTeamIds = (careTeam ?? []).map((m) => m.id);

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, skipped: "no care team" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const html = `
        <div style="font-family: sans-serif; font-size: 15px; color: #111;">
          <h2 style="margin-bottom: 4px;">New praise report shared</h2>
          <blockquote style="border-left: 3px solid #f59e0b; margin: 16px 0; padding-left: 12px; color: #222;">
            ${contentText}
          </blockquote>
          <p style="margin-top: 24px;">
            <a href="${SITE_URL}/praise" style="color: #4f46e5;">
              View the Praise Wall
            </a>
          </p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: FROM_ADDRESS,
        bcc: recipients,
        subject: "New praise report shared",
        html,
      });

      if (error) {
        console.error("Resend error:", error);
      }
    } else {
      console.error("RESEND_API_KEY is not configured — skipping email");
    }

    const pushBody =
      typeof contentText === "string" ? contentText.slice(0, 120) : "";
    sendPushToUsers(careTeamIds, {
      title: "New praise report shared",
      body: pushBody,
      url: "/praise",
    }).catch((err) => {
      console.error("Failed to send new-praise-report push notification:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-new-praise-admin error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-praise-report notification" },
      { status: 500 }
    );
  }
}
