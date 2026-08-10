import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Runs daily via Vercel Cron (see vercel.json). Covers four things built on
// the same 7-day-idle signal (last_action_at, bumped whenever a prayer
// partner checks off an action item on /prayer-assignments):
//
//   1. Admins/pastors get a bundled alert about requests that have gone
//      7+ days without an action being taken.
//   2. The submitting member gets asked to check in on their own request
//      via the four options at /my-journey?checkin=<id>.
//   3. An unattended assignment limits new ministry assignments, flags the
//      volunteer for human review, and reassigns the request. It never
//      disables login or automatically deactivates an account.
//
// Combined into one cron job (rather than several) to stay within Vercel's
// per-project cron job limit alongside the existing weekly-digest and
// archive-stale-requests jobs. We don't send email for any of this —
// inserting into `notifications` is enough, since the notification-created
// webhook automatically turns every insert into a push notification too.
//
// Dedup: admin_idle_notified_at / checkin_notified_at each track the last
// time we nudged for a given request+audience, same as before. The neglect
// pause itself is naturally self-limiting — once someone is paused, the
// rotation trigger stops assigning to them and their existing assignments
// get reassigned away, so there's nothing left to re-trigger a pause the
// next time this cron runs.
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
        "id, user_id, assigned_to, last_action_at, admin_idle_notified_at, checkin_notified_at"
      )
      .eq("answered", false)
      .eq("archived", false)
      .lte("last_action_at", cutoff);

    if (staleError) throw staleError;

    const result = {
      adminsNotified: 0,
      staleAssignmentCount: 0,
      membersNotified: 0,
      pausedForNeglect: 0,
      followUpsNotified: 0,
    };

    if (staleRequests && staleRequests.length > 0) {
      // --- Admin/pastor bundle: assigned + due for a (re-)nudge ---
      const dueForAdminNudge = staleRequests.filter(
        (r) =>
          r.assigned_to &&
          (!r.admin_idle_notified_at || r.admin_idle_notified_at <= cutoff)
      );

      if (dueForAdminNudge.length > 0) {
        const { data: admins, error: adminsError } = await supabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "pastor"]);

        if (adminsError) throw adminsError;

        if (admins && admins.length > 0) {
          const title =
            dueForAdminNudge.length === 1
              ? "A prayer request needs attention"
              : `${dueForAdminNudge.length} prayer requests need attention`;
          const body =
            "Open Prayer Operations to review overdue care, current ownership, and reassignment options.";

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
            body: "It's been about a week since there was an update. Let us know if you still need prayer, it has been answered, or you would like to update or remove it.",
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

      // --- Neglect auto-pause: assignee has a stale assignment and is
      // still actively participating in rotation ---
      const staleAssigneeIds = Array.from(
        new Set(
          staleRequests.filter((r) => r.assigned_to).map((r) => r.assigned_to as string)
        )
      );

      if (staleAssigneeIds.length > 0) {
        const { data: rotationProfiles, error: rotationProfilesError } = await supabase
          .from("profiles")
          .select("id, full_name, missed_assignment_count")
          .in("id", staleAssigneeIds)
          .eq("rotation_status", "active");

        if (rotationProfilesError) throw rotationProfilesError;

        for (const rp of rotationProfiles ?? []) {
          const nextMissedAssignmentCount = (rp.missed_assignment_count ?? 0) + 1;
          const requiresHumanReview = nextMissedAssignmentCount >= 2;
          const { error: pauseError } = await supabase
            .from("profiles")
            .update({
              ministry_availability: "limited",
              missed_assignment_count: nextMissedAssignmentCount,
              availability_review_required: requiresHumanReview,
              paused_at: new Date().toISOString(),
            })
            .eq("id", rp.id)
            .eq("rotation_status", "active");

          if (pauseError) throw pauseError;

          const { data: activeAssignments } = await supabase
            .from("prayer_requests")
            .select(
              "id, contact_requested, prayer_count, action_contacted_at, action_prayed_at"
            )
            .eq("assigned_to", rp.id)
            .eq("answered", false)
            .eq("archived", false);

          for (const req of activeAssignments ?? []) {
            const { data: newAssigneeId, error: reassignError } = await supabase.rpc(
              "reassign_prayer_request",
              { request_id: req.id, exclude_user_id: rp.id }
            );

            if (reassignError) {
              console.error("reassign_prayer_request error:", reassignError);
              continue;
            }

            if (!newAssigneeId) continue;

            const prayedText =
              (req.prayer_count ?? 0) > 0 || req.action_prayed_at
                ? `It has already been prayed for${req.prayer_count ? ` (${req.prayer_count} time${req.prayer_count === 1 ? "" : "s"})` : ""}.`
                : "It has not been prayed for yet.";

            const contactText = req.contact_requested
              ? req.action_contacted_at
                ? "The submitter asked to be contacted and has already been reached out to."
                : "The submitter asked to be contacted and has not been reached out to yet."
              : "The submitter did not request direct contact.";

            await supabase.from("notifications").insert({
              user_id: newAssigneeId,
              type: "prayer_reassigned",
              title: "A prayer request has been reassigned to you",
              body: `This request was returned to the team for timely care. ${prayedText} ${contactText}`,
              link: "/prayer-assignments",
            });
          }

          await supabase.from("notifications").insert({
            user_id: rp.id,
            type: "rotation_paused",
            title: "New prayer assignments are temporarily limited",
            body: requiresHumanReview
              ? "An assignment went 7+ days without an update, so it was reassigned for timely care. Your login remains active. Because this has happened more than once, a care leader must review your ministry availability before new assignments resume."
              : "An assignment went 7+ days without an update, so it was reassigned for timely care. Your login remains active. When you are ready, you may return yourself to Available from your Profile.",
            link: "/profile",
          });

          result.pausedForNeglect += 1;
        }
      }
    }

    // --- Due follow-ups: remind the current care owner, or the care leaders
    // when a request is unassigned. A recent notification suppresses repeat
    // alerts for seven days while still allowing a newly assigned owner to
    // receive the reminder immediately.
    const today = new Date().toISOString().slice(0, 10);
    const { data: dueFollowUps, error: dueFollowUpsError } = await supabase
      .from("prayer_requests")
      .select("id, assigned_to")
      .eq("follow_up_needed", true)
      .eq("answered", false)
      .eq("archived", false)
      .not("follow_up_date", "is", null)
      .lte("follow_up_date", today);

    if (dueFollowUpsError) throw dueFollowUpsError;

    if (dueFollowUps && dueFollowUps.length > 0) {
      const dueIds = dueFollowUps.map((item) => item.id);
      const { data: recentReminders, error: reminderError } = await supabase
        .from("notifications")
        .select("prayer_request_id, user_id")
        .eq("type", "follow_up_due")
        .in("prayer_request_id", dueIds)
        .gte("created_at", cutoff);

      if (reminderError) throw reminderError;

      const recentReminderKeys = new Set(
        (recentReminders ?? []).map(
          (notification) => `${notification.prayer_request_id}:${notification.user_id}`
        )
      );
      const unassignedFollowUps = dueFollowUps.filter((item) => !item.assigned_to);
      const { data: careLeaders, error: careLeadersError } = unassignedFollowUps.length > 0
        ? await supabase.from("profiles").select("id").in("role", ["admin", "pastor"])
        : { data: [], error: null };

      if (careLeadersError) throw careLeadersError;

      const reminders: Array<Record<string, string>> = [];
      for (const followUp of dueFollowUps) {
        const recipients = followUp.assigned_to
          ? [{ id: followUp.assigned_to, link: "/prayer-assignments" }]
          : (careLeaders ?? []).map((leader) => ({ id: leader.id, link: "/admin" }));

        for (const recipient of recipients) {
          if (recentReminderKeys.has(`${followUp.id}:${recipient.id}`)) continue;
          reminders.push({
            user_id: recipient.id,
            type: "follow_up_due",
            title: "Prayer follow-up is due",
            body: "Open the care workspace to review the request and record the next step.",
            link: recipient.link,
            prayer_request_id: followUp.id,
          });
        }
      }

      if (reminders.length > 0) {
        const { error: insertReminderError } = await supabase
          .from("notifications")
          .insert(reminders);
        if (insertReminderError) throw insertReminderError;
        result.followUpsNotified = reminders.length;
      }
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
