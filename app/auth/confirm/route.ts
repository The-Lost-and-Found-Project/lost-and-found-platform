import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getConfirmationStatusUrl, getSafeNextPath } from "@/lib/auth/confirmation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || type !== "email") {
    return NextResponse.redirect(
      getConfirmationStatusUrl(requestUrl.origin, "missing")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    console.warn("Email confirmation failed", {
      code: error.code,
      status: error.status,
    });
    return NextResponse.redirect(
      getConfirmationStatusUrl(requestUrl.origin, "invalid")
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
