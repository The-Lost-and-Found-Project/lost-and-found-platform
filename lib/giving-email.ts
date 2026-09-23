import "server-only";
import {createAdminClient} from "@/lib/supabase/admin";
type Kind="thank_you"|"impact_update"|"annual_report"|"campaign";
const appUrl=process.env.NEXT_PUBLIC_APP_URL||"https://app.lostandfoundproject.org";
export async function sendGivingEmail(a:{to:string;userId?:string|null;kind:Kind;subject:string;heading:string;body:string;ctaLabel?:string;ctaUrl?:string;transactionId?:string|null}){
 const key=process.env.RESEND_API_KEY;if(!key)throw new Error("RESEND_API_KEY is not configured");
 const s=createAdminClient(),email=a.to.trim().toLowerCase();if(!email)throw new Error("Recipient email is required");
 if(a.userId&&a.kind!=="thank_you"){const{data:p}=await s.from("user_settings").select("email_notifications,giving_impact_emails,campaign_emails,annual_giving_report_email").eq("user_id",a.userId).maybeSingle();if(p?.email_notifications===false)return{skipped:true};if(a.kind==="impact_update"&&p?.giving_impact_emails===false)return{skipped:true};if(a.kind==="campaign"&&p?.campaign_emails===false)return{skipped:true};if(a.kind==="annual_report"&&p?.annual_giving_report_email===false)return{skipped:true};}
 if(a.transactionId&&a.kind==="thank_you"){const{data:prior}=await s.from("giving_communications").select("id").eq("related_transaction_id",a.transactionId).eq("communication_type","thank_you").maybeSingle();if(prior)return{skipped:true};}
 const{data:log,error}=await s.from("giving_communications").insert({user_id:a.userId||null,recipient_email:email,communication_type:a.kind,subject:a.subject,related_transaction_id:a.transactionId||null}).select("id").single();if(error)throw new Error(error.message);
 const cta=a.ctaLabel&&a.ctaUrl?"\n\n"+a.ctaLabel+": "+a.ctaUrl:"";
 const text="THE LOST & FOUND PROJECT\n\n"+a.heading+"\n\n"+a.body+cta+"\n\nGod first. Scripture first. Thank you for being part of the mission.";
 try{const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL||"The Lost & Found Project <noreply@lostandfoundproject.org>",to:[email],subject:a.subject,text})});const p=await res.json();if(!res.ok)throw new Error(p?.message||"Resend failed ("+res.status+")");await s.from("giving_communications").update({status:"sent",provider_message_id:p.id||null,sent_at:new Date().toISOString()}).eq("id",log.id);return{sent:true,id:p.id};}catch(e:any){await s.from("giving_communications").update({status:"failed",error_message:String(e?.message||e)}).eq("id",log.id);throw e}
}
export const givingLinks={giving:appUrl+"/give",myGiving:appUrl+"/account/giving",annual:appUrl+"/account/giving/annual"};
