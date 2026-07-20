import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.lostandfoundproject.org";

// Sent whenever a care team member is assigned (matched) to a prayer
// request, in addition to the in-app notification created by a DB trigger
// (either notify_prayer_request_assigned for manual admin assignment, or
// notify_auto_assigned_care_team_member for the automatic round-robin
// assignment on new submissions). Includes the full submission so the
// assignee can contact the person directly if needed.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`notify-assignment:${ip}`, 15, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const {
      assigneeId,
      name,
      email,
      phone,
      preferredContact,
      categoryName,
      requestText,
      isPublic,
      isAnonymous,
      contactRequested,
    } = body ?? {};

    // Both real callers (the public submission form and the admin dashboard)
    // only ever send assigneeId. We always look up the email/name ourselves
    // server-side with the service role — never trust a client-supplied
    // assigneeEmail/assigneeName, which would otherwise let anyone send
    // arbitrary content to an arbitrary address from our verified domain.
    if (!assigneeId) {
      return NextResponse.json(
        { error: "Missing assigneeId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: assignee } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", assigneeId)
      .single();

    const assigneeEmail = assignee?.email ?? undefined;
    const assigneeName = assignee?.full_name ?? null;

    if (!assigneeEmail || !requestText) {
      return NextResponse.json(
        { error: "Missing assignee email or request text" },
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

    const resend = new Resend(apiKey);

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">You've been matched with a prayer request</h2>
        <p style="color: #555; margin-top: 0;">
          Hi ${assigneeName ?? "there"}, you've been assigned to follow up on this request.
          ${categoryName ? `<br/>Category: <strong>${categoryName}</strong>` : ""}
        </p>
        <blockquote style="border-left: 3px solid #6366f1; margin: 16px 0; padding-left: 12px; color: #222;">
          ${requestText}
        </blockquote>
        <p style="margin-top: 20px;">
          <strong>Submitted by:</strong> ${isAnonymous ? "Anonymous (name on file)" : name}<br/>
          <strong>Name:</strong> ${name ?? "N/A"}<br/>
          <strong>Email:</strong> ${email ?? "N/A"}<br/>
          ${phone ? `<strong>Phone:</strong> ${phone}<br/>` : ""}
          <strong>Visibility:</strong> ${isPublic ? "Public prayer wall" : "Private"}${
            isAnonymous ? " (anonymous on wall)" : ""
          }<br/>
          <strong>Wants contact:</strong> ${
            contactRequested
              ? `Yes${preferredContact ? ` (${preferredContact})` : ""}`
              : "No"
          }
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
      to: assigneeEmail,
      subject: "You've been matched with a prayer request",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send assignment notification email" },
        { status: 502 }
      );
    }

    if (assigneeId) {
      sendPushToUser(assigneeId, {
        title: "New prayer request assigned to you",
        body: categoryName
          ? `${categoryName}: ${requestText.slice(0, 100)}`
          : requestText.slice(0, 120),
        url: "/admin",
      }).catch((err) => {
        console.error("Failed to send assignment push notification:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-assignment error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending assignment notification" },
      { status: 500 }
    );
  }
}
