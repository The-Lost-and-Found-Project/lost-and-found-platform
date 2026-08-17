import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = new Set(["member", "admin"]);

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();
    if (typeof userId !== "string" || typeof role !== "string" || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: "Missing or invalid user role." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: callerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (callerProfile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
    if (userId === user.id && role !== "admin") {
      return NextResponse.json({ error: "You can't change your own admin role here." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: target } = await admin.from("profiles").select("role").eq("id", userId).single();
    if (target?.role === "admin" && role !== "admin") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) return NextResponse.json({ error: "You can't remove the only remaining admin." }, { status: 400 });
    }

    const { error } = await admin.from("profiles").update({ role, preview_role: null }).eq("id", userId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("set-role error:", error);
    return NextResponse.json({ error: "Unexpected error updating role" }, { status: 500 });
  }
}
