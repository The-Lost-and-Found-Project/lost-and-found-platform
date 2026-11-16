export type CalendarFilter = "All" | "Mine" | "Assigned" | "Shared";
export type CalendarScope = "Master calendar" | "Personal calendar";
export type PreviewEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  ministry: string;
  mine: boolean;
  assigned: boolean;
  shared: boolean;
};

// Synthetic design fixtures only. Filtering is not an authorization boundary.
export const previewEvents: readonly PreviewEvent[] = [
  { id: "sample-study", date: "Fri · Nov 20", time: "6:30 PM", title: "Men’s Bible study", ministry: "Studies", mine: true, assigned: true, shared: false },
  { id: "sample-outreach", date: "Sat · Nov 21", time: "10:00 AM", title: "Serve team preparation", ministry: "Outreach", mine: false, assigned: false, shared: true },
  { id: "sample-prayer", date: "Sun · Nov 22", time: "9:00 AM", title: "Prayer team gathering", ministry: "Prayer", mine: true, assigned: false, shared: true },
];

export function filterPreviewEvents(events: readonly PreviewEvent[], scope: CalendarScope, filter: CalendarFilter, ministry: string) {
  return events.filter((event) => {
    if (scope === "Personal calendar" && !event.mine) return false;
    if (ministry !== "All ministries" && event.ministry !== ministry) return false;
    if (filter === "Mine") return event.mine;
    if (filter === "Assigned") return event.assigned;
    if (filter === "Shared") return event.shared;
    return true;
  });
}
