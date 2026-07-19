import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.lostandfoundproject.org";

// Sent when an admin denies a flagged prayer request from the moderation
// queue. Gentle by design — invites the person to revise and resubmit
// rather than just telling them their content was rejected.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body ?? {};

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email notifications are not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const firstName =
      typeof name === "string" && name.trim() ? name.trim().split(" ")[0] : "friend";

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">About your recent prayer request</h2>
        <p style="color: #555; margin-top: 0;">Hi ${firstName},</p>
        <p>
          Thank you for reaching out to The Lost and Found Project. After
          reviewing your recent prayer request, our team wasn't able to
          publish it as submitted &mdash; usually this just means some of the
          wording didn't fit our community guidelines (for example, strong
          language, or content that could be hurtful to others).
        </p>
        <p>
          This doesn't mean we don't want to hear from you or pray with you.
          You're welcome to revise and resubmit your request any time from
          your account.
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${SITE_URL}/my-journey" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600;">
            Revise Your Request
          </a>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          If you have questions about this, please don't hesitate to reach
          out to us directly. We're honored to walk with you.
          &mdash; The Lost and Found Project team
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "About your recent prayer request",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send content-denied notification" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-content-denied error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending content-denied notification" },
      { status: 500 }
    );
  }
}
