/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 18: /bin/ps: Operation not permitted
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDevotionContentVersion } from "@/lib/devotion-content-version";
import type { DevotionDay } from "@/lib/devotion-types";

export const maxDuration = 60;

const AUDIO_BUCKET = "devotion-audio";
const MAX_NARRATION_CHARACTERS = 4096;
const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts-2025-12-15";
const ALLOWED_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "cedar",
  "coral",
  "echo",
  "fable",
  "marin",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
]);

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
        { error: "Only admins can generate devotion audio" },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function findDay(days: unknown, dayNumber: number): DevotionDay | null {
  if (!Array.isArray(days)) return null;

  const day = days.find(
    (candidate) =>
      typeof candidate === "object" &&
      candidate !== null &&
      (candidate as { day?: unknown }).day === dayNumber
  );

  return day ? (day as DevotionDay) : null;
}

export async function POST(request: NextRequest) {
  let uploadedPath: string | null = null;

  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI audio generation is not configured." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const weekId = typeof body?.weekId === "string" ? body.weekId : "";
    const dayNumber = Number(body?.dayNumber);
    const narrationText =
      typeof body?.narrationText === "string" ? body.narrationText.trim() : "";
    const voice = typeof body?.voice === "string" ? body.voice : "";

    if (!weekId) {
      return NextResponse.json({ error: "Missing devotion week" }, { status: 400 });
    }
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      return NextResponse.json({ error: "Invalid devotion day" }, { status: 400 });
    }
    if (narrationText.length < 40) {
      return NextResponse.json(
        { error: "Add the narration-friendly script used for this audio" },
        { status: 400 }
      );
    }
    if (narrationText.length > MAX_NARRATION_CHARACTERS) {
      return NextResponse.json(
        {
          error: `Narration must be ${MAX_NARRATION_CHARACTERS.toLocaleString()} characters or fewer.`,
        },
        { status: 400 }
      );
    }
    if (!ALLOWED_VOICES.has(voice)) {
      return NextResponse.json({ error: "Choose an available voice" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: week, error: weekError } = await admin
      .from("devotion_weeks")
      .select("id, days, status")
      .eq("id", weekId)
      .single();

    if (weekError || !week) {
      return NextResponse.json({ error: "Devotion week not found" }, { status: 404 });
    }
    if (week.status !== "approved" && week.status !== "published") {
      return NextResponse.json(
        { error: "Approve the devotional before generating its audio." },
        { status: 409 }
      );
    }

    const day = findDay(week.days, dayNumber);
    if (!day) {
      return NextResponse.json({ error: "Devotion day not found" }, { status: 404 });
    }

    const contentVersion = getDevotionContentVersion(day);
    const { data: existing, error: existingError } = await admin
      .from("devotion_audio")
      .select("storage_path, audio_version")
      .eq("devotion_week_id", weekId)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (existingError) throw existingError;

    const speechResponse = await fetch(OPENAI_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || DEFAULT_TTS_MODEL,
        voice,
        input: narrationText,
        instructions:
          "Speak in a calm, warm, reverent devotional tone. Pause naturally between sections. Read Scripture references clearly. Do not add, omit, paraphrase, or editorialize. Avoid a theatrical or promotional delivery.",
        response_format: "mp3",
        speed: 0.95,
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!speechResponse.ok) {
      const providerMessage = (await speechResponse.text()).slice(0, 1_000);
      console.error("OpenAI devotion speech generation error:", {
        status: speechResponse.status,
        message: providerMessage,
      });
      return NextResponse.json(
        {
          error:
            "Audio generation is unavailable. Check the OpenAI API key and billing, then try again.",
        },
        { status: 502 }
      );
    }

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    if (audioBuffer.length === 0) {
      throw new Error("OpenAI returned an empty audio response");
    }

    const audioVersion = (existing?.audio_version ?? 0) + 1;
    uploadedPath = `${weekId}/day-${dayNumber}/content-${contentVersion.slice(
      0,
      12
    )}-audio-${audioVersion}-${crypto.randomUUID()}.mp3`;

    const { error: uploadError } = await admin.storage
      .from(AUDIO_BUCKET)
      .upload(uploadedPath, audioBuffer, {
        cacheControl: "31536000",
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = admin.storage.from(AUDIO_BUCKET).getPublicUrl(uploadedPath);
    const generatedAt = new Date().toISOString();

    const { data: audio, error: audioError } = await admin
      .from("devotion_audio")
      .upsert(
        {
          devotion_week_id: weekId,
          day_number: dayNumber,
          audio_url: publicUrl,
          storage_path: uploadedPath,
          audio_duration_seconds: null,
          voice,
          narration_text: narrationText,
          content_version: contentVersion,
          audio_version: audioVersion,
          generated_at: generatedAt,
          generation_status: "ready",
          created_by: auth.user!.id,
          updated_at: generatedAt,
        },
        { onConflict: "devotion_week_id,day_number" }
      )
      .select()
      .single();

    if (audioError) {
      await admin.storage.from(AUDIO_BUCKET).remove([uploadedPath]);
      uploadedPath = null;
      throw audioError;
    }

    if (existing?.storage_path && existing.storage_path !== uploadedPath) {
      const { error: cleanupError } = await admin.storage
        .from(AUDIO_BUCKET)
        .remove([existing.storage_path]);
      if (cleanupError) {
        console.error("generated devotion audio old-file cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ audio });
  } catch (error) {
    if (uploadedPath) {
      await createAdminClient().storage.from(AUDIO_BUCKET).remove([uploadedPath]);
    }
    console.error("admin devotion audio generation error:", error);
    return NextResponse.json(
      { error: "The audio could not be generated. Please try again." },
      { status: 500 }
    );
  }
}
