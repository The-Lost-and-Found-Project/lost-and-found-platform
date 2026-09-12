import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function base64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEmmausPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/study";
  return value;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const requestedPath = safeEmmausPath(request.nextUrl.searchParams.get("next"));
  if (!user) {
    const next = `/auth/emmaus?next=${encodeURIComponent(requestedPath)}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url));
  }

  const secret = process.env.EMMAUS_SSO_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Emmaus single sign-on is not configured." }, { status: 503 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "Your L&F account needs a verified email before opening Emmaus." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const now = Math.floor(Date.now() / 1000);
  const payloadObject = {
    iss: "lost-and-found-project",
    aud: "emmaus",
    sub: user.id,
    email: user.email,
    name: profile?.full_name ?? user.user_metadata?.full_name ?? "",
    iat: now,
    exp: now + 120,
    next: requestedPath,
  };
  const payload = base64url(JSON.stringify(payloadObject));
  const signature = sign(payload, secret);

  const emmausOrigin = process.env.EMMAUS_SITE_URL ?? "https://emmaus.lostandfoundproject.org";
  const destination = new URL("/auth/lfp", emmausOrigin);
  destination.searchParams.set("assertion", `${payload}.${signature}`);
  return NextResponse.redirect(destination);
}
