import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES=new Set(["testimony","praise"]);
const STATUSES=new Set(["approved","denied"]);

export async function POST(request:NextRequest){
 try{
  const body=await request.json().catch(()=>null);
  const contentType=typeof body?.contentType==="string"?body.contentType:"";
  const contentId=typeof body?.contentId==="string"?body.contentId:"";
  const moderationStatus=typeof body?.moderationStatus==="string"?body.moderationStatus:"";
  if(!TYPES.has(contentType)||!UUID_PATTERN.test(contentId)||!STATUSES.has(moderationStatus)){
   return NextResponse.json({error:"Invalid moderation request"},{status:400});
  }

  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Not authenticated"},{status:401});
  const{data:callerProfile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(callerProfile?.role !== "admin")return NextResponse.json({error:"Admins only"},{status:403});

  const admin=createAdminClient();
  const table=contentType==="testimony"?"testimonies":"praise_reports";
  const{data:item,error}=await admin.from(table).update({moderation_status:moderationStatus}).eq("id",contentId).select("id,user_id").maybeSingle();
  if(error)throw error;
  if(!item)return NextResponse.json({error:"Content not found"},{status:404});

  const approved=moderationStatus==="approved";
  const link=contentType==="testimony"?"/testimonies":"/praise";
  const title=approved
   ? contentType==="testimony"?"Your testimony was approved":"Your praise report was approved"
   : contentType==="testimony"?"Your testimony needs revision":"Your praise report was not published";
  const notification={user_id:item.user_id,type:approved?"content_approved":"content_denied",title,body:approved?"Your submission is now visible in Community.":"Your submission was reviewed and is not currently public.",link,push_status:"pending"};
  const{error:notificationError}=await admin.from("notifications").insert(notification);
  if(notificationError)console.error("Community moderation notification failed",{contentType,contentId,message:notificationError.message});

  return NextResponse.json({success:true,moderationStatus});
 }catch(error){
  console.error("Community content moderation failed",error);
  return NextResponse.json({error:"Unable to update moderation status"},{status:500});
 }
}
