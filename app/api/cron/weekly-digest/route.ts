import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <noreply@lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.lostandfoundproject.org";

// Guard window: if a digest already went out within this many hours, skip
// sending another one. This is what keeps a manual "Run" click in the Vercel
// dashboard (or a test curl call, or any other accidental re-trigger) from
// firing a second real email to the whole care team a few days after the
// legitimate Monday send.
const MIN_HOURS_BETWEEN_SENDS = 96; // 4 days

// Runs every Monday morning via Vercel Cron (see vercel.json). Sends the
// prayer care team a single weekly summary email instead of one email per
// submission. Protected by CRON_SECRET so it can't be triggered by anyone
// else, and guarded by weekly_digest_log so it can only actually send once
// per week even if triggered more than once.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json(
      { error: "Email notifications are not configured" },
      { status: 500 }
    );
  }

  try {
    const supabase = createAdminClient();

    const { data: lastSend, error: lastSendError } = await supabase
      .from("weekly_digest_log")
      .select("sent_at")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastSendError) throw lastSendError;

    if (lastSend) {
      const hoursSinceLastSend =
        (Date.now() - new Date(lastSend.sent_at).getTime()) / (60 * 60 * 1000);
      if (hoursSinceLastSend < MIN_HOURS_BETWEEN_SENDS) {
        return NextResponse.json({
          success: true,
          skipped: `Digest already sent ${hoursSinceLastSend.toFixed(
            1
          )}h ago — skipping duplicate send`,
        });
      }
    }

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: requests, error: requestsError } = await supabase
      .from("prayer_requests")
      .select(
        "id, created_at, name, is_anonymous, request_text, status, category_id, prayer_categories(name)"
      )
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false });

    if (requestsError) throw requestsError;

    const { data: careTeam, error: careTeamError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("role", ["admin", "prayer_team", "pastor"])
      .not("email", "is", null);

    if (careTeamError) throw careTeamError;

    const recipients = (careTeam ?? [])
      .map((m) => m.email)
      .filter((email): email is string => Boolean(email));

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        skipped: "No care team recipients found",
      });
    }

    const count = requests?.length ?? 0;
    const today = new Date();
    const rangeStart = new Date(sevenDaysAgo);
    const dateFmt = (d: Date) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/New_York",
      });

    const itemsHtml =
      count === 0
        ? `<p style="color:#555;">No new prayer requests came in this week.</p>`
        : (requests ?? [])
            .map((r) => {
              const category = (r as { prayer_categories?: { name?: string } })
                .prayer_categories?.name;
              const submittedBy = r.is_anonymous ? "Anonymous" : r.name;
              return `
                <div style="border-left:3px solid #6366f1;margin:12px 0;padding:8px 14px;background:#f9fafb;border-radius:4px;">
                  <p style="margin:0 0 4px 0;color:#111;">${r.request_text}</p>
                  <p style="margin:0;font-size:13px;color:#666;">
                    ${submittedBy}${category ? ` · ${category}` : ""} · ${r.status}
                  </p>
                </div>
              `;
            })
            .join("");

    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #111;">
        <h2 style="margin-bottom: 4px;">Weekly Prayer Care Digest</h2>
        <p style="color: #555; margin-top: 0;">
          ${dateFmt(rangeStart)} – ${dateFmt(today)} · ${count} new request${
      count === 1 ? "" : "s"
    }
        </p>
        ${itemsHtml}
        <p style="margin-top: 24px;">
          <a href="${SITE_URL}/admin" style="color: #4f46e5;">
            Open the Prayer Care Admin Dashboard
          </a>
        </p>
      </div>
    `;

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: FROM_ADDRESS,
      bcc: recipients,
      subject: `Prayer Care Weekly Digest — ${count} new request${
        count === 1 ? "" : "s"
      }`,
      html,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json(
        { error: "Failed to send weekly digest" },
        { status: 502 }
      );
    }

    const { error: logError } = await supabase
      .from("weekly_digest_log")
      .insert({ sent_at: new Date().toISOString() });

    if (logError) {
      // Don't fail the request over this — the email already went out
      // successfully. Just log it so a stuck guard doesn't go unnoticed.
      console.error("Failed to record weekly_digest_log entry:", logError);
    }

    return NextResponse.json({ success: true, count, recipients: recipients.length });
  } catch (err) {
    console.error("weekly-digest error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending weekly digest" },
      { status: 500 }
    );
  }
}
