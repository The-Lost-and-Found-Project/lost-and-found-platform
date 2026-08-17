const STANDALONE_PRODUCT_PAGE_PREFIXES = [
  "/emmaus",
  "/trivia",
  "/devotions",
  "/admin/trivia",
  "/admin/devotions",
  "/grow",
] as const;

const STANDALONE_PRODUCT_API_PREFIXES = [
  "/api/emmaus",
  "/api/admin/trivia",
  "/api/admin/devotions",
  "/api/cron/publish-devotion-week",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isStandaloneProductPage(pathname: string) {
  return STANDALONE_PRODUCT_PAGE_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );
}

export function isStandaloneProductApi(pathname: string) {
  return STANDALONE_PRODUCT_API_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix)
  );
}
