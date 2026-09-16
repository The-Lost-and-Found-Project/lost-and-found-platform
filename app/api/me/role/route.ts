import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";

export async function GET(){
 const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({role:"member"},{status:401});
 const{data:p}=await s.from("profiles").select("role,preview_role").eq("id",user.id).single();
 return NextResponse.json({role:getEffectiveRole(p?.role,p?.preview_role)});
}
