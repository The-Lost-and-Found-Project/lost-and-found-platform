import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bellSource = await readFile(
  new URL("../components/NotificationBell.tsx", import.meta.url),
  "utf8"
);
const notificationsSource = await readFile(
  new URL("../components/NotificationsClient.tsx", import.meta.url),
  "utf8"
);

test("notification reads update the mounted unread badge immediately", () => {
  assert.match(
    bellSource,
    /addEventListener\(\s*UNREAD_COUNT_CHANGED_EVENT/
  );
  assert.match(notificationsSource, /announceUnreadCount\(unreadCount - 1\)/);
  assert.match(
    notificationsSource,
    /event\.preventDefault\(\);[\s\S]*await markOneRead\(notification\);[\s\S]*router\.push/
  );
});

test("marking all notifications read clears the badge", () => {
  assert.match(notificationsSource, /announceUnreadCount\(0\)/);
});
