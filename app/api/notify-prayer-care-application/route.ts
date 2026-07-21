import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push/send";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.lostandfoundproject.org";

// Sent whenever a member submits a Prayer Care Team application. Only admins
// can approve/deny (it changes someone's role), so unlike the broader
// care-team notifications this goes to admins only.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(
    `notify-prayer-care-application:${ip}`,
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
    const { reason } = body ?? {};

    const supabase = createAdminClient();
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminsError) throw adminsError;

    const recipients = (admins ?? [])
      .map((m) => m.email)
      .filter((e): e is string => Boolean(e));
    const adminIds = (admins ?? []).map((m) => m.id);

    if (adminIds.length === 0) {
      return NextResponse.json({ success: true, skipped: "no admins" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && recipients.length > 0) {
      const resend = new Resend(apiKey);
      const html = `
        <div style="font-family: sans-serif; font-size: 15px; color: #111;">
          <h2 style="margin-bottom: 4px;">New Prayer Care Team application</h2>
          ${
            typeof reason === "string" && reason.trim()
              ? `<blockquote style="border-left: 3px solid #4f46e5; margin: 16px 0; padding-left: 12px; color: #222;">${reason}</blockquote>`
              : ""
          }
          <p style="margin-top: 24px;">
            <a href="${SITE_URL}/admin/applications" style="color: #4f46e5;">
              Review the application
            </a>
          </p>
        </div>
      `;

      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: FROM_ADDRESS,
        bcc: recipients,
        subject: "New Prayer Care Team application",
        html,
      });

      if (error) {
        console.error("Resend error:", error);
      }
    } else if (!apiKey) {
      console.error("RESEND_API_KEY is not configured — skipping email");
    }

    sendPushToUsers(adminIds, {
      title: "New Prayer Care Team application",
      body: "A member has applied to join the Prayer Care Team.",
      url: "/admin/applications",
    }).catch((err) => {
      console.error(
        "Failed to send new-application push notification:",
        err
      );
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-prayer-care-application error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-application notification" },
      { status: 500 }
    );
  }
}
