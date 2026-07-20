import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

// Called client-side right before a public form (prayer request submission,
// sign up) performs its actual write. Keeping the CAPTCHA secret key
// server-side means this can never be bypassed by a bot calling Supabase
// directly with the anon key.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed } = checkRateLimit(`verify-turnstile:${ip}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { token } = body ?? {};

    const result = await verifyTurnstileToken(token, ip);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "CAPTCHA verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-turnstile error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected verification error" },
      { status: 500 }
    );
  }
}
