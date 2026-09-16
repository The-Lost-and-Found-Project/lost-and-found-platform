import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  if (!publicKey) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_runtime_secrets")
      .select("value")
      .eq("key", "vapid_public_key")
      .maybeSingle();
    if (error) {
      console.error("push config lookup failed", error);
      return NextResponse.json({ error: "Push configuration unavailable" }, { status: 503 });
    }
    publicKey = data?.value || "";
  }

  if (!publicKey) {
    return NextResponse.json({ error: "Push configuration unavailable" }, { status: 503 });
  }

  return NextResponse.json(
    { publicKey },
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
}
