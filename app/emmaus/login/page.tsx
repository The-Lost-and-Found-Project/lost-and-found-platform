import { redirect } from "next/navigation";

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
  const handoff = `/auth/emmaus?next=${encodeURIComponent(next)}`;
  redirect(`/login?source=emmaus&next=${encodeURIComponent(handoff)}`);
}
