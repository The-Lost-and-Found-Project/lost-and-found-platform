import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let testimonyId: string | null = null;
  try {
    const body = (await request.json()) as { testimonyId?: unknown };
    testimonyId = typeof body.testimonyId === "string" && UUID_PATTERN.test(body.testimonyId)
      ? body.testimonyId
      : null;
  } catch {
    // Handled by the validation response below.
  }

  if (!testimonyId) {
    return NextResponse.json({ error: "This testimony is not available." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in to encourage a testimony." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.is_active !== true) {
    return NextResponse.json({ error: "This account is not currently able to react." }, { status: 403 });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(`testimony-encouragement:${user.id}`, 30, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reactions. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  const { data: testimony } = await supabase
    .from("testimonies_public")
    .select("id, is_own")
    .eq("id", testimonyId)
    .maybeSingle();
  if (!testimony) {
    return NextResponse.json({ error: "This testimony is not available." }, { status: 404 });
  }
  if (testimony.is_own) {
    return NextResponse.json({ error: "You cannot react to your own testimony." }, { status: 403 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("testimony_encouragements")
    .select("id")
    .eq("testimony_id", testimonyId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingError) {
    console.error("Testimony encouragement lookup failed:", existingError);
    return NextResponse.json({ error: "We could not update your encouragement. Please try again." }, { status: 500 });
  }

  let encouraged = false;
  if (existing) {
    const { error } = await supabase
      .from("testimony_encouragements")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) {
      console.error("Testimony encouragement removal failed:", error);
      return NextResponse.json({ error: "We could not update your encouragement. Please try again." }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("testimony_encouragements").insert({
      testimony_id: testimonyId,
      user_id: user.id,
    });
    if (error && error.code !== "23505") {
      console.error("Testimony encouragement insert failed:", error);
      return NextResponse.json({ error: "We could not update your encouragement. Please try again." }, { status: 500 });
    }
    encouraged = true;
  }

  const { data: updated } = await supabase
    .from("testimonies_public")
    .select("encouragement_count")
    .eq("id", testimonyId)
    .single();

  return NextResponse.json({
    encouraged,
    encouragementCount: updated?.encouragement_count ?? null,
  });
}
