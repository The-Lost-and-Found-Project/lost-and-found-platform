import { redirect } from "next/navigation";

// Account and Profile have been combined into a single page. This route is
// kept (rather than removed) so any old bookmarks, emails, or links that
// still point to /account land somewhere useful instead of 404ing.
export default function AccountPage() {
  redirect("/profile");
}
