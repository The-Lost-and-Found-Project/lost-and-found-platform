import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "The Lost and Found Project <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent to administrators whenever a new praise report is submitted so they
// know there is something new to review for the public Praise Wall.
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
    const { data: admins, error: adminLookupError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminLookupError) throw adminLookupError;

    const adminIds = (admins ?? []).map((member) => member.id);
    const { data: disabledSettings } = adminIds.length
      ? await supabase
          .from("user_settings")
          .select("user_id")
          .in("user_id", adminIds)
          .eq("email_notifications", false)
      : { data: [] };
    const disabledUserIds = new Set(
      (disabledSettings ?? []).map((setting) => setting.user_id)
    );

    const recipients = (admins ?? [])
      .filter((member) => !disabledUserIds.has(member.id))
      .map((m) => m.email)
      .filter((e): e is string => Boolean(e));

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, skipped: "no administrators" });
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

    return NextResponse.json({
      success: true,
      push: "handled_by_notification_webhook",
    });
  } catch (err) {
    console.error("notify-new-praise-admin error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-praise-report notification" },
      { status: 500 }
    );
  }
}
