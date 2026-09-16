"use client";

import { ReactNode,useEffect,useRef,useState } from "react";

export default function LfLiveFullscreen({children}:{children:ReactNode}){
 const rootRef=useRef<HTMLDivElement>(null);
 const[fullscreen,setFullscreen]=useState(false);
 const[supported,setSupported]=useState(false);

 useEffect(()=>{
  setSupported(Boolean(document.fullscreenEnabled));
  const sync=()=>setFullscreen(document.fullscreenElement===rootRef.current);
  document.addEventListener("fullscreenchange",sync);
  return()=>document.removeEventListener("fullscreenchange",sync);
 },[]);

 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await rootRef.current?.requestFullscreen({navigationUI:"hide"});
  }catch(error){console.error("L&F Live fullscreen failed",error)}
 }

 return <div ref={rootRef} className="relative min-h-[100dvh] bg-[#07111f]">
  {children}
  {supported&&<button
   type="button"
   onClick={toggleFullscreen}
   aria-label={fullscreen?"Exit full screen":"Enter full screen"}
   title={fullscreen?"Exit full screen":"Full screen"}
   className="fixed bottom-24 right-4 z-50 rounded-full border border-[#c8a96b]/35 bg-[#091625]/95 px-4 py-3 text-sm font-black text-white shadow-xl backdrop-blur transition hover:border-[#d9bd7d] hover:bg-[#102238] focus:outline-none focus:ring-2 focus:ring-[#d9bd7d]"
  >{fullscreen?"Exit Full Screen":"Full Screen"}</button>}
 </div>;
}
