import { createClient } from "@/lib/supabase/server";
export async function getMarriageCouple(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const {data:couples,error}=await supabase.from("marriage_couples").select("id,spouse_one,spouse_two")
    .is("revoked_at",null).or(`spouse_one.eq.${userId},spouse_two.eq.${userId}`).limit(1);
  if(error) return null;
  return couples?.[0]??null;
}
