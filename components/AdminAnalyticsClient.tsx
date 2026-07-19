"use client";

import { useMemo, useState } from "react";

type PrayerRequestRow = {
  id: string;
  created_at: string;
  category_id: string | null;
  status: string;
  assigned_to: string | null;
  answered: boolean;
  prayer_count: number;
  flagged: boolean;
  moderation_status: string;
  follow_up_needed: boolean;
  archived: boolean;
};

type CategoryRow = { id: string; name: string };
type ProfileRow = {
  id: string;
  created_at: string;
  role: string;
  is_active: boolean | null;
};
type ModeratedRow = {
  id: string;
  created_at: string;
  moderation_status: string;
};
type ReactionRow = { id: string; created_at: string };

type Props = {
  requests: PrayerRequestRow[];
  categories: CategoryRow[];
  profiles: ProfileRow[];
  testimonies: ModeratedRow[];
  praiseReports: ModeratedRow[];
  reactions: ReactionRow[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

type RangeKey = "all" | "5yr" | "1yr" | "1mo" | "1wk";
type Granularity = "day" | "week";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "5yr", label: "5yrs" },
  { key: "1yr", label: "1yr" },
  { key: "1mo", label: "1mo" },
  { key: "1wk", label: "1wk" },
];

const RANGE_SUBTITLES: Record<RangeKey, string> = {
  all: "All time, weekly",
  "5yr": "Last 5 years, weekly",
  "1yr": "Last 12 months, weekly",
  "1mo": "Last 30 days, daily",
  "1wk": "Last 7 days, daily",
};

// Resolves a range key into a concrete start timestamp + bucket granularity.
// "All" starts from the earliest known record so the chart spans everything
// on file, with a one-week floor so it never renders a single, empty bucket.
function getRangeStart(
  range: RangeKey,
  earliest: number
): { start: number; granularity: Granularity } {
  const now = Date.now();
  switch (range) {
    case "1wk":
      return { start: now - 7 * MS_PER_DAY, granularity: "day" };
    case "1mo":
      return { start: now - 30 * MS_PER_DAY, granularity: "day" };
    case "1yr":
      return { start: now - 365 * MS_PER_DAY, granularity: "week" };
    case "5yr":
      return { start: now - 5 * 365 * MS_PER_DAY, granularity: "week" };
    case "all":
    default:
      return { start: Math.min(earliest, now - MS_PER_WEEK), granularity: "week" };
  }
}

