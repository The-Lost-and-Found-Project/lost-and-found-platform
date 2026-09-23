import { redirect } from "next/navigation";

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/welcome";
  return value;
}

export default async function EmmausSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safePath(params.next);
  const handoff = `/auth/emmaus?next=${encodeURIComponent(next)}`;
  redirect(`/signup?source=emmaus&next=${encodeURIComponent(handoff)}`);
}
