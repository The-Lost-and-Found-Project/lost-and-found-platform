import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value:string|null){return value?.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")?value:"/reset-password"}

export async function GET(request:Request){const{searchParams,origin}=new URL(request.url);const code=searchParams.get("code");const next=safeNext(searchParams.get("next"));if(!code)return NextResponse.redirect(`${origin}/forgot-password?error=missing`);const supabase=await createClient();const{error}=await supabase.auth.exchangeCodeForSession(code);if(error){console.warn("Password recovery code exchange failed",{code:error.code,status:error.status});return NextResponse.redirect(`${origin}/forgot-password?error=invalid`)}return NextResponse.redirect(`${origin}${next}`)}
