import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM_ADDRESS =
  "Lost and Found Prayer Care <prayer@updates.lostandfoundproject.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.lostandfoundproject.org";
const ADMIN_EMAIL = "chad@lostandfoundproject.org";

const DAYS_PER_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
// Cron runs once a day -- this keeps an "it's overdue" nag from firing more
// than once per day even if the run gets triggered twice.
const MIN_HOURS_BETWEEN_REMINDERS = 20;

// Runs daily via Vercel Cron (see vercel.json). Drives the weekly devotion
// rotation Chad asked for: "the previous one stays but collapsed... each
// week when the new one is published I should receive the next one for
// approval so I have time to go through it and make changes if needed."
//
// The whole system only ever cares about one thing: whichever week comes
// right after the currently-published one ("target"). That single week is
// simultaneously (a) what will go live next once its turn comes, and (b)
// exactly what Chad needs to have reviewed by then. So there's one code
// path, branching only on whether 7 days have passed since the last publish:
//
//   - If it HAS been 7+ days and target is approved: publish target now,
//     then notify Chad about the week after *that* (the new target) --
//     this is the "when the new one is published, send me the next one"
//     moment from the spec.
//   - If it HAS been 7+ days and target is NOT approved: can't publish on
//     time. Send Chad an overdue reminder (deduped to once/day via
//     review_notified_at) instead of advancing, so the current week just
//     keeps running until he acts.
//   - If it has NOT been 7 days yet: nothing to publish, but if target has
//     never been notified (review_notified_at is null) send the normal
//     "up next for your review" notice now, so he gets it as early as
//     possible rather than waiting for the overdue path.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: currentWeek, error: currentError } = await supabase
      .from("devotion_weeks")
      .select("id, week_number, title, published_at")
      .eq("status", "published")
      .order("week_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentError) throw currentError;

    if (!currentWeek) {
      return NextResponse.json({
        success: true,
        skipped: "No published devotion week found -- nothing to advance",
      });
    }

    const { data: target, error: targetError } = await supabase
      .from("devotion_weeks")
      .select("id, week_number, title, status, review_notified_at")
      .eq("week_number", currentWeek.week_number + 1)
      .maybeSingle();

    if (targetError) throw targetError;

    if (!target) {
      return NextResponse.json({
        success: true,
        skipped: `No week ${currentWeek.week_number + 1} queued yet -- nothing to notify about`,
      });
    }

    const hoursSincePublish =
      (Date.now() - new Date(currentWeek.published_at).getTime()) / (60 * 60 * 1000);
    const dueToAdvance = hoursSincePublish >= DAYS_PER_WEEK_MS / (60 * 60 * 1000);

    const apiKey = process.env.RESEND_API_KEY;
    const resend = apiKey ? new Resend(apiKey) : null;

    async function notifyAdmins(title: string, body: string, subject: string, html: string) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "pastor"]);

      if (admins && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            type: "devotion_week_review",
            title,
            body,
            link: "/admin/devotions",
          }))
        );
      }

      if (resend) {
        const { error: sendError } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: ADMIN_EMAIL,
          subject,
          html,
        });
        if (sendError) {
          console.error("Resend error (devotion week notify):", sendError);
        }
      }
    }

    // --- Case 1: due to advance, and the next week is ready ---
    if (dueToAdvance && target.status === "approved") {
      const { error: publishError } = await supabase
        .from("devotion_weeks")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", target.id);

      if (publishError) throw publishError;

      const { data: nextTarget } = await supabase
        .from("devotion_weeks")
        .select("id, week_number, title, review_notified_at")
        .eq("week_number", target.week_number + 1)
        .maybeSingle();

      let notified = false;
      if (nextTarget && !nextTarget.review_notified_at) {
        await notifyAdmins(
          `Week ${nextTarget.week_number} devotion is up for your review`,
          `"${nextTarget.title}" is next in the queue after this week's publish. Review and approve it at your convenience before its turn comes up.`,
          `Devotions: Week ${nextTarget.week_number} ready for your review`,
          `
            <div style="font-family: sans-serif; font-size: 15px; color: #111;">
              <h2 style="margin-bottom: 4px;">Week ${target.week_number} just went live</h2>
              <p style="color: #555; margin-top: 0;">"${target.title}" is now the current devotion week.</p>
              <p style="margin-top: 16px;">
                Up next: <strong>Week ${nextTarget.week_number} — "${nextTarget.title}"</strong> is ready for your review.
                You have a week to go through it and make any changes before it's its turn to publish.
              </p>
              <p style="margin-top: 24px;">
                <a href="${SITE_URL}/admin/devotions" style="color: #4f46e5;">Review it now</a>
              </p>
            </div>
          `
        );
        await supabase
          .from("devotion_weeks")
          .update({ review_notified_at: new Date().toISOString() })
          .eq("id", nextTarget.id);
        notified = true;
      }

      return NextResponse.json({
        success: true,
        published: `Week ${target.week_number}: ${target.title}`,
        notifiedAboutNextWeek: notified,
      });
    }

    // --- Case 2: due to advance, but the next week isn't approved yet ---
    if (dueToAdvance && target.status !== "approved") {
      const hoursSinceNotified = target.review_notified_at
        ? (Date.now() - new Date(target.review_notified_at).getTime()) / (60 * 60 * 1000)
        : Infinity;

      if (hoursSinceNotified < MIN_HOURS_BETWEEN_REMINDERS) {
        return NextResponse.json({
          success: true,
          skipped: `Week ${target.week_number} is overdue for review but was already reminded recently`,
        });
      }

      await notifyAdmins(
        `Week ${target.week_number} devotion needs review -- it's overdue`,
        `"${target.title}" was due to go live but hasn't been approved yet. The current week will keep running until it's reviewed.`,
        `Devotions: Week ${target.week_number} is overdue for review`,
        `
          <div style="font-family: sans-serif; font-size: 15px; color: #111;">
            <h2 style="margin-bottom: 4px;">Week ${target.week_number} needs your review</h2>
            <p style="color: #555; margin-top: 0;">
              "${target.title}" was scheduled to go live, but it's still marked "${target.status}" and
              hasn't been approved. The current week (Week ${currentWeek.week_number}) will keep
              running until you review it.
            </p>
            <p style="margin-top: 24px;">
              <a href="${SITE_URL}/admin/devotions" style="color: #4f46e5;">Review it now</a>
            </p>
          </div>
        `
      );

      await supabase
        .from("devotion_weeks")
        .update({ review_notified_at: new Date().toISOString() })
        .eq("id", target.id);

      return NextResponse.json({
        success: true,
        skipped: `Week ${target.week_number} not yet approved -- sent overdue reminder`,
      });
    }

    // --- Case 3: not due yet, but make sure the target has had its initial notice ---
    if (!target.review_notified_at) {
      await notifyAdmins(
        `Week ${target.week_number} devotion is up for your review`,
        `"${target.title}" is next in the queue. Review and approve it before its turn comes up.`,
        `Devotions: Week ${target.week_number} ready for your review`,
        `
          <div style="font-family: sans-serif; font-size: 15px; color: #111;">
            <h2 style="margin-bottom: 4px;">A devotion week is ready for your review</h2>
            <p style="color: #555; margin-top: 0;">
              <strong>Week ${target.week_number} — "${target.title}"</strong> is next in the queue after
              the current week (Week ${currentWeek.week_number}). You have time to go through it and
              make any changes before it's its turn to publish.
            </p>
            <p style="margin-top: 24px;">
              <a href="${SITE_URL}/admin/devotions" style="color: #4f46e5;">Review it now</a>
            </p>
          </div>
        `
      );

      await supabase
        .from("devotion_weeks")
        .update({ review_notified_at: new Date().toISOString() })
        .eq("id", target.id);

      return NextResponse.json({
        success: true,
        skipped: "Not yet time to advance -- sent initial review notice for the upcoming week",
      });
    }

    return NextResponse.json({
      success: true,
      skipped: "Not yet time to advance, and upcoming week already notified",
    });
  } catch (err) {
    console.error("publish-devotion-week error:", err);
    return NextResponse.json(
      { error: "Unexpected error running the devotion week publish check" },
      { status: 500 }
    );
  }
}
