/**
 * Computes the last Daily Path day visible to a participant.
 *
 * Release timestamps are instants, not calendar dates. Keep this in sync with
 * public.is_daily_path_day_unlocked: day 1 opens at release time, later days
 * open at elapsed 24-hour intervals, and no day opens before release.
 * Does not authorize access: authenticated session and RLS are still required.
 */
export function getUnlockedDailyPathDay(
  releasedAt: string | null | undefined,
  cardCount: number,
  nowMs: number = Date.now(),
): number {
  if (!releasedAt || !Number.isInteger(cardCount) || cardCount <= 0 || !Number.isFinite(nowMs)) {
    return 0;
  }
  const releaseMs = Date.parse(releasedAt);
  if (!Number.isFinite(releaseMs) || nowMs < releaseMs) {
    return 0;
  }
  const elapsedDays = Math.floor((nowMs - releaseMs) / 86_400_000) + 1;
  return Math.min(31, cardCount, elapsedDays);
}
