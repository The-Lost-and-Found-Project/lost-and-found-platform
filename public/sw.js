// Service worker for L&F web push. It intentionally does not cache app pages
// or Next.js assets; deployment freshness is owned by the browser/Next.js.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("message", event => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });

self.addEventListener("push", (event) => {
  let data = { title: "The Lost and Found Project", body: "You have a new notification." };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  const badgeCount = typeof data.badgeCount === "number" ? data.badgeCount : null;
  if (badgeCount !== null && "setAppBadge" in self.navigator) {
    if (badgeCount > 0) self.navigator.setAppBadge(badgeCount).catch(() => {});
    else self.navigator.clearAppBadge().catch(() => {});
  }
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: data.url || "/" } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
    for (const client of windowClients) if (client.url.includes(url) && "focus" in client) return client.focus();
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
