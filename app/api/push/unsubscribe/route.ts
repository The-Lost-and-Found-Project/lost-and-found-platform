import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Removes a browser's push subscription — called when a user turns push
// notifications off from Settings, or when the browser tells us its
// subscription expired.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body ?? {};

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    // RLS already restricts deletes to the caller's own subscriptions, but
    // scoping by user_id here too keeps the intent explicit.
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("push/unsubscribe error:", err);
    return NextResponse.json(
      { error: "Failed to remove push subscription" },
      { status: 500 }
    );
  }
}