// Buckets a list of ISO timestamps into evenly-sized buckets, oldest to
// newest, spanning from `start` through now at the given granularity.
function bucketTimestamps(
  timestamps: string[],
  start: number,
  granularity: Granularity
): { label: string; count: number }[] {
  const now = new Date();
  const bucketMs = granularity === "day" ? MS_PER_DAY : MS_PER_WEEK;

  // Align the first bucket to a clean day/week boundary.
  const alignedStart = new Date(start);
  alignedStart.setHours(0, 0, 0, 0);
  if (granularity === "week") {
    alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());
  }

  const bucketCount = Math.max(
    1,
    Math.ceil((now.getTime() - alignedStart.getTime()) / bucketMs) + 1
  );

  const buckets: { start: number; label: string; count: number }[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const bStart = alignedStart.getTime() + i * bucketMs;
    const d = new Date(bStart);
    buckets.push({
      start: bStart,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const ts of timestamps) {
    const t = new Date(ts).getTime();
    if (t < alignedStart.getTime()) continue;
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (t >= buckets[i].start) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function TimeSeriesBarChart({
  data,
  color = "bg-indigo-500",
}: {
  data: { label: string; count: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    // Horizontally scrollable rather than squeezed to fit — "All" and "5yr"
    // ranges can produce hundreds of weekly bars, far too many columns to
    // cram into one screen width without every bar going illegibly thin.
    <div className="overflow-x-auto pb-1">
      <div
        className="flex items-end gap-1.5"
        style={{ height: 120, minWidth: data.length * 20 }}
      >
        {data.map((d, i) => (
          <div key={i} className="flex w-4 shrink-0 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className={`w-full max-w-[14px] rounded-t ${color}`}
                style={{
                  height: `${Math.max(4, (d.count / max) * 96)}px`,
                }}
                title={`${d.label}: ${d.count}`}
              />
            </div>
            <span className="text-[8px] text-gray-400">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsClient({
  requests,
  categories,
  profiles,
  testimonies,
  praiseReports,
  reactions,
}: Props) {
  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  const activeRequests = requests.filter((r) => !r.archived);
  const totalRequests = requests.length;
  const answeredCount = requests.filter((r) => r.answered).length;
  const assignedCount = activeRequests.filter((r) => r.assigned_to).length;
  const unassignedCount = activeRequests.filter((r) => !r.assigned_to).length;
  const followUpCount = activeRequests.filter((r) => r.follow_up_needed).length;
  const pendingModerationCount =
    requests.filter((r) => r.moderation_status === "pending").length +
    testimonies.filter((t) => t.moderation_status === "pending").length +
    praiseReports.filter((p) => p.moderation_status === "pending").length;

  const answeredRate =
    totalRequests > 0 ? Math.round((answeredCount / totalRequests) * 100) : 0;
  const assignedRate =
    activeRequests.length > 0
      ? Math.round((assignedCount / activeRequests.length) * 100)
      : 0;

  const totalPrayersOffered = reactions.length;
  const careTeamMembers = profiles.filter((p) =>
    ["admin", "prayer_team", "pastor"].includes(p.role)
  ).length;
  const totalMembers = profiles.length;
  const activeMembers = profiles.filter((p) => p.is_active !== false).length;

  // "This Week" stat card is always this-week-vs-last-week, independent of
  // whatever range the chart toggle below is set to.
  const statsWeekly = useMemo(
    () =>
      bucketTimestamps(
        requests.map((r) => r.created_at),
        Date.now() - 2 * MS_PER_WEEK,
        "week"
      ),
    [requests]
  );
  const thisWeek = statsWeekly[statsWeekly.length - 1]?.count ?? 0;
  const lastWeek = statsWeekly[statsWeekly.length - 2]?.count ?? 0;
  const weekDelta = thisWeek - lastWeek;

  const [range, setRange] = useState<RangeKey>("1wk");

  const earliestTimestamp = useMemo(() => {
    const timestamps = [
      ...requests.map((r) => r.created_at),
      ...profiles.map((p) => p.created_at),
    ];
    if (timestamps.length === 0) return Date.now();
    return Math.min(...timestamps.map((t) => new Date(t).getTime()));
  }, [requests, profiles]);

  const { start: rangeStart, granularity } = useMemo(
    () => getRangeStart(range, earliestTimestamp),
    [range, earliestTimestamp]
  );

  const requestsSeries = useMemo(
    () => bucketTimestamps(requests.map((r) => r.created_at), rangeStart, granularity),
    [requests, rangeStart, granularity]
  );
  const signupsSeries = useMemo(
    () => bucketTimestamps(profiles.map((p) => p.created_at), rangeStart, granularity),
    [profiles, rangeStart, granularity]
  );

  const categoryCounts: Record<string, number> = {};
  requests.forEach((r) => {
    const name = r.category_id ? categoryMap[r.category_id] ?? "Uncategorized" : "Uncategorized";
    categoryCounts[name] = (categoryCounts[name] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCategoryCount = Math.max(1, ...topCategories.map(([, c]) => c));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Growth &amp; Effectiveness
          </h1>
          <p className="mt-2 text-gray-600">
            How the prayer care ministry is growing and performing over time.
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Back to Admin
        </a>
      </div>

      <div className="mt-8 rounded-lg border border-indigo-100 bg-indigo-50/50 p-5">
        <h2 className="text-sm font-semibold text-indigo-900">
          All-Time Totals
        </h2>
        <p className="mt-0.5 text-xs text-indigo-700/70">
          These never reset — they add up for as long as the ministry exists,
          separate from the weekly snapshots below.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Prayer Requests Submitted" value={totalRequests} />
          <StatCard label="Testimonies Shared" value={testimonies.length} />
          <StatCard label="Prayers Offered" value={totalPrayersOffered} />
          <StatCard label="Lives Touched (Members)" value={totalMembers} />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="This Week"
          value={thisWeek}
          sub={
            weekDelta === 0
              ? "Same as last week"
              : `${weekDelta > 0 ? "+" : ""}${weekDelta} vs. last week`
          }
        />
        <StatCard
          label="Answered"
          value={`${answeredRate}%`}
          sub={`${answeredCount} of ${totalRequests} requests`}
        />
        <StatCard
          label="Assigned"
          value={`${assignedRate}%`}
          sub={`${unassignedCount} unassigned`}
        />
        <StatCard label="Follow-ups Due" value={followUpCount} />
        <StatCard label="Pending Review" value={pendingModerationCount} />
        <StatCard
          label="Member Breakdown"
          value={totalMembers}
          sub={`${activeMembers} active · ${careTeamMembers} care team`}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Chart range</h2>
        <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                range === opt.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Prayer requests
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {RANGE_SUBTITLES[range]}
          </p>
          <div className="mt-4">
            <TimeSeriesBarChart data={requestsSeries} color="bg-indigo-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            New members
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {RANGE_SUBTITLES[range]}
          </p>
          <div className="mt-4">
            <TimeSeriesBarChart data={signupsSeries} color="bg-emerald-500" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Requests by category
          </h2>
          <div className="mt-4 space-y-2">
            {topCategories.length === 0 && (
              <p className="text-sm text-gray-400">No requests yet.</p>
            )}
            {topCategories.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs text-gray-600">
                  {name}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-gray-700">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Community engagement
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Testimonies shared</span>
              <span className="font-medium text-gray-900">
                {testimonies.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Praise reports shared</span>
              <span className="font-medium text-gray-900">
                {praiseReports.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total times someone prayed</span>
              <span className="font-medium text-gray-900">
                {totalPrayersOffered}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Avg. prayers per request</span>
              <span className="font-medium text-gray-900">
                {totalRequests > 0
                  ? (totalPrayersOffered / totalRequests).toFixed(1)
                  : "0.0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
