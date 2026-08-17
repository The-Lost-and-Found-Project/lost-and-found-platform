import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PERMANENT_BAN = "876000h";

export async function POST(request: NextRequest) {
  try {
    const { userId, isActive } = await request.json();
    if (typeof userId !== "string" || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing or invalid account status." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
    if (userId === user.id) return NextResponse.json({ error: "You can't change your own account status here." }, { status: 400 });

    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").update({ is_active: isActive }).eq("id", userId);
    if (profileError) throw profileError;
    const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: isActive ? "none" : PERMANENT_BAN });
    if (authError) throw authError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("set-active error:", error);
    return NextResponse.json({ error: "Unexpected error updating account status" }, { status: 500 });
  }
}
