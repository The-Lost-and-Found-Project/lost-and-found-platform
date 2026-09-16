import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageStudies, getEffectiveRole } from "@/lib/effective-role";
import StudyPresentation from "@/components/StudyPresentation";

export const dynamic="force-dynamic";
export default async function PresentStudyPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect(`/login?next=/studies/${id}/present`);const{data:profile}=await s.from("profiles").select("role,preview_role").eq("id",user.id).single();const role=getEffectiveRole(profile?.role,profile?.preview_role);if(!canManageStudies(role))redirect(`/studies/${id}`);const db=createAdminClient();const{data:study}=await db.from("bible_studies").select("id,title,subtitle,slides,is_published").eq("id",id).maybeSingle();if(!study||!study.is_published)notFound();const slides=Array.isArray(study.slides)?study.slides:[];return <StudyPresentation title={study.title} subtitle={study.subtitle} slides={slides}/>}
