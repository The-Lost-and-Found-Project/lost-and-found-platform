import { NextResponse } from "next/server";

// A tiny, always-fresh endpoint the client polls to detect when a new
// version of the app has been deployed. VERCEL_GIT_COMMIT_SHA is set
// automatically by Vercel at build time for every deployment (no setup
// required), so it changes on every push without us having to maintain a
// version number by hand. This route itself is dynamic (not cached), so
// each request always reflects the currently-running deployment.
export const dynamic = "force-dynamic";

export async function GET() {
  const buildId =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    "dev";

  return NextResponse.json(
    { buildId },
    { headers: { "Cache-Control": "no-store" } }
  );
}
