import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

// The release-candidate preview currently shares integration variable targets
// with Production. Do not let it serve authenticated routes or APIs until the
// Preview Supabase and outbound providers are independently verified as safe.
// This deliberately applies ONLY to this release branch, not other previews.
function unsafeReleasePreview() {
  return process.env.VERCEL_ENV === "preview"
    && process.env.VERCEL_GIT_COMMIT_REF === "release/lfp-security-ministry-giving-20261110"
    && process.env.LFP_RELEASE_PREVIEW_ISOLATED !== "true";
}

export async function proxy(request: NextRequest) {
  if (unsafeReleasePreview()) {
    return new NextResponse("Release preview disabled until isolated staging is verified.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
