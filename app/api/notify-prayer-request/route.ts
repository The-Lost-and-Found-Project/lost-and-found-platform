import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "chad@lostandfoundproject.org";
const FROM_ADDRESS = "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.lostandfoundproject.org";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      preferredContact,
      categoryName,
      careLevel,
      routeTo,
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

    const resend = new Resend(apiKey);

    const subject = `New Prayer Request${
      categoryName ? ` — ${categoryName}` : ""
    }${routeTo ? ` (route: ${routeTo})` : ""}`;

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">New Prayer Request Submitted</h2>
        <p style="color: #555; margin-top: 0;">
          ${categoryName ? `Category: <strong>${categoryName}</strong><br/>` : ""}
          ${careLevel ? `Suggested care level: <strong>${careLevel}</strong><br/>` : ""}
          ${routeTo ? `Route to: <strong>${routeTo}</strong><br/>` : ""}
        </p>
        <blockquote style="border-left: 3px solid #ccc; margin: 16px 0; padding-left: 12px; color: #222;">
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
            contactRequested ? `Yes${preferredContact ? ` (${preferredContact})` : ""}` : "No"
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
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send notification email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-prayer-request error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending notification" },
      { status: 500 }
    );
  }
}
