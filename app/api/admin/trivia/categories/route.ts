import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only admins can manage trivia categories" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

// Creates a new category (when no id is supplied) or updates an existing
// one in place (when id is supplied). Category ids are stable slugs used as
// the foreign key on every question, so an edit never touches the id --
// only name/description/sort_order/is_active change.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, name, description, sortOrder, isActive } = body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    if (typeof id === "string" && id) {
      // Editing an existing category -- id (and therefore every question's
      // category_id foreign key) stays untouched.
      const { data, error } = await admin
        .from("trivia_categories")
        .update({
          name: name.trim(),
          description: description.trim(),
          sort_order: typeof sortOrder === "number" ? sortOrder : 0,
          is_active: isActive !== false,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ category: data });
    }

    // New category -- derive a slug id from the name, falling back to a
    // random suffix if it happens to collide with an existing one.
    let newId = slugify(name) || `category-${Date.now()}`;
    const { data: existing } = await admin
      .from("trivia_categories")
      .select("id")
      .eq("id", newId)
      .maybeSingle();

    if (existing) {
      newId = `${newId}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { data, error } = await admin
      .from("trivia_categories")
      .insert({
        id: newId,
        name: name.trim(),
        description: description.trim(),
        sort_order: typeof sortOrder === "number" ? sortOrder : 0,
        is_active: isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (err) {
    console.error("admin trivia categories error:", err);
    return NextResponse.json(
      { error: "Unexpected error saving category" },
      { status: 500 }
    );
  }
}
