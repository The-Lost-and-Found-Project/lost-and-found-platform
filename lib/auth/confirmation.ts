const DEFAULT_SITE_URL = "https://app.lostandfoundproject.org";

export function getSiteUrl(browserOrigin?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const candidate = configuredUrl || browserOrigin || DEFAULT_SITE_URL;

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fall through to the canonical production URL.
  }

  return DEFAULT_SITE_URL;
}

export function getConfirmationRedirectUrl(browserOrigin?: string) {
  return `${getSiteUrl(browserOrigin)}/auth/callback?next=/dashboard`;
}

export function getSafeNextPath(value: string | null) {
  if (
    value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return "/dashboard";
}

export function getConfirmationStatusUrl(
  origin: string,
  status: "invalid" | "missing"
) {
  const url = new URL("/auth/confirmation", origin);
  url.searchParams.set("status", status);
  return url;
}
