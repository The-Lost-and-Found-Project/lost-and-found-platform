import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {fetchZeffyPayments,upsertVerifiedZeffyPayment} from "@/lib/zeffy";

export async function POST(){
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const{data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const admin=createAdminClient();const{data:run}=await admin.from("giving_sync_runs").insert({provider:"zeffy"}).select("id").single();
 let seen=0,upserted=0,cursor:string|undefined;
 try{
  do{
   const page=await fetchZeffyPayments(cursor);
   const items=page?.data??page?.payments??page?.results??[];
   for(const payment of items){seen++;await upsertVerifiedZeffyPayment(payment);upserted++}
   cursor=page?.has_more?String(page?.next_cursor??""):undefined;
  }while(cursor);
  if(run?.id)await admin.from("giving_sync_runs").update({status:"completed",completed_at:new Date().toISOString(),records_seen:seen,records_upserted:upserted}).eq("id",run.id);
  return NextResponse.json({ok:true,seen,upserted});
 }catch(error:any){
  if(run?.id)await admin.from("giving_sync_runs").update({status:"failed",completed_at:new Date().toISOString(),records_seen:seen,records_upserted:upserted,error_message:error?.message??"Unknown error"}).eq("id",run.id);
  return NextResponse.json({error:error?.message??"Zeffy sync failed"},{status:500});
 }
}
