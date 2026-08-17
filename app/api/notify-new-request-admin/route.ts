import { retiredEmailResponse } from "@/lib/retired-email";

export async function POST() {
  return retiredEmailResponse("legacy-new-prayer-admin-email");
}
