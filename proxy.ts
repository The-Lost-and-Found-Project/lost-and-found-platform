import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

// This release preview still shares integration variable targets with Production.
// Deny all preview traffic from this code until a separate staging backend and
// mocked outbound integrations have been independently verified.
// Do not depend on optional Vercel Git metadata: its absence must fail closed.
// Production traffic is unaffected.
function unsafeReleasePreview() {
  return process.env.VERCEL_ENV === "preview"
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
