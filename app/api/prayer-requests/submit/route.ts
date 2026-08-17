import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubmissionBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  categoryId?: unknown;
  requestText?: unknown;
  isPublic?: unknown;
  isAnonymous?: unknown;
};

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  let body: SubmissionBody;
  try {
    body = (await request.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ error: "Please review your information and try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in before sharing a prayer request." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Prayer submission profile check failed:", profileError);
    return NextResponse.json({ error: "We could not verify your membership. Please try again." }, { status: 500 });
  }
  if (!profile || profile.is_active !== true) {
    return NextResponse.json({ error: "This account is not currently able to submit prayer requests." }, { status: 403 });
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(
    `prayer-submission:${user.id}`,
    5,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "You are submitting too quickly. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 60) } }
    );
  }

  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 254).toLowerCase();
  const phone = cleanString(body.phone, 40);
  const requestText = cleanString(body.requestText, 5000);
  const categoryId = typeof body.categoryId === "string" && UUID_PATTERN.test(body.categoryId)
    ? body.categoryId
    : null;
  const isPublic = body.isPublic === true;
  const isAnonymous = body.isAnonymous === true;

  if (
    name.length < 2 ||
    !EMAIL_PATTERN.test(email) ||
    requestText.length < 10 ||
    !categoryId
  ) {
    return NextResponse.json({ error: "Please review the required information and try again." }, { status: 400 });
  }

  const requestId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("prayer_requests").insert({
    id: requestId,
    user_id: user.id,
    name,
    email,
    phone: phone || null,
    preferred_contact: null,
    preferred_care_gender: null,
    category_id: categoryId,
    request_text: requestText,
    status: "Submitted",
    is_public: isPublic,
    is_anonymous: isAnonymous,
    contact_requested: false,
  });

  if (insertError) {
    console.error("Prayer submission insert failed:", insertError);
    if (insertError.message.includes("submitting too quickly")) {
      return NextResponse.json(
        { error: "You are submitting too quickly. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "We could not share your prayer request. Please review your information and try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ submitted: true, requestId }, { status: 201 });
}
