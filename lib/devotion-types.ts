export type DevotionDay = {
  day: number;
  title: string;
  verseRef: string;
  teaser: string;
  scripture: string;
  teachingPoint: string;
  story: string;
  application: string;
  reflectionQuestions: string[];
  prayer: string;
};

export type DevotionAudio = {
  id: string;
  devotion_week_id: string;
  day_number: number;
  audio_url: string;
  storage_path: string;
  audio_duration_seconds: number | null;
  voice: string | null;
  narration_text: string;
  content_version: string;
  audio_version: number;
  generated_at: string | null;
  generation_status: "pending" | "processing" | "ready" | "failed";
  updated_at: string;
};

export type DevotionWeek = {
  id: string;
  week_number: number;
  title: string;
  days: DevotionDay[];
  published_at: string | null;
  audio?: DevotionAudio[];
};
