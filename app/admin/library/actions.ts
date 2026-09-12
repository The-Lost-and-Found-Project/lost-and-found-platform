"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function splitCsv(value:FormDataEntryValue|null){return String(value??"").split(",").map(x=>x.trim()).filter(Boolean)}
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}

export async function createCatalogItem(formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single(); if(profile?.role!=="admin")redirect("/dashboard");
 const title=String(formData.get("title")??"").trim(); if(!title)throw new Error("Title is required");
 const content_type=String(formData.get("content_type")??"study"); const provenance=String(formData.get("provenance")??"lfp_original");
 const durationRaw=String(formData.get("duration_minutes")??"").trim();
 const payload={
  slug:slugify(String(formData.get("slug")||title)), title, summary:String(formData.get("summary")??"").trim()||null,
  content_type, provenance, author_name:String(formData.get("author_name")??"").trim()||null, source_name:String(formData.get("source_name")??"").trim()||null,
  scripture_refs:splitCsv(formData.get("scripture_refs")), topics:splitCsv(formData.get("topics")), audience:splitCsv(formData.get("audience")),
  duration_minutes:durationRaw?Number(durationRaw):null, difficulty:String(formData.get("difficulty")??"")||null,
  external_url:String(formData.get("external_url")??"").trim()||null, artwork_url:String(formData.get("artwork_url")??"").trim()||null,
  body:String(formData.get("body")??"").trim()||null, is_featured:formData.get("is_featured")==="on", is_published:formData.get("is_published")==="on",
  published_at:formData.get("is_published")==="on"?new Date().toISOString():null, created_by:user.id
 };
 const {error}=await supabase.from("content_catalog").insert(payload); if(error)throw new Error(error.message);
 revalidatePath("/library"); revalidatePath("/discover"); revalidatePath("/admin/library"); redirect("/admin/library?created=1");
}
