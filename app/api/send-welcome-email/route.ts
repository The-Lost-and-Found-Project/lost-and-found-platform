import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeEmailHtml, renderLfpEmail } from "@/lib/email/html";

const FROM_ADDRESS =
  "The Lost and Found Project <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";
const GIVE_URL =
  "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

// Sent exactly once, right after someone confirms their email for the first
// time. Distinct from Supabase's built-in confirmation email — this one
// explains the ministry in depth and makes the ask for ongoing monthly
// support.
// Only ever called server-side — gated by a shared secret so it can't be
// used as an open relay to send our "welcome" email (with its donation ask)
// to arbitrary addresses. Two independent triggers call this route for
// redundancy: app/auth/callback/route.ts (the common case, right after a
// user's confirmation link exchange succeeds) and a Postgres trigger on
// auth.users that fires whenever email_confirmed_at is set (a safety net —
// Supabase marks the account confirmed even if the browser that clicks the
// confirmation link is different from the one that signed up, which makes
// the callback's code exchange fail silently). Because both can fire for
// the same user, mark_welcome_email_sent() below makes this idempotent.
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

    // Atomically claim the "send the welcome email" slot for this user. If
    // another call already claimed it (or the profile can't be found),
    // treat this as a successful no-op rather than sending a duplicate.
    const admin = createAdminClient();
    const { data: shouldSend, error: rpcError } = await admin.rpc(
      "mark_welcome_email_sent",
      { p_email: email }
    );
    if (rpcError) {
      console.error("mark_welcome_email_sent error:", rpcError);
    } else if (!shouldSend) {
      return NextResponse.json({ success: true, skipped: true });
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
        ? escapeEmailHtml(fullName.trim().split(" ")[0])
        : "friend";

    const html = renderLfpEmail({
      preheader: "Welcome to a community centered on prayer, praise, and testimony.",
      eyebrow: "Welcome",
      title: `You belong here, ${firstName}.`,
      siteUrl: SITE_URL,
      reason: "You received this one-time welcome because you confirmed a new Community Member account.",
      bodyHtml: `
        <p style="margin:0 0 16px;">The Lost and Found Project is a Christian community where people bring needs before God, celebrate His faithfulness, and share stories that help others find hope.</p>
        <p style="margin:0 0 10px;font-weight:800;color:#0f172a;">You can now:</p>
        <ul style="margin:0 0 18px;padding-left:22px;">
          <li style="margin-bottom:8px;"><strong>Request prayer</strong> privately or for the moderated public Prayer ticker.</li>
          <li style="margin-bottom:8px;"><strong>Pray for others</strong> as often as you are led.</li>
          <li style="margin-bottom:8px;"><strong>Share praise and testimony</strong> to encourage the community.</li>
          <li style="margin-bottom:8px;"><strong>Explore future L&amp;F apps</strong> as dedicated learning experiences become ready.</li>
        </ul>
        <p style="margin:0 0 16px;"><strong>Using a phone or iPad?</strong> Add the Community App to your Home Screen from your browser&apos;s Share or Install menu.</p>
        <p style="margin:0;">Participation is free. If you choose to give, your optional support helps the ministry serve more people responsibly.</p>
      `,
      actions: [
        { href: `${SITE_URL}/login`, label: "Open Your Account", primary: true },
        { href: `${SITE_URL}/apps`, label: "See Future Apps" },
        { href: GIVE_URL, label: "Give Securely" },
      ],
    });
    const text = `Welcome to The Lost and Found Project, ${firstName}.\n\nYou can request prayer, pray for others as often as you are led, share praise and testimony, and explore future L&F apps.\n\nOpen your account: ${SITE_URL}/login\nFuture apps: ${SITE_URL}/apps\nOptional giving: ${GIVE_URL}\n\nYou received this one-time welcome because you confirmed a new Community Member account.`;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Welcome — you belong here",
      html,
      text,
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
