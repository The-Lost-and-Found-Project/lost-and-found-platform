import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://lost-and-found-platform-rho.vercel.app";

// Sent whenever someone creates a new account (calls supabase.auth.signUp()
// on the login page). Notifies every admin so they know a new person has
// joined, even before that person confirms their email.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email) {
      return NextResponse.json(
        { error: "Missing new user's email" },
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
        <h2 style="margin-bottom: 4px;">A new account was just created</h2>
        <p style="color: #555; margin-top: 0;">
          Someone signed up for The Lost and Found Project.
        </p>
        <p style="margin-top: 16px;">
          <strong>Email:</strong> ${email}
        </p>
        <p style="margin-top: 24px;">
          <a href="${SITE_URL}/admin" style="color: #4f46e5;">
            Open the Admin Dashboard
          </a>
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject: "New account created",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send new signup notification email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-new-signup error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending new signup notification" },
      { status: 500 }
    );
  }
}
