import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import { cleanText, LIVE_POST_LIMITS } from "@/lib/lf-live/feed";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string; postId: string }> }) {
  const { sessionId, postId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const db = createAdminClient();
  const [{ data: profile }, { data: session }, { data: participant }, { data: post }] = await Promise.all([
    db.from("profiles").select("role,preview_role,is_active").eq("id", user.id).maybeSingle(),
    db.from("study_sessions").select("id,facilitator_user_id,created_by,status,live_ended_at").eq("id", sessionId).maybeSingle(),
    db.from("study_session_participants").select("study_session_id").eq("study_session_id", sessionId).eq("user_id", user.id).maybeSingle(),
    db.from("study_session_live_posts").select("id,session_id,post_type,choices,is_published,expires_at").eq("id", postId).eq("session_id", sessionId).maybeSingle(),
  ]);
  if (!profile?.is_active || !session || !post) return NextResponse.json({ error: "Live post not found." }, { status: 404 });
  const role = getEffectiveRole(profile.role, profile.preview_role);
  const facilitator = role === "admin" || session.facilitator_user_id === user.id || (!session.facilitator_user_id && session.created_by === user.id);
  if (!participant && !facilitator) return NextResponse.json({ error: "You are not assigned to this live study." }, { status: 403 });
  if (!post.is_published || session.status === "completed" || session.status === "cancelled" || session.live_ended_at) return NextResponse.json({ error: "This live post is no longer active." }, { status: 410 });
  if (post.expires_at && new Date(post.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "This live post has expired." }, { status: 410 });

  const body = await request.json().catch(() => ({}));
  const responseText = cleanText(body.responseText, LIVE_POST_LIMITS.response);
  const choice = cleanText(body.choice, LIVE_POST_LIMITS.choice);
  const choices = Array.isArray(post.choices) ? post.choices.map((item: unknown) => String(item)) : [];
  if (post.post_type === "poll") {
    if (!choice || !choices.includes(choice)) return NextResponse.json({ error: "Choose one of the published poll choices." }, { status: 400 });
  } else if (!responseText) {
    return NextResponse.json({ error: "Enter a response before submitting." }, { status: 400 });
  }

  const { data: response, error } = await db.from("study_session_live_post_responses").upsert({
    post_id: postId,
    user_id: user.id,
    choice: post.post_type === "poll" ? choice : null,
    response_text: post.post_type === "poll" ? null : responseText,
    updated_at: new Date().toISOString(),
  }, { onConflict: "post_id,user_id" }).select("post_id,user_id,choice,response_text,created_at,updated_at").single();
  if (error || !response) return NextResponse.json({ error: error?.message ?? "Unable to save your response." }, { status: 500 });
  return NextResponse.json({ response });
}
