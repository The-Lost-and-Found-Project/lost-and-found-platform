"use client";

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

const WEEKS_OF_HISTORY = 10;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Buckets a list of ISO timestamps into weekly counts, oldest to newest,
// covering the last WEEKS_OF_HISTORY weeks (including the current one).
function bucketByWeek(timestamps: string[]): { label: string; count: number }[] {
  const now = new Date();
  // Start of the current week (Sunday).
  const currentWeekStart = new Date(now);
  currentWeekStart.setHours(0, 0, 0, 0);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

  const buckets: { start: number; label: string; count: number }[] = [];
  for (let i = WEEKS_OF_HISTORY - 1; i >= 0; i--) {
    const start = currentWeekStart.getTime() - i * MS_PER_WEEK;
    const d = new Date(start);
    buckets.push({
      start,
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const ts of timestamps) {
    const t = new Date(ts).getTime();
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (t >= buckets[i].start) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function WeeklyBarChart({
  data,
  color = "bg-indigo-500",
}: {
  data: { label: string; count: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-24 w-full items-end justify-center">
            <div
              className={`w-full max-w-[22px] rounded-t ${color}`}
              style={{
                height: `${Math.max(4, (d.count / max) * 96)}px`,
              }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
          <span className="text-[10px] text-gray-400">{d.count}</span>
        </div>
      ))}
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

  const requestsPerWeek = bucketByWeek(requests.map((r) => r.created_at));
  const signupsPerWeek = bucketByWeek(profiles.map((p) => p.created_at));

  const thisWeek = requestsPerWeek[requestsPerWeek.length - 1]?.count ?? 0;
  const lastWeek = requestsPerWeek[requestsPerWeek.length - 2]?.count ?? 0;
  const weekDelta = thisWeek - lastWeek;

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
      <div className="flex items-start justify-between gap-4">
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Prayer requests per week
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Last {WEEKS_OF_HISTORY} weeks, starting each Sunday
          </p>
          <div className="mt-4">
            <WeeklyBarChart data={requestsPerWeek} color="bg-indigo-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            New members per week
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Last {WEEKS_OF_HISTORY} weeks, starting each Sunday
          </p>
          <div className="mt-4">
            <WeeklyBarChart data={signupsPerWeek} color="bg-emerald-500" />
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
