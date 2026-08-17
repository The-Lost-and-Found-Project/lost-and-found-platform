const CLOSED_PRAYER_STATUSES = new Set(["Resolved", "Closed", "Withdrawn"]);

export const CLOSED_PRAYER_STATUS_FILTER = "(Resolved,Closed,Withdrawn)";

type PrayerExposure = {
  answered?: boolean;
  is_public?: boolean;
  moderation_status?: string;
  prayer_count: number;
  status: string;
};

export function prayerSupportLabel(prayerCount: number) {
  if (prayerCount <= 0) return "Waiting for prayer";
  if (prayerCount === 1) return "Someone is carrying this in prayer";
  return "People are carrying this in prayer";
}

export function needsPrayerExposure(request: PrayerExposure) {
  return request.is_public === true
    && request.moderation_status === "approved"
    && request.answered !== true
    && !CLOSED_PRAYER_STATUSES.has(request.status)
    && request.prayer_count <= 1;
}
