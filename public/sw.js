// Service worker for web push notifications. Registered from
// components/PushNotificationToggle.tsx once a member opts in from
// Settings. Keeps running in the background even when the app/browser tab
// is closed, so it can show a notification the moment a push arrives.

self.addEventListener("push", (event) => {
  let data = {
    title: "The Lost and Found Project",
    body: "You have a new notification.",
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // Malformed or missing payload — fall back to the generic message
    // above rather than failing to show anything at all.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
