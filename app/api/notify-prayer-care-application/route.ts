import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
    const { applicationId } = body ?? {};

    if (!applicationId) {
      return NextResponse.json({ error: "Missing applicationId" }, { status: 400 });
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: application } = await supabase
      .from("prayer_care_applications")
      .select("id, user_id, reason")
      .eq("id", applicationId)
      .single();

    if (!application || application.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminsError) throw adminsError;

    const adminIds = (admins ?? []).map((m) => m.id);
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
      .filter((admin) => !disabledUserIds.has(admin.id))
      .map((m) => m.email)
      .filter((e): e is string => Boolean(e));

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
            application.reason?.trim()
              ? `<blockquote style="border-left: 3px solid #4f46e5; margin: 16px 0; padding-left: 12px; color: #222;">${application.reason}</blockquote>`
              : ""
          }
          <p style="margin-top: 24px;">
            <a href="${SITE_URL}/admin/applications" style="color: #4f46e5;">
              Review the application
            </a>
          </p>
        </div>
      `;

      const { error } = await resend.emails.send(
        {
          from: FROM_ADDRESS,
          to: FROM_ADDRESS,
          bcc: recipients,
          subject: "New Prayer Care Team application",
          html,
        },
        { idempotencyKey: `prayer-care-application/${application.id}` }
      );

      if (error) {
        console.error("Resend error:", error);
      }
    } else if (!apiKey) {
      console.error("RESEND_API_KEY is not configured — skipping email");
    }

    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("user_id")
      .eq("type", "prayer_care_application")
      .eq("application_id", application.id)
      .in("user_id", adminIds);
    const alreadyNotified = new Set(
      (existingNotifications ?? []).map((notification) => notification.user_id)
    );
    const notificationsToInsert = adminIds
      .filter((userId) => !alreadyNotified.has(userId))
      .map((userId) => ({
          user_id: userId,
          type: "prayer_care_application",
          title: "New Prayer Care Team application",
          body: "A member has applied to join the Prayer Care Team.",
          link: "/admin/applications",
          application_id: application.id,
        }));

    const { error: notificationError } = notificationsToInsert.length
      ? await supabase.from("notifications").insert(notificationsToInsert)
      : { error: null };

    if (notificationError) throw notificationError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-prayer-care-application error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-application notification" },
      { status: 500 }
    );
  }
}
