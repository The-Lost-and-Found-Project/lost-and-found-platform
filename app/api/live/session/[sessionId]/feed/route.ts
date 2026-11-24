import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import {
  cleanChoices,
  cleanText,
  isLivePostType,
  LIVE_POST_LIMITS,
} from "@/lib/lf-live/feed";

export const dynamic = "force-dynamic";

async function access(sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = createAdminClient();
  const [{ data: profile }, { data: session }, { data: participant }] = await Promise.all([
    db.from("profiles").select("role,preview_role,is_active").eq("id", user.id).maybeSingle(),
    db.from("study_sessions").select("id,facilitator_user_id,created_by,status,live_ended_at").eq("id", sessionId).maybeSingle(),
    db.from("study_session_participants").select("study_session_id").eq("study_session_id", sessionId).eq("user_id", user.id).maybeSingle(),
  ]);

  if (!profile?.is_active || !session) return null;
  const role = getEffectiveRole(profile.role, profile.preview_role);
  const facilitator = role === "admin"
    || session.facilitator_user_id === user.id
    || (!session.facilitator_user_id && session.created_by === user.id);
  let supervisor = false;
  if (role === "supervisor" && session.facilitator_user_id) {
    const { data } = await db.from("facilitator_supervision")
      .select("facilitator_user_id")
      .eq("supervisor_user_id", user.id)
      .eq("facilitator_user_id", session.facilitator_user_id)
      .maybeSingle();
    supervisor = Boolean(data);
  }
  if (!participant && !facilitator && !supervisor) return null;
  return { db, user, session, facilitator, supervisor };
}

function responseSummary(
  posts: any[],
  responses: any[],
  userId: string,
  facilitator: boolean,
) {
  const byPost = new Map<string, any[]>();
  for (const response of responses) {
    const list = byPost.get(response.post_id) ?? [];
    list.push(response);
    byPost.set(response.post_id, list);
  }
  return posts.map((post) => {
    const postResponses = byPost.get(post.id) ?? [];
    const counts = postResponses.reduce((acc: Record<string, number>, item) => {
      if (item.choice) acc[item.choice] = (acc[item.choice] ?? 0) + 1;
      return acc;
    }, {});
    const own = postResponses.find((item) => item.user_id === userId);
    return {
      ...post,
      responseCount: postResponses.length,
      choiceCounts: counts,
      myResponse: own ? { choice: own.choice, responseText: own.response_text } : null,
      ...(facilitator ? { responses: postResponses } : {}),
    };
  });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const ctx = await access(sessionId);
  if (!ctx) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { data: rawPosts, error: postsError } = await ctx.db.from("study_session_live_posts")
    .select("id,session_id,author_user_id,post_type,title,body,scripture_reference,choices,is_published,is_pinned,created_at,updated_at,expires_at")
    .eq("session_id", sessionId)
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: true });
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 });
  const now = Date.now();
  const posts = (rawPosts ?? []).filter((post) => !post.expires_at || new Date(post.expires_at).getTime() > now);
  const { data: responses, error: responsesError } = posts.length
    ? await ctx.db.from("study_session_live_post_responses")
      .select("post_id,user_id,choice,response_text,created_at,updated_at")
      .in("post_id", posts.map((post) => post.id))
    : { data: [], error: null };
  if (responsesError) return NextResponse.json({ error: responsesError.message }, { status: 500 });
  return NextResponse.json({ posts: responseSummary(posts, responses ?? [], ctx.user.id, ctx.facilitator) });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const ctx = await access(sessionId);
  if (!ctx?.facilitator) return NextResponse.json({ error: "Facilitator access required" }, { status: 403 });
  if (ctx.session.status === "completed" || ctx.session.status === "cancelled" || ctx.session.live_ended_at) {
    return NextResponse.json({ error: "This live study has ended." }, { status: 410 });
  }

  const body = await request.json().catch(() => ({}));
  const postType = String(body.postType ?? "");
  const title = cleanText(body.title, LIVE_POST_LIMITS.title);
  const postBody = cleanText(body.body, LIVE_POST_LIMITS.body);
  const choices = cleanChoices(body.choices);
  if (!isLivePostType(postType)) return NextResponse.json({ error: "Choose a valid live post type." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "A live post needs a title." }, { status: 400 });
  if (postType === "poll" && choices.length < 2) return NextResponse.json({ error: "A poll needs at least two choices." }, { status: 400 });
  if (postType !== "poll" && choices.length) return NextResponse.json({ error: "Choices are only allowed for polls." }, { status: 400 });

  const { data: post, error } = await ctx.db.from("study_session_live_posts").insert({
    session_id: sessionId,
    author_user_id: ctx.user.id,
    post_type: postType,
    title,
    body: postBody,
    scripture_reference: cleanText(body.scriptureReference, LIVE_POST_LIMITS.scriptureReference) || null,
    choices,
    is_published: body.isPublished !== false,
    is_pinned: body.isPinned === true,
    expires_at: typeof body.expiresAt === "string" ? body.expiresAt : null,
  }).select("id,session_id,author_user_id,post_type,title,body,scripture_reference,choices,is_published,is_pinned,created_at,updated_at,expires_at").single();
  if (error || !post) return NextResponse.json({ error: error?.message ?? "Unable to publish the live post." }, { status: 500 });
  return NextResponse.json({ post }, { status: 201 });
}
