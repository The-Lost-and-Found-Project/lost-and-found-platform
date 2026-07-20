import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // This route only runs once, right when someone confirms their email
      // for the first time — the perfect (and only) hook point for a
      // one-time welcome email. Awaited (rather than fire-and-forget) because
      // Vercel serverless functions don't guarantee background work continues
      // after the response is sent; errors are swallowed so a failed email
      // never blocks the redirect the user is waiting on.
      const user = data?.user;
      if (user?.email) {
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ?? null;

        try {
          await fetch(`${origin}/api/send-welcome-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({ email: user.email, fullName }),
          });
        } catch (err) {
          console.error("Failed to send welcome email:", err);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
