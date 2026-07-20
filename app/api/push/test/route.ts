import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push/send";

// Lets a signed-in user send themselves a test push notification, e.g. from
// a "Send test notification" button in Settings, to confirm their device is
// receiving pushes correctly.
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    await sendPushToUser(user.id, {
      title: "Test notification",
      body: "If you can see this, push notifications are working.",
      url: "/dashboard",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("push/test error:", err);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
