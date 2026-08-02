import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getBibleChapter,
  isSupportedTranslation,
} from "@/lib/emmaus/bible/provider";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const translationParam = (searchParams.get("translation") ?? "KJV").toUpperCase();
  const book = (searchParams.get("book") ?? "").trim();
  const chapter = Number(searchParams.get("chapter"));

  if (!isSupportedTranslation(translationParam)) {
    return NextResponse.json(
      { error: "Unsupported translation. Use KJV or WEB." },
      { status: 400 }
    );
  }

  if (!book || book.length > 40) {
    return NextResponse.json(
      { error: "A valid Bible book is required." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return NextResponse.json(
      { error: "Chapter must be an integer between 1 and 150." },
      { status: 400 }
    );
  }

  try {
    const result = await getBibleChapter({
      translation: translationParam,
      book,
      chapter,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to retrieve Bible text.";

    const status = message.startsWith("Unsupported Bible book") ? 400 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
