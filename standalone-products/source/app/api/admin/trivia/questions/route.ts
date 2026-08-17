import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Only admins can manage trivia questions" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function validateQuestionFields(body: any, requireAll: boolean) {
  const { categoryId, question, choices, correct, ref, note } = body ?? {};

  if (requireAll || categoryId !== undefined) {
    if (typeof categoryId !== "string" || !categoryId) {
      return "A category is required";
    }
  }
  if (requireAll || question !== undefined) {
    if (typeof question !== "string" || !question.trim()) {
      return "Question text is required";
    }
  }
  if (requireAll || choices !== undefined) {
    if (
      !Array.isArray(choices) ||
      choices.length < 2 ||
      choices.some((c) => typeof c !== "string" || !c.trim())
    ) {
      return "At least two non-empty answer choices are required";
    }
  }
  if (requireAll || correct !== undefined) {
    if (typeof correct !== "string" || !correct.trim()) {
      return "A correct answer is required";
    }
    if (Array.isArray(choices) && !choices.includes(correct)) {
      return "The correct answer must match one of the choices";
    }
  }
  if (requireAll || ref !== undefined) {
    if (typeof ref !== "string" || !ref.trim()) {
      return "A scripture reference is required";
    }
  }
  if (requireAll || note !== undefined) {
    if (typeof note !== "string" || !note.trim()) {
      return "An explanatory note is required";
    }
  }
  return null;
}

// Admin-authored question. Goes straight in as approved/manual -- unlike
// the AI-authored bulk batches, an admin typing a question in here has
// already reviewed it themselves.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const validationError = validateQuestionFields(body, true);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { categoryId, question, choices, correct, ref, note } = body;
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("trivia_questions")
      .insert({
        category_id: categoryId,
        question: question.trim(),
        choices,
        correct,
        ref: ref.trim(),
        note: note.trim(),
        status: "approved",
        source: "manual",
        created_by: auth.user!.id,
        reviewed_by: auth.user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("admin trivia questions POST error:", err);
    return NextResponse.json(
      { error: "Unexpected error creating question" },
      { status: 500 }
    );
  }
}

// Edits any field on an existing question, including status -- this is how
// a single pending AI question gets approved/rejected, and how an admin
// corrects a typo or swaps the category on any question.
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, status } = body ?? {};

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }

    const validationError = validateQuestionFields(body, false);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (status !== undefined && !["approved", "pending", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (body.categoryId !== undefined) updates.category_id = body.categoryId;
    if (body.question !== undefined) updates.question = body.question.trim();
    if (body.choices !== undefined) updates.choices = body.choices;
    if (body.correct !== undefined) updates.correct = body.correct;
    if (body.ref !== undefined) updates.ref = body.ref.trim();
    if (body.note !== undefined) updates.note = body.note.trim();
    if (status !== undefined) {
      updates.status = status;
      updates.reviewed_by = auth.user!.id;
      updates.reviewed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("trivia_questions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ question: data });
  } catch (err) {
    console.error("admin trivia questions PATCH error:", err);
    return NextResponse.json(
      { error: "Unexpected error updating question" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id } = body ?? {};

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("trivia_questions").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin trivia questions DELETE error:", err);
    return NextResponse.json(
      { error: "Unexpected error deleting question" },
      { status: 500 }
    );
  }
}
