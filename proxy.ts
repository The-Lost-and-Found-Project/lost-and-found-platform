import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

// Release Preview has no approved staging credentials. Deny traffic until a separate
// synthetic-only backend and mocked outbound integrations have been verified.
// Do not depend on optional Vercel Git metadata: its absence must fail closed.
// Production traffic is unaffected.
function unsafeReleasePreview() {
  if (process.env.VERCEL_ENV !== "preview") return false;
  if (process.env.LFP_RELEASE_PREVIEW_ISOLATED !== "true") return true;
  // An operator's flag alone does not establish isolation. Refuse a preview
  // pointed at the known hosted L&F Production project, malformed URLs, and
  // missing destinations. Other credentials and outbound mocks still require
  // an explicit independent environment review before setting the flag.
  // None of the organization's existing Supabase projects are valid L&F staging.
  // These project refs are public identifiers, not credentials.
  const reservedProjectRefs = new Set([
    "lsxaadzyonvvdbzewpql", // L&F Production
    "mlsxnknanhyhqxebrfwz", // Carolina Hope
    "abqakvjrtshslvnddinl", // Rare Network Production
    "mnrwybmsalvnyloquvan", // Emmaus
    "iypbqzoudnamjsrmairh", // Rare Network Development
  ]);
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    return url.protocol !== "https:"
      || !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
      || reservedProjectRefs.has(url.hostname.split(".")[0])
      || url.username !== ""
      || url.password !== ""
      || url.port !== ""
      || url.pathname !== "/"
      || url.search !== ""
      || url.hash !== "";
  } catch {
    return true;
  }
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
