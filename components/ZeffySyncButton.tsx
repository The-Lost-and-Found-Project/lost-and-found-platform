"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function ZeffySyncButton(){
  const router=useRouter();
  const[state,setState]=useState<"idle"|"running"|"done"|"error">("idle");
  const[message,setMessage]=useState("");
  async function sync(){
    setState("running");setMessage("");
    try{
      const r=await fetch("/api/admin/giving/zeffy-sync",{method:"POST"});
      const b=await r.json();
      if(!r.ok)throw new Error(b?.error||"Sync failed");
      setMessage(`Synced ${b.upserted} of ${b.seen} Zeffy payments.`);
      setState("done");
      router.refresh();
    }catch(e:any){
      setMessage(e?.message||"Sync failed");setState("error");
    }
  }
  return <div><button onClick={sync} disabled={state==="running"} className="lfp-button lfp-button-primary">{state==="running"?"Syncing Zeffy...":"Sync Zeffy Now"}</button>{message&&<p className={`mt-2 text-sm ${state==="error"?"text-red-700":"text-emerald-700"}`}>{message}</p>}</div>;
}
