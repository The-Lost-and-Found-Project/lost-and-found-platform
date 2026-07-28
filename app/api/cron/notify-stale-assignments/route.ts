import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Runs daily via Vercel Cron (see vercel.json). Single route covering both
// 7-day nudges built on the same signal (last_action_at, bumped whenever a
// prayer partner checks off an action item on /prayer-assignments):
//
//   1. Admins/pastors get a bundled alert about requests that have gone
//      7+ days without an action being taken, so oversight doesn't depend on
//      someone happening to notice a stale card in the queue.
//   2. The submitting member gets asked to check in on their own request —
//      still need prayer, it's been answered, they want to update it, or
//      they want to remove it — via the four options at
//      /my-journey?checkin=<id>.
//
// Combined into one cron job (rather than two) to stay within Vercel's
// per-project cron job limit alongside the existing weekly-digest and
// archive-stale-requests jobs. We don't send email for either — inserting
// into `notifications` is enough, since the notification-created webhook
// automatically turns every insert into a push notification too.
//
// Dedup: admin_idle_notified_at / checkin_notified_at each track the last
// time we nudged for a given request+audience. We only re-nudge once
// another 7 days have passed since that nudge, so a request stuck idle for
// weeks doesn't spam anyone daily — each nudge repeats roughly weekly until
// the assignee acts or the member responds, bounded by the existing 30-day
// auto-archive as a backstop.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

    const { data: staleRequests, error: staleError } = await supabase
      .from("prayer_requests")
      .select(
        "id, request_text, name, is_anonymous, user_id, assigned_to, last_action_at, admin_idle_notified_at, checkin_notified_at"
      )
      .eq("answered", false)
      .eq("archived", false)
      .lte("last_action_at", cutoff);

    if (staleError) throw staleError;

    const result = {
      adminsNotified: 0,
      staleAssignmentCount: 0,
      membersNotified: 0,
    };

    if (!staleRequests || staleRequests.length === 0) {
      return NextResponse.json({ success: true, ...result });
    }

    // --- Admin/pastor bundle: assigned + due for a (re-)nudge ---
    const dueForAdminNudge = staleRequests.filter(
      (r) =>
        r.assigned_to &&
        (!r.admin_idle_notified_at || r.admin_idle_notified_at <= cutoff)
    );

    if (dueForAdminNudge.length > 0) {
      const assigneeIds = Array.from(
        new Set(dueForAdminNudge.map((r) => r.assigned_to as string))
      );

      const { data: assignees, error: assigneesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", assigneeIds);

      if (assigneesError) throw assigneesError;

      const assigneeNameById: Record<string, string> = {};
      (assignees ?? []).forEach((a) => {
        assigneeNameById[a.id] = a.full_name ?? "their prayer partner";
      });

      const { data: admins, error: adminsError } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "pastor"]);

      if (adminsError) throw adminsError;

      if (admins && admins.length > 0) {
        const lines = dueForAdminNudge.map((r) => {
          const days = Math.floor(
            (Date.now() - new Date(r.last_action_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const label = r.is_anonymous ? "An anonymous request" : r.name ?? "A request";
          const assigneeName = assigneeNameById[r.assigned_to as string] ?? "their prayer partner";
          return `${label} (assigned to ${assigneeName}) — ${days} days since last action`;
        });

        const title =
          dueForAdminNudge.length === 1
            ? "A prayer request needs attention"
            : `${dueForAdminNudge.length} prayer requests need attention`;
        const body = `${lines.slice(0, 5).join("; ")}${
          lines.length > 5 ? `; and ${lines.length - 5} more` : ""
        }.`;

        const { error: insertError } = await supabase.from("notifications").insert(
          admins.map((admin) => ({
            user_id: admin.id,
            type: "idle_assignment",
            title,
            body,
            link: "/admin",
          }))
        );

        if (insertError) throw insertError;

        const { error: updateError } = await supabase
          .from("prayer_requests")
          .update({ admin_idle_notified_at: new Date().toISOString() })
          .in(
            "id",
            dueForAdminNudge.map((r) => r.id)
          );

        if (updateError) throw updateError;

        result.adminsNotified = admins.length;
        result.staleAssignmentCount = dueForAdminNudge.length;
      }
    }

    // --- Member check-in: owner + due for a (re-)nudge ---
    const dueForMemberNudge = staleRequests.filter(
      (r) =>
        r.user_id &&
        (!r.checkin_notified_at || r.checkin_notified_at <= cutoff)
    );

    if (dueForMemberNudge.length > 0) {
      const { error: insertError } = await supabase.from("notifications").insert(
        dueForMemberNudge.map((r) => ({
          user_id: r.user_id,
          type: "check_in_needed",
          title: "How's this prayer request going?",
          body: `It's been about a week since there was an update on: "${r.request_text.slice(
            0,
            120
          )}". Let us know if you still need prayer, it's been answered, or you'd like to update or remove it.`,
          link: `/my-journey?checkin=${r.id}`,
        }))
      );

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("prayer_requests")
        .update({ checkin_notified_at: new Date().toISOString() })
        .in(
          "id",
          dueForMemberNudge.map((r) => r.id)
        );

      if (updateError) throw updateError;

      result.membersNotified = dueForMemberNudge.length;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("notify-stale-assignments error:", err);
    return NextResponse.json(
      { error: "Unexpected error running stale-assignment nudges" },
      { status: 500 }
    );
  }
}
