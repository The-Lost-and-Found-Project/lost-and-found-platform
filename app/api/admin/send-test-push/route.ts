import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

// Lets an admin send a one-off test push notification to a specific other
// user (e.g. to confirm a particular person's device is receiving pushes),
// as opposed to /api/push/test which only ever lets someone test themselves.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body ?? {};

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Admins only" }, { status: 403 });
    }

    await sendPushToUser(userId, {
      title: "Test notification from Chad",
      body: "If you can see this, push notifications are working on your device.",
      url: "/dashboard",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/send-test-push error:", err);
    return NextResponse.json(
      { error: "Unexpected error sending test push" },
      { status: 500 }
    );
  }
}
