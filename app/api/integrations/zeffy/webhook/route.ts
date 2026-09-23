import {NextRequest,NextResponse} from "next/server";
import {fetchZeffyPayment,upsertVerifiedZeffyPayment} from "@/lib/zeffy";

export async function POST(request:NextRequest){
 try{
  const body=await request.json();const eventType=body?.type??body?.event_type??body?.event?.type;
  if(eventType!=="payment.completed")return NextResponse.json({ok:true,ignored:true});
  const payload=body?.data?.object??body?.data??body?.payment??body?.object??{};
  const paymentId=String(payload?.id??body?.payment_id??"");
  if(!paymentId)return NextResponse.json({error:"Missing Zeffy payment id"},{status:400});
  // Zeffy's public webhook docs do not document a signed webhook header.
  // Never trust the inbound body as the source of record: re-fetch the payment
  // from Zeffy's authenticated API and store only that verified response.
  const verified=await fetchZeffyPayment(paymentId);
  await upsertVerifiedZeffyPayment(verified);
  return NextResponse.json({ok:true});
 }catch(error){console.error("Zeffy webhook sync failed",error);return NextResponse.json({error:"Unable to verify Zeffy payment"},{status:503})}
}
