import Link from "next/link";
import type { CSSProperties } from "react";

const clampStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

type MyRequest = {
  id: string;
  created_at: string;
  request_text: string;
  status: string;
};

type PrayedItem = {
  id: string;
  request_text: string;
  display_name: string | null;
};

function statusBadgeClasses(status: string) {
  if (status === "Answered") {
    return "bg-green-100 text-green-700";
  }
  if (status === "New") {
    return "bg-gray-100 text-gray-700";
  }
  if (status === "Archived" || status === "Denied") {
    return "bg-gray-100 text-gray-500";
  }
  // Covers "In Progress", "Assigned", or any other in-flight status.
  return "bg-indigo-100 text-indigo-700";
}

export default function PersonalDashboardSummary({
  myRequests,
  prayedFor,
}: {
  myRequests: MyRequest[];
  prayedFor: PrayedItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Your Prayer Requests
          </h2>
          <Link
            href="/my-journey"
            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {myRequests.length === 0 && (
            <p className="text-sm text-gray-500">
              You haven&rsquo;t submitted a prayer request yet.
            </p>
          )}

          {myRequests.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-700" style={clampStyle}>
                {r.request_text}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses(
                  r.status
                )}`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Prayers You&rsquo;ve Prayed For
          </h2>
          <Link
            href="/prayer"
            className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Prayer Wall
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {prayedFor.length === 0 && (
            <p className="text-sm text-gray-500">
              You haven&rsquo;t prayed for a request yet. Visit the Prayer
              Wall to get started.
            </p>
          )}

          {prayedFor.map((p) => (
            <div key={p.id}>
              <p className="text-sm text-gray-700" style={clampStyle}>
                {p.request_text}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {p.display_name ?? "Anonymous"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
