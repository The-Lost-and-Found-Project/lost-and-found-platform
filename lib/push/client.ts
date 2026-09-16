export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function activePublicKey() {
  const res = await fetch("/api/push/config", { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.publicKey) throw new Error(body.error || "Push configuration unavailable");
  return String(body.publicKey);
}

function sameKey(existing: ArrayBuffer | null, expected: Uint8Array) {
  if (!existing) return false;
  const current = new Uint8Array(existing);
  if (current.length !== expected.length) return false;
  for (let i = 0; i < current.length; i++) if (current[i] !== expected[i]) return false;
  return true;
}

export async function ensureCurrentPushSubscription(options?: { requestPermission?: boolean }) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { enabled: false, reason: "unsupported" } as const;
  }

  let permission = Notification.permission;
  if (permission === "default" && options?.requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return { enabled: false, reason: permission } as const;

  const publicKey = await activePublicKey();
  const expectedKey = urlBase64ToUint8Array(publicKey);
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  const currentKey = subscription?.options.applicationServerKey ?? null;
  if (subscription && !sameKey(currentKey, expectedKey)) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => undefined);
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: expectedKey,
    });
  }

  const json = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) throw new Error("Failed to save push subscription");

  return { enabled: true, subscription } as const;
}
