"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

export async function createMinistryContent(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const ministry_slug = String(formData.get("ministry_slug") || "");
  const content_type = String(formData.get("content_type") || "");
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await supabase.from("ministry_content").insert({
    ministry_slug, content_type, title,
    summary: String(formData.get("summary") || "").trim() || null,
    body: String(formData.get("body") || "").trim() || null,
    link_url: String(formData.get("link_url") || "").trim() || null,
    starts_at: String(formData.get("starts_at") || "").trim() || null,
    is_published: formData.get("is_published") === "on",
    is_featured: formData.get("is_featured") === "on",
    created_by: user.id,
  });
  revalidatePath("/admin/ministries"); revalidatePath(`/ministries/${ministry_slug}`); revalidatePath("/events");
}

export async function toggleMinistryContent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id")); const ministry_slug = String(formData.get("ministry_slug"));
  const is_published = formData.get("is_published") === "true";
  await supabase.from("ministry_content").update({ is_published: !is_published, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/ministries"); revalidatePath(`/ministries/${ministry_slug}`); revalidatePath("/events");
}

export async function deleteMinistryContent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id")); const ministry_slug = String(formData.get("ministry_slug"));
  await supabase.from("ministry_content").delete().eq("id", id);
  revalidatePath("/admin/ministries"); revalidatePath(`/ministries/${ministry_slug}`); revalidatePath("/events");
}
