import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <prayer@updates.lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent whenever a care team member is assigned (matched) to a prayer
// request, in addition to the in-app notification created by the
// notify_prayer_request_assigned DB trigger. Includes the full submission so
// the assignee can contact the person directly if needed.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      assigneeEmail,
      assigneeName,
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-assignment error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending assignment notification" },
      { status: 500 }
    );
  }
}
