import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request:NextRequest){
 try{
  const{supervisorUserId,facilitatorUserId,assigned}=await request.json();
  if(typeof supervisorUserId!=="string"||typeof facilitatorUserId!=="string"||typeof assigned!=="boolean")return NextResponse.json({error:"Invalid supervision assignment."},{status:400});
  const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Not authenticated"},{status:401});
  const{data:p}=await s.from("profiles").select("role").eq("id",user.id).single();if(p?.role!=="admin")return NextResponse.json({error:"Admins only"},{status:403});
  const db=createAdminClient();const[{data:supervisor},{data:facilitator}]=await Promise.all([db.from("profiles").select("role").eq("id",supervisorUserId).maybeSingle(),db.from("profiles").select("role").eq("id",facilitatorUserId).maybeSingle()]);
  if(supervisor?.role!=="supervisor")return NextResponse.json({error:"Choose a user with the Supervisor role."},{status:400});
  if(facilitator?.role!=="facilitator")return NextResponse.json({error:"Choose a user with the Facilitator role."},{status:400});
  if(assigned){const{error}=await db.from("facilitator_supervision").upsert({supervisor_user_id:supervisorUserId,facilitator_user_id:facilitatorUserId,assigned_by:user.id});if(error)throw error;}else{const{error}=await db.from("facilitator_supervision").delete().eq("supervisor_user_id",supervisorUserId).eq("facilitator_user_id",facilitatorUserId);if(error)throw error;}
  return NextResponse.json({success:true});
 }catch(error){console.error("set-supervision error",error);return NextResponse.json({error:"Unexpected error updating supervision."},{status:500});}
}
