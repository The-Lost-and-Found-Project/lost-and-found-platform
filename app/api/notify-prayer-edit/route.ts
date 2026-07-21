import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push/send";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://app.lostandfoundproject.org";

// Sent when a member edits a prayer request that's already been assigned to
// a care team member, so the assignee doesn't keep praying over/following up
// on stale details. We look up the request and its assignee ourselves via
// the service role rather than trusting client-supplied assignee info, same
// pattern as notify-assignment.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`notify-prayer-edit:${ip}`, 15, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { requestId, changesDescription } = body ?? {};

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: prayerRequest } = await supabase
      .from("prayer_requests")
      .select("assigned_to, name, request_text, category_id, is_anonymous")
      .eq("id", requestId)
      .single();

    // Nothing to do if this request was never assigned to anyone yet — no
    // one is actively following up on it.
    if (!prayerRequest?.assigned_to) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const [{ data: assignee }, { data: category }] = await Promise.all([
      supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", prayerRequest.assigned_to)
        .single(),
      prayerRequest.category_id
        ? supabase
            .from("prayer_categories")
            .select("name")
            .eq("id", prayerRequest.category_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

    const assigneeEmail = assignee?.email ?? undefined;
    const assigneeName = assignee?.full_name ?? null;

    if (!assigneeEmail) {
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
    const submitterLabel = prayerRequest.is_anonymous
      ? "Anonymous (name on file)"
      : prayerRequest.name ?? "A member";

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">A prayer request assigned to you was updated</h2>
        <p style="color: #555; margin-top: 0;">
          Hi ${assigneeName ?? "there"}, ${submitterLabel} just updated a prayer request you're following up on.
          ${category?.name ? `<br/>Category: <strong>${category.name}</strong>` : ""}
        </p>
        ${
          changesDescription
            ? `<p style="margin: 16px 0; color: #4338ca; font-weight: 600;">${changesDescription}</p>`
            : ""
        }
        <p style="color: #555; margin-bottom: 4px;">Current request:</p>
        <blockquote style="border-left: 3px solid #6366f1; margin: 8px 0 16px; padding-left: 12px; color: #222;">
          ${prayerRequest.request_text}
        </blockquote>
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
      subject: "A prayer request assigned to you was updated",
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send prayer-edit notification email" },
        { status: 502 }
      );
    }

    sendPushToUser(prayerRequest.assigned_to, {
      title: "A prayer request you're following up on was updated",
      body: changesDescription || prayerRequest.request_text.slice(0, 120),
      url: "/admin",
    }).catch((err) => {
      console.error("Failed to send prayer-edit push notification:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("notify-prayer-edit error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending prayer-edit notification" },
      { status: 500 }
    );
  }
}
