// These are legacy surfaces that remain intentionally retired inside the L&F
// application. Active Platform 2.0 member experiences such as /trivia and
// /devotions, plus the L&F-owned /emmaus/login and /emmaus/signup entry doors,
// must never be caught by this boundary.
const STANDALONE_PRODUCT_PAGE_PREFIXES = [
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
