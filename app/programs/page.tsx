import { redirect } from "next/navigation";

// Programs was a legacy transition page from the period when L&F learning
// experiences were being split into standalone products. Platform 2.0 now
// brings those member journeys together under Discover, so old bookmarks and
// links should land in the current workflow instead of showing stale product
// migration messaging.
export default function ProgramsPage() {
  redirect("/discover");
}
