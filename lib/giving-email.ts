import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
type Kind="thank_you"|"impact_update"|"annual_report"|"campaign";
const appUrl=process.env.NEXT_PUBLIC_APP_URL||"https://app.lostandfoundproject.org";
export async function sendGivingEmail(a:{to:string;userId?:string|null;kind:Kind;subject:string;heading:string;body:string;ctaLabel?:string;ctaUrl?:string;transactionId?:string|null}){
 const key=process.env.RESEND_API_KEY;if(!key)throw new Error("RESEND_API_KEY is not configured");
 const s=createAdminClient(),email=a.to.trim().toLowerCase();if(!email)throw new Error("Recipient email is required");
 if(a.userId&&a.kind!=="thank_you"){const{data:p}=await s.from("user_settings").select("email_notifications,giving_impact_emails,campaign_emails,annual_giving_report_email").eq("user_id",a.userId).maybeSingle();if(p?.email_notifications===false)return{skipped:true};if(a.kind==="impact_update"&&p?.giving_impact_emails===false)return{skipped:true};if(a.kind==="campaign"&&p?.campaign_emails===false)return{skipped:true};if(a.kind==="annual_report"&&p?.annual_giving_report_email===false)return{skipped:true};}
 // The thank-you unique index reserves one log row per verified transaction.
 // A failed send may retry by atomically claiming that same row; pending and
 // sent rows are deliberately not retried to avoid duplicate provider sends.
 let logId:string|null=null;
 if(a.transactionId&&a.kind==="thank_you"){
  const{data:prior,error:lookupError}=await s.from("giving_communications").select("id,status").eq("related_transaction_id",a.transactionId).eq("communication_type","thank_you").maybeSingle();
  if(lookupError)throw new Error(lookupError.message);
  if(prior){
   if(prior.status!=="failed")return{skipped:true};
   const{data:claimed,error:claimError}=await s.from("giving_communications").update({status:"pending",error_message:null}).eq("id",prior.id).eq("status","failed").select("id").maybeSingle();
   if(claimError)throw new Error(claimError.message);
   if(!claimed)return{skipped:true};
   logId=claimed.id;
  }
 }
 if(!logId){
  const{data:created,error:insertError}=await s.from("giving_communications").insert({user_id:a.userId||null,recipient_email:email,communication_type:a.kind,subject:a.subject,related_transaction_id:a.transactionId||null}).select("id").single();
  // Concurrent webhook and manual sync can race on the unique transaction key.
  // The winner sends; the loser must not send a duplicate.
  if(insertError?.code==="23505"&&a.transactionId&&a.kind==="thank_you")return{skipped:true};
  if(insertError)throw new Error(insertError.message);
  logId=created.id;
 }
 const cta=a.ctaLabel&&a.ctaUrl?"\n\n"+a.ctaLabel+": "+a.ctaUrl:"";
 const text="THE LOST & FOUND PROJECT\n\n"+a.heading+"\n\n"+a.body+cta+"\n\nGod first. Scripture first. Thank you for being part of the mission.";
 try{const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL||"The Lost & Found Project <noreply@lostandfoundproject.org>",to:[email],subject:a.subject,text})});const p=await res.json();if(!res.ok)throw new Error(p?.message||"Resend failed ("+res.status+")");await s.from("giving_communications").update({status:"sent",provider_message_id:p.id||null,sent_at:new Date().toISOString()}).eq("id",logId);return{sent:true,id:p.id};}catch(e:any){await s.from("giving_communications").update({status:"failed",error_message:String(e?.message||e)}).eq("id",logId);throw e}
}
export const givingLinks={giving:appUrl+"/give",myGiving:appUrl+"/account/giving",annual:appUrl+"/account/giving/annual"};
