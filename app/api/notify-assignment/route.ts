import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent whenever a care team member is assigned (matched) to a prayer
// request, in addition to the in-app notification created by the
// notify_prayer_request_assigned DB trigger. Has two legitimate callers:
// the admin dashboard's manual reassignment, and the public submission
// form's auto-assignment follow-up (which may be an anonymous, signed-out
// submitter — so this route can't simply require an authenticated admin).
//
// Instead of trusting the caller for the recipient or email content, this
// route only ever accepts a requestId and looks everything else up itself
// via the service-role client: the assignee, and the request's own
// name/email/category/text. That means a caller can't use this endpoint to
// send an email to an arbitrary address or with arbitrary content — at
// most they can (re)trigger the real assignment email for a request that
// genuinely has an assignee in the database.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body ?? {};

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: prayerRequest } = await admin
      .from("prayer_requests")
      .select(
        "name, email, phone, preferred_contact, contact_requested, category_id, request_text, is_public, is_anonymous, assigned_to"
      )
      .eq("id", requestId)
      .single();

    if (!prayerRequest?.assigned_to) {
      return NextResponse.json(
        { error: "Request not found or has no assignee" },
        { status: 404 }
      );
    }

    const { data: assignee } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", prayerRequest.assigned_to)
      .single();

    if (!assignee?.email) {
      return NextResponse.json(
        { error: "Assignee not found or has no email on file" },
        { status: 404 }
      );
    }

    const { data: assigneeSettings } = await admin
      .from("user_settings")
      .select("email_notifications")
      .eq("user_id", prayerRequest.assigned_to)
      .maybeSingle();

    if (assigneeSettings?.email_notifications === false) {
      return NextResponse.json({
        success: true,
        email: "skipped_by_preference",
      });
    }

    let categoryName: string | null = null;
    if (prayerRequest.category_id) {
      const { data: category } = await admin
        .from("prayer_categories")
        .select("name")
        .eq("id", prayerRequest.category_id)
        .single();
      categoryName = category?.name ?? null;
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

    const {
      name,
      email,
      phone,
      preferred_contact: preferredContact,
      contact_requested: contactRequested,
      request_text: requestText,
      is_public: isPublic,
      is_anonymous: isAnonymous,
    } = prayerRequest;

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">You've been matched with a prayer request</h2>
        <p style="color: #555; margin-top: 0;">
          Hi ${assignee.full_name ?? "there"}, you've been assigned to follow up on this request.
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

    const { error } = await resend.emails.send(
      {
        from: FROM_ADDRESS,
        to: assignee.email,
        subject: "You've been matched with a prayer request",
        html,
      },
      { idempotencyKey: `prayer-assignment/${requestId}/${prayerRequest.assigned_to}` }
    );

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
