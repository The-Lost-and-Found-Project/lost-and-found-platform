export const UNREAD_COUNT_CHANGED_EVENT = "lf:notification-unread-count-changed";

export function announceUnreadCount(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent(UNREAD_COUNT_CHANGED_EVENT, {
      detail: { unreadCount: Math.max(0, unreadCount) },
    })
  );
}
