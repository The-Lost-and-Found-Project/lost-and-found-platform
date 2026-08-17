import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PrayerActivityBody = {
  requestId?: unknown;
  clientRequestId?: unknown;
  anonKey?: unknown;
};

export async function POST(request: Request) {
  let body: PrayerActivityBody;

  try {
    body = (await request.json()) as PrayerActivityBody;
  } catch {
    return NextResponse.json(
      { error: "We couldn't record your prayer. Please try again." },
      { status: 400 }
    );
  }

  const requestId =
    typeof body.requestId === "string" && UUID_PATTERN.test(body.requestId)
      ? body.requestId
      : null;
  const clientRequestId =
    typeof body.clientRequestId === "string" &&
    UUID_PATTERN.test(body.clientRequestId)
      ? body.clientRequestId
      : null;

  if (!requestId || !clientRequestId) {
    return NextResponse.json(
      { error: "We couldn't record your prayer. Please try again." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonKey =
    !user && typeof body.anonKey === "string" && UUID_PATTERN.test(body.anonKey)
      ? body.anonKey
      : null;

  if (!user && !anonKey) {
    return NextResponse.json(
      { error: "We couldn't record your prayer. Please try again." },
      { status: 400 }
    );
  }

  const { data: prayerRequest, error: requestError } = await supabase
    .from("prayer_wall_public")
    .select("id, is_own")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    console.error("Failed to validate prayer request:", requestError);
    return NextResponse.json(
      { error: "We couldn't record your prayer. Please try again." },
      { status: 500 }
    );
  }

  if (!prayerRequest) {
    return NextResponse.json(
      { error: "This prayer request is no longer available." },
      { status: 404 }
    );
  }

  if (user && prayerRequest.is_own) {
    return NextResponse.json(
      { error: "You cannot react to your own prayer request." },
      { status: 403 }
    );
  }

  const { error: insertError } = await supabase.from("prayer_reactions").insert({
    prayer_request_id: requestId,
    user_id: user?.id ?? null,
    anon_key: user ? null : anonKey,
    activity_type: "prayed",
    client_request_id: clientRequestId,
    source: "prayer_wall",
  });

  const wasIdempotentRetry = insertError?.code === "23505";
  if (insertError && !wasIdempotentRetry) {
    console.error("Failed to record prayer activity:", insertError);
    return NextResponse.json(
      { error: "We couldn't record your prayer. Please try again." },
      { status: 500 }
    );
  }

  const { data: updatedRequest, error: countError } = await supabase
    .from("prayer_wall_public")
    .select("prayer_count")
    .eq("id", requestId)
    .single();

  if (countError) {
    console.error("Prayer recorded but updated count could not be loaded:", countError);
  }

  return NextResponse.json({
    recorded: true,
    idempotent: wasIdempotentRetry,
    prayerCount: updatedRequest?.prayer_count ?? null,
  });
}
