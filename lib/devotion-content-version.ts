import "server-only";

import { createHash } from "node:crypto";
import type { DevotionDay } from "@/lib/devotion-types";

export function getDevotionContentVersion(day: DevotionDay): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        day: day.day,
        title: day.title,
        verseRef: day.verseRef,
        scripture: day.scripture,
        teachingPoint: day.teachingPoint,
        story: day.story,
        application: day.application,
        reflectionQuestions: day.reflectionQuestions,
        prayer: day.prayer,
      })
    )
    .digest("hex");
}
