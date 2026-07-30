import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDevotionContentVersion } from "@/lib/devotion-content-version";
import type { DevotionDay } from "@/lib/devotion-types";

const AUDIO_BUCKET = "devotion-audio";
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
};

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
        { error: "Only admins can manage devotion audio" },
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

    const form = await request.formData();
    const weekId = form.get("weekId");
    const dayNumber = Number(form.get("dayNumber"));
    const narrationText = form.get("narrationText");
    const voice = form.get("voice");
    const durationValue = Number(form.get("durationSeconds"));
    const file = form.get("file");

    if (typeof weekId !== "string" || !weekId) {
      return NextResponse.json({ error: "Missing devotion week" }, { status: 400 });
    }
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      return NextResponse.json({ error: "Invalid devotion day" }, { status: 400 });
    }
    if (typeof narrationText !== "string" || narrationText.trim().length < 40) {
      return NextResponse.json(
        { error: "Add the narration-friendly script used for this audio" },
        { status: 400 }
      );
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Choose an audio file" }, { status: 400 });
    }
    if (!AUDIO_EXTENSIONS[file.type]) {
      return NextResponse.json(
        { error: "Use an MP3, M4A, OGG, WAV, or WebM audio file" },
        { status: 400 }
      );
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "Audio files must be 50 MB or smaller" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: week, error: weekError } = await admin
      .from("devotion_weeks")
      .select("id, days")
      .eq("id", weekId)
      .single();

    if (weekError || !week) {
      return NextResponse.json({ error: "Devotion week not found" }, { status: 404 });
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

    const audioVersion = (existing?.audio_version ?? 0) + 1;
    const extension = AUDIO_EXTENSIONS[file.type];
    uploadedPath = `${weekId}/day-${dayNumber}/content-${contentVersion.slice(
      0,
      12
    )}-audio-${audioVersion}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await admin.storage
      .from(AUDIO_BUCKET)
      .upload(uploadedPath, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = admin.storage.from(AUDIO_BUCKET).getPublicUrl(uploadedPath);

    const { data: audio, error: audioError } = await admin
      .from("devotion_audio")
      .upsert(
        {
          devotion_week_id: weekId,
          day_number: dayNumber,
          audio_url: publicUrl,
          storage_path: uploadedPath,
          audio_duration_seconds:
            Number.isFinite(durationValue) && durationValue > 0 ? durationValue : null,
          voice:
            typeof voice === "string" && voice.trim() ? voice.trim().slice(0, 100) : null,
          narration_text: narrationText.trim(),
          content_version: contentVersion,
          audio_version: audioVersion,
          generated_at: null,
          generation_status: "ready",
          created_by: auth.user!.id,
          updated_at: new Date().toISOString(),
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
        console.error("devotion audio old-file cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ audio });
  } catch (error) {
    console.error("admin devotion audio POST error:", error);
    return NextResponse.json(
      { error: "The devotion audio could not be saved. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { weekId, dayNumber } = body ?? {};

    if (
      typeof weekId !== "string" ||
      !weekId ||
      !Number.isInteger(dayNumber) ||
      dayNumber < 1 ||
      dayNumber > 31
    ) {
      return NextResponse.json({ error: "Invalid devotion audio" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin
      .from("devotion_audio")
      .select("id, storage_path")
      .eq("devotion_week_id", weekId)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) return NextResponse.json({ success: true });

    const { error: storageError } = await admin.storage
      .from(AUDIO_BUCKET)
      .remove([existing.storage_path]);
    if (storageError) throw storageError;

    const { error: deleteError } = await admin
      .from("devotion_audio")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin devotion audio DELETE error:", error);
    return NextResponse.json(
      { error: "The devotion audio could not be removed. Please try again." },
      { status: 500 }
    );
  }
}
