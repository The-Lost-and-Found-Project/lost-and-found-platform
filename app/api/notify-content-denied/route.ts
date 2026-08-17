import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { escapeEmailHtml, renderLfpEmail } from "@/lib/email/html";

const FROM_ADDRESS =
  "The Lost and Found Project <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent when an admin denies a flagged prayer request from the moderation
// queue. Gentle by design — invites the person to revise and resubmit
// rather than just telling them their content was rejected.
//
// Only ever called from the admin dashboard's deny button, which itself is
// only rendered for admins on the server-gated /admin page — so this route
// re-verifies the caller is an admin here too, rather than trusting that
// the request only ever comes from that button.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

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
      typeof name === "string" && name.trim()
        ? escapeEmailHtml(name.trim().split(" ")[0])
        : "friend";

    const html = renderLfpEmail({
      preheader: "Your prayer request needs a revision before it can appear publicly.",
      eyebrow: "Prayer request update",
      title: `A quick update, ${firstName}`,
      siteUrl: SITE_URL,
      reason: "You received this email because a Community Admin reviewed a prayer request submitted from your account.",
      bodyHtml: `
        <p style="margin:0 0 16px;">Thank you for trusting the community with your prayer request. A Community Admin could not publish the current version to the public Prayer ticker because it needs changes to meet the community&apos;s privacy or safety guidelines.</p>
        <p style="margin:0 0 16px;">Your request was not assigned to another member, and this decision does not prevent you from participating in the community.</p>
        <p style="margin:0;">You can review the wording and submit an appropriate revision from My Prayer Requests.</p>
      `,
      actions: [
        { href: `${SITE_URL}/prayer/my-requests`, label: "Review Your Request", primary: true },
        { href: `${SITE_URL}/support`, label: "Get Help" },
      ],
    });
    const text = `Hi ${firstName},\n\nA Community Admin could not publish the current version of your prayer request because it needs changes to meet the community's privacy or safety guidelines. Your request was not assigned to another member.\n\nReview your request: ${SITE_URL}/prayer/my-requests\nGet help: ${SITE_URL}/support`;

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Action needed: review your prayer request",
      html,
      text,
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
