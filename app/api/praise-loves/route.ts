import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let reportId: string | null = null;
  try {
    const body = (await request.json()) as { reportId?: unknown };
    reportId = typeof body.reportId === "string" && UUID_PATTERN.test(body.reportId)
      ? body.reportId
      : null;
  } catch {
    // Handled by the validation response below.
  }

  if (!reportId) {
    return NextResponse.json({ error: "This praise report is not available." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to love a praise report." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active !== true) {
    return NextResponse.json({ error: "This account is not currently able to react." }, { status: 403 });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`praise-love:${user.id}`, 30, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reactions. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  const { data: praiseReport } = await supabase
    .from("praise_wall_public")
    .select("id, is_own")
    .eq("id", reportId)
    .maybeSingle();
  if (!praiseReport) {
    return NextResponse.json({ error: "This praise report is not available." }, { status: 404 });
  }
  if (praiseReport.is_own) {
    return NextResponse.json({ error: "You cannot react to your own praise report." }, { status: 403 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("praise_loves")
    .select("id")
    .eq("praise_report_id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) {
    console.error("Praise Love lookup failed:", existingError);
    return NextResponse.json({ error: "We could not update your Love. Please try again." }, { status: 500 });
  }

  let loved = false;
  if (existing) {
    const { error } = await supabase
      .from("praise_loves")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      console.error("Praise Love removal failed:", error);
      return NextResponse.json({ error: "We could not update your Love. Please try again." }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("praise_loves").insert({
      praise_report_id: reportId,
      user_id: user.id,
    });
    if (error && error.code !== "23505") {
      console.error("Praise Love insert failed:", error);
      return NextResponse.json({ error: "We could not update your Love. Please try again." }, { status: 500 });
    }
    loved = true;
  }

  const { data: updated } = await supabase
    .from("praise_wall_public")
    .select("love_count")
    .eq("id", reportId)
    .single();

  return NextResponse.json({ loved, loveCount: updated?.love_count ?? null });
}
