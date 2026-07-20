// Server-side verification for Cloudflare Turnstile (our CAPTCHA layer on
// top of the rate limiting in lib/security/rateLimit.ts). The site key is
// public and lives in NEXT_PUBLIC_TURNSTILE_SITE_KEY; the secret key here
// must never be exposed to the browser.
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    // Fail open only if the feature hasn't been configured yet, so a missing
    // env var doesn't accidentally lock out every public form.
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Missing CAPTCHA token" };
  }

  try {
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", token);
    if (remoteIp) body.append("remoteip", remoteIp);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      }
    );

    const data = await res.json();
    if (!data.success) {
      return { success: false, error: "CAPTCHA verification failed" };
    }

    return { success: true };
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return { success: false, error: "CAPTCHA verification error" };
  }
}
