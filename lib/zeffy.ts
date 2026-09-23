import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const ZEFFY_API_BASE="https://api.zeffy.com/api/v1";

type AnyRecord=Record<string,any>;

function first<T=any>(obj:AnyRecord,...keys:string[]):T|undefined{
 for(const key of keys){const value=key.split(".").reduce<any>((acc,k)=>acc?.[k],obj);if(value!==undefined&&value!==null&&value!=="")return value as T}
}
function toIso(value:any){if(!value)return new Date().toISOString();if(typeof value==="number")return new Date(value<1e12?value*1000:value).toISOString();const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString()}
function amountNumber(value:any){const n=Number(value??0);if(!Number.isFinite(n))return 0;return n>100000? n/100 : n}
export async function fetchZeffyPayment(id:string){
 const key=process.env.ZEFFY_API_KEY;if(!key)throw new Error("ZEFFY_API_KEY is not configured");
 const res=await fetch(`${ZEFFY_API_BASE}/payments/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${key}`,Accept:"application/json"},cache:"no-store"});
 if(!res.ok)throw new Error(`Zeffy payment lookup failed (${res.status})`);
 return await res.json() as AnyRecord;
}
export async function fetchZeffyPayments(cursor?:string){
 const key=process.env.ZEFFY_API_KEY;if(!key)throw new Error("ZEFFY_API_KEY is not configured");
 const url=new URL(`${ZEFFY_API_BASE}/payments`);url.searchParams.set("limit","100");url.searchParams.set("status","succeeded");if(cursor)url.searchParams.set("starting_after",cursor);
 const res=await fetch(url,{headers:{Authorization:`Bearer ${key}`,Accept:"application/json"},cache:"no-store"});
 if(!res.ok)throw new Error(`Zeffy payments list failed (${res.status})`);
 return await res.json() as AnyRecord;
}
export async function upsertVerifiedZeffyPayment(payment:AnyRecord){
 const supabase=createAdminClient();
 const id=String(first(payment,"id","payment.id","uuid")??"");if(!id)throw new Error("Verified Zeffy payment did not include an id");
 const email=String(first(payment,"buyer.email","contact.email","email","buyer_email")??"").trim().toLowerCase()||null;
 const name=String(first(payment,"buyer.name","contact.name","name","buyer_name")??"").trim()||null;
 const campaignId=String(first(payment,"campaign.id","campaign_id","campaign")??"").trim()||null;
 const amount=amountNumber(first(payment,"amount","total","amount_total","payment.amount"));
 const currency=String(first(payment,"currency","payment.currency")??"USD").toUpperCase();
 const status=String(first(payment,"status","payment.status")??"succeeded");
 const donatedAt=toIso(first(payment,"created","created_at","date","paid_at","completed_at"));
 const receiptUrl=String(first(payment,"tax_receipt_url","receipt_url","receipt.url","taxReceipt.url")??"").trim()||null;
 const transactionType=String(first(payment,"subscription_id","recurring","frequency")?"recurring":"one_time");
 let userId:null|string=null;
 if(email){const{data:userPage}=await supabase.auth.admin.listUsers({page:1,perPage:1000});const matched=userPage?.users?.find((u:any)=>u.email?.toLowerCase()===email);userId=matched?.id??null}
 let localCampaignId:null|string=null;
 if(campaignId){const{data:campaign}=await supabase.from("giving_campaigns").select("id,slug").eq("zeffy_campaign_id",campaignId).maybeSingle();localCampaignId=campaign?.id??null}
 const row={user_id:userId,provider:"zeffy",provider_transaction_id:id,campaign_id:localCampaignId,source:localCampaignId?"campaign":"general_mission",amount,currency,transaction_type:transactionType,status:status==="succeeded"?"completed":status,donated_at:donatedAt,receipt_url:receiptUrl,contact_email:email,contact_name:name,zeffy_campaign_id:campaignId,raw_metadata:{zeffy_type:first(payment,"type"),line_items:first(payment,"line_items"),refund:first(payment,"refund")}};
 const{error}=await supabase.from("giving_transactions").upsert(row,{onConflict:"provider_transaction_id"});if(error)throw new Error(error.message);
 return row;
}
