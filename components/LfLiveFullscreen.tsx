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

 useEffect(()=>{
  const viewport=document.querySelector('meta[name="viewport"]');
  const previous=viewport?.getAttribute("content");
  viewport?.setAttribute("content","width=device-width, initial-scale=1, viewport-fit=cover");
  return()=>{if(viewport&&previous)viewport.setAttribute("content",previous)};
 },[]);

 async function toggleFullscreen(){
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await rootRef.current?.requestFullscreen({navigationUI:"hide"});
  }catch(error){console.error("L&F Live fullscreen failed",error)}
 }

 return <div ref={rootRef} className="relative h-[100dvh] min-h-0 overflow-hidden bg-[#07111f] overscroll-none [touch-action:pan-x_pan-y] [&>div]:flex [&>div]:h-full [&>div]:min-h-0 [&>div]:flex-col [&>div>header]:shrink-0 [&>div>main]:min-h-0 [&>div>main]:flex-1 [&>div>main]:overflow-y-auto [&>div>main]:overscroll-contain [&>div>footer]:static [&>div>footer]:shrink-0">
  {children}
  {supported&&<button
   type="button"
   onClick={toggleFullscreen}
   aria-label={fullscreen?"Exit full screen":"Enter full screen"}
   title={fullscreen?"Exit full screen":"Full screen"}
   className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-50 rounded-full border border-[#c8a96b]/35 bg-[#091625]/95 px-3 py-2.5 text-xs font-black text-white shadow-xl backdrop-blur transition hover:border-[#d9bd7d] hover:bg-[#102238] focus:outline-none focus:ring-2 focus:ring-[#d9bd7d] sm:bottom-24 sm:right-4 sm:px-4 sm:py-3 sm:text-sm"
  >{fullscreen?"Exit Full Screen":"Full Screen"}</button>}
 </div>;
}
