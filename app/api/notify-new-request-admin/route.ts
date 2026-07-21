import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent whenever a new prayer request is submitted. Admins used to get an
// in-app notification broadcast (along with every other care team member),
// but that was retired as noisy since the assigned care team member already
// gets their own personal "you've been matched" notification + email. This
// route replaces it with a lightweight, email-only heads-up sent to admins
// only, so leadership still has visibility into new submissions without
// paging the whole care team.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      categoryName,
      requestText,
      isPublic,
      isAnonymous,
      contactRequested,
    } = body ?? {};

    if (!requestText) {
      return NextResponse.json(
        { error: "Missing request text" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email notifications are not configured" },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .not("email", "is", null);

    if (adminsError) throw adminsError;

    const recipients = (admins ?? [])
      .map((a) => a.email)
      .filter((e): e is string => Boolean(e));

    if (recipients.length === 0) {
      return NextResponse.json({ success: true, skipped: "no admins" });
    }

    const resend = new Resend(apiKey);

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">New prayer request submitted</h2>
        <p style="color: #555; margin-top: 0;">
          ${categoryName ? `Category: <strong>${categoryName}</strong>` : "No category selected"}
        </p>
        <blockquote style="border-left: 3px solid #6366f1; margin: 16px 0; padding-left: 12px; color: #222;">
          ${requestText}
        </blockquote>
        <p style="margin-top: 20px;">
          <strong>Submitted by:</strong> ${isAnonymous ? "Anonymous (name on file)" : name ?? "N/A"}<br/>
          <strong>Visibility:</strong> ${isPublic ? "Public prayer wall" : "Private"}${
            isAnonymous ? " (anonymous on wall)" : ""
          }<br/>
          <strong>Wants contact:</strong> ${contactRequested ? "Yes" : "No"}
        </p>
        <p style="margin-top: 24px;">
          <a href="${SITE_URL}/admin" style="color: #4f46e5;">
            Open the Prayer Care Admin Dashboard
          </a>
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: "New prayer request submitted",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send new-request admin notification email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-new-request-admin error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new-request admin notification" },
      { status: 500 }
    );
  }
}
