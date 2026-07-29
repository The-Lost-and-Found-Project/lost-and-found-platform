import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only admins can manage devotion weeks" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function validateDays(days: unknown): string | null {
  if (!Array.isArray(days) || days.length === 0) {
    return "Days must be a non-empty array";
  }
  for (const d of days) {
    if (
      typeof d !== "object" ||
      d === null ||
      typeof (d as any).title !== "string" ||
      !(d as any).title.trim() ||
      typeof (d as any).scripture !== "string" ||
      !(d as any).scripture.trim() ||
      !Array.isArray((d as any).reflectionQuestions)
    ) {
      return "Each day needs at least a title, scripture, and reflection questions";
    }
  }
  return null;
}

// Admin manually adding a brand-new week to the queue. Goes in as a draft --
// still needs Chad's own review pass before it can be approved to publish,
// same as an AI-authored week would.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { weekNumber, title, days } = body ?? {};

    if (typeof weekNumber !== "number" || !Number.isInteger(weekNumber)) {
      return NextResponse.json({ error: "A whole-number week number is required" }, { status: 400 });
    }
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "A title is required" }, { status: 400 });
    }
    const daysError = validateDays(days);
    if (daysError) {
      return NextResponse.json({ error: daysError }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("devotion_weeks")
      .insert({
        week_number: weekNumber,
        title: title.trim(),
        days,
        status: "draft",
        source: "manual",
        created_by: auth.user!.id,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ week: data });
  } catch (err) {
    console.error("admin devotion weeks POST error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating devotion week" },
      { status: 500 }
    );
  }
}

// Edits any field on a devotion week, including status -- this is how Chad
// approves/rejects a pending AI-authored week, and how he edits the content
// of a day before approving it.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, title, days, status } = body ?? {};

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Missing week id" }, { status: 400 });
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    }
    if (days !== undefined) {
      const daysError = validateDays(days);
      if (daysError) {
        return NextResponse.json({ error: daysError }, { status: 400 });
      }
    }
    if (
      status !== undefined &&
      !["draft", "pending", "approved", "rejected", "published"].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (title !== undefined) updates.title = title.trim();
    if (days !== undefined) updates.days = days;
    if (status !== undefined) {
      updates.status = status;
      updates.reviewed_by = auth.user!.id;
      updates.reviewed_at = new Date().toISOString();
      // Manually approving/rejecting counts as Chad having seen it --
      // clear the notified flag so a future reminder cron doesn't nag him
      // about a week he's already acted on.
      if (status === "approved" || status === "rejected") {
        updates.review_notified_at = null;
      }
      if (status === "published") {
        updates.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("devotion_weeks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ week: data });
  } catch (err) {
    console.error("admin devotion weeks PATCH error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating devotion week" },
      { status: 500 }
    );
  }
}

// Deleting a published week would break the public archive for anyone who's
// already read it, so that's blocked here -- draft/pending/rejected/approved
// (not-yet-live) weeks can be removed freely.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id } = body ?? {};

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Missing week id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("devotion_weeks")
      .select("status")
      .eq("id", id)
      .single();

    if (existing?.status === "published") {
      return NextResponse.json(
        { error: "Published weeks can't be deleted -- members may have already read this one" },
        { status: 400 }
      );
    }

    const { error } = await admin.from("devotion_weeks").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin devotion weeks DELETE error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting devotion week" },
      { status: 500 }
    );
  }
}
