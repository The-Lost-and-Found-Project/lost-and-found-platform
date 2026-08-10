import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

// Sent whenever someone creates a new account (calls supabase.auth.signUp()
// on the signup page). The profile database trigger now creates the single,
// admin-only in-app notification, and the notification webhook owns push
// delivery. This compatibility route intentionally sends nothing itself so
// a signup cannot produce a second push outside the tracked pipeline.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(
    `notify-new-signup:${ip}`,
    10,
    10 * 60 * 1000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true, delivery: "handled_by_database" });
}
