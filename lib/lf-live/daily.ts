import "server-only";

const DAILY_API_BASE = "https://api.daily.co/v1";

function apiKey(){
  const key=process.env.DAILY_API_KEY?.trim();
  if(!key) throw new Error("L&F Live is waiting for the Daily API key.");
  return key;
}

async function dailyFetch<T>(path:string,init:RequestInit={}){
  const response=await fetch(`${DAILY_API_BASE}${path}`,{
    ...init,
    headers:{Authorization:`Bearer ${apiKey()}`,"Content-Type":"application/json",...(init.headers||{})},
    cache:"no-store",
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body?.info||body?.error||`Daily request failed (${response.status}).`);
  return body as T;
}

function roomName(sessionId:string){return `lf-${sessionId.replace(/-/g,"").slice(0,24)}`;}

export function isDailyConfigured(){return Boolean(process.env.DAILY_API_KEY?.trim());}

export async function ensureDailyRoom(sessionId:string,existingRoom?:string|null){
  if(existingRoom) return {name:existingRoom,url:`https://${process.env.DAILY_DOMAIN||"lostandfoundproject"}.daily.co/${existingRoom}`};
  const exp=Math.floor(Date.now()/1000)+(8*60*60);
  return dailyFetch<{name:string;url:string}>("/rooms",{method:"POST",body:JSON.stringify({name:roomName(sessionId),privacy:"private",properties:{exp,eject_at_room_exp:true,enable_prejoin_ui:false,enable_screenshare:false,enable_chat:false,start_video_off:true,start_audio_off:true}})});
}

export async function createDailyMeetingToken(args:{roomName:string;userId:string;userName:string;owner:boolean}){
  const exp=Math.floor(Date.now()/1000)+(8*60*60);
  const data=await dailyFetch<{token:string}>("/meeting-tokens",{method:"POST",body:JSON.stringify({properties:{room_name:args.roomName,user_id:args.userId,user_name:args.userName,is_owner:args.owner,exp}})});
  return data.token;
}

export async function closeDailyRoom(roomName:string){
  if(!roomName||!isDailyConfigured())return;
  try{await dailyFetch(`/rooms/${encodeURIComponent(roomName)}`,{method:"DELETE"});}
  catch(error){console.error("Unable to close Daily room",{roomName,error:error instanceof Error?error.message:String(error)});throw error;}
}
