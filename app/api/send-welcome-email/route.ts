import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";
const GIVE_URL =
  "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

// Sent exactly once, right after someone confirms their email for the first
// time (fired from app/auth/callback/route.ts). Distinct from Supabase's
// built-in confirmation email — this one explains the ministry in depth and
// makes the ask for ongoing monthly support.
// Only ever called server-side from app/auth/callback/route.ts, never
// directly from the browser — gated by a shared secret so it can't be used
// as an open relay to send our "welcome" email (with its donation ask) to
// arbitrary addresses.
export async function POST(request: NextRequest) {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret = request.headers.get("x-internal-secret");
  if (!internalSecret || providedSecret !== internalSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`send-welcome-email:${ip}`, 10, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, fullName } = body ?? {};

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
      typeof fullName === "string" && fullName.trim()
        ? fullName.trim().split(" ")[0]
        : "friend";

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #111; max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 22px; margin-bottom: 4px;">Welcome to The Lost and Found Project, ${firstName}!</h1>
        <p style="color: #555; margin-top: 0;">
          We're so glad you're here.
        </p>

        <p>
          The Lost and Found Project exists to help people who feel alone
          find real community, real prayer, and real support. Whatever
          season you're walking through, our care team is here to pray with
          you, encourage you, and walk alongside you &mdash; not just once,
          but for the long haul.
        </p>

        <p>
          Here's what you can do now that you've joined:
        </p>
        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;">
            <strong>Submit a prayer request</strong> any time you need one,
            privately or on our public Prayer Wall.
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Pray for others</strong> and read testimonies of healing,
            provision, and hope from people in our community.
          </li>
          <li style="margin-bottom: 8px;">
            <strong>Track your own journey</strong> &mdash; salvation,
            baptism, and the milestones along the way.
          </li>
        </ul>

        <p>
          <strong>Tip:</strong> add this app to your phone's home screen so
          it opens like any other app. On <strong>iPhone/iPad</strong>, tap
          the Share icon in Safari, then &ldquo;Add to Home Screen.&rdquo;
          On <strong>Android</strong>, tap the three-dot menu in Chrome,
          then &ldquo;Add to Home screen&rdquo; (or &ldquo;Install
          app&rdquo;).
        </p>

        <p>
          None of this happens without people like you. The Lost and Found
          Project is sustained entirely by the generosity of our community,
          and a recurring monthly gift &mdash; even a small one &mdash; helps
          us keep showing up for the next person who needs prayer, support,
          or simply someone to walk with them. If you're able, would you
          consider becoming a monthly partner with us?
        </p>

        <p style="text-align: center; margin: 28px 0;">
          <a href="${GIVE_URL}" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600;">
            Become a Monthly Partner
          </a>
        </p>

        <p>
          Ready to jump in? Sign in any time to submit a request, browse the
          Prayer Wall, or update your profile.
        </p>

        <p style="text-align: center; margin: 20px 0;">
          <a href="${SITE_URL}/login" style="color: #4f46e5; font-weight: 600;">
            Sign In to Your Account
          </a>
        </p>

        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          You're not walking this alone. We're honored to walk with you.
          &mdash; The Lost and Found Project team
        </p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome to The Lost and Found Project",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-welcome-email error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending welcome email" },
      { status: 500 }
    );
  }
}
