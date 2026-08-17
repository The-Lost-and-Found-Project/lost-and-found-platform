import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["edit", "resolve", "withdraw"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please review that change and try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const requestId = typeof body.requestId === "string" ? body.requestId : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!UUID_PATTERN.test(requestId) || !ACTIONS.has(action)) {
    return NextResponse.json({ error: "Please review that change and try again." }, { status: 400 });
  }

  const rateLimit = checkRateLimit(`my-prayer-update:${user.id}`, 15, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "You are making changes too quickly. Please wait a moment." }, { status: 429 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("prayer_requests")
    .select("id, answered, archived")
    .eq("id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Prayer request not found." }, { status: 404 });
  }

  let changes: Record<string, unknown>;
  if (action === "edit") {
    const requestText = typeof body.requestText === "string" ? body.requestText.trim().slice(0, 5000) : "";
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    if (existing.answered || existing.archived || requestText.length < 10 || !UUID_PATTERN.test(categoryId)) {
      return NextResponse.json({ error: "Please provide a complete prayer request and category." }, { status: 400 });
    }
    changes = {
      request_text: requestText,
      category_id: categoryId,
      is_public: body.isPublic === true,
      is_anonymous: body.isAnonymous === true,
    };
  } else if (action === "resolve") {
    changes = {
      answered: true,
      status: "Resolved",
      answered_update: typeof body.answeredUpdate === "string" ? body.answeredUpdate.trim().slice(0, 2000) || null : null,
    };
  } else {
    changes = { status: "Withdrawn", archived: true, is_public: false };
  }

  const { data: updated, error: updateError } = await supabase
    .from("prayer_requests")
    .update(changes)
    .eq("id", requestId)
    .eq("user_id", user.id)
    .select("id, request_text, status, category_id, is_public, is_anonymous, moderation_status, answered, answered_update, archived, prayer_count")
    .single();

  if (updateError || !updated) {
    console.error("Member prayer request update failed:", updateError);
    return NextResponse.json({ error: "We could not save that change. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ request: updated });
}
