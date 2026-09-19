import { redirect } from "next/navigation";

const EMMAUS_ORIGIN = process.env.EMMAUS_SITE_URL ?? "https://emmaus.lostandfoundproject.org";

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/study";
  return value;
}

export default async function EmmausLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safePath(params.next);
  redirect(`${EMMAUS_ORIGIN}/login?next=${encodeURIComponent(next)}`);
}
