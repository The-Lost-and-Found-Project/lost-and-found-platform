import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createKjvSupabaseProvider } from "@/lib/scripture/kjv-supabase-provider";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const book = (request.nextUrl.searchParams.get("book") ?? "John").trim();
  const chapter = Number(request.nextUrl.searchParams.get("chapter") ?? "1");
  const translation = (request.nextUrl.searchParams.get("translation") ?? "KJV").toUpperCase();

  if (translation !== "KJV") {
    return NextResponse.json(
      { error: "This Emmaus checkpoint currently supports only the verified KJV corpus." },
      { status: 400 }
    );
  }

  try {
    const provider = createKjvSupabaseProvider(supabase);
    const result = await provider.getChapter({ book, chapter, translation: "KJV" });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retrieve Scripture.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
