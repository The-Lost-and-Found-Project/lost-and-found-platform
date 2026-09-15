import { redirect } from "next/navigation";

// This route is retained only for backward compatibility with old links.
// Learning Lab, L&F Studies, Devotions, and the Emmaus handoff now belong to
// the unified Platform 2.0 Discover journey rather than a "future apps" page.
export default function AppsPage() {
  redirect("/discover");
}
