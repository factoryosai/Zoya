/**
 * Handles Web System Notifications and Service Worker registration
 * so Heer can alert Kaushik even if the tab is minimized or in the background.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("Notifications API not supported in this browser.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (e) {
    console.error("Error requesting notification permission:", e);
    return false;
  }
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export function showSystemNotification(title: string, body: string, iconUrl?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: iconUrl || "/favicon.ico",
        badge: "/favicon.ico",
        tag: "heer-reminder-" + Date.now(),
        requireInteraction: true, // Keeps notification visible until user interacts
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error("Failed to show system notification:", e);
    }
  }
}

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Heer ServiceWorker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.warn("ServiceWorker registration skipped or failed:", err);
      });
  }
}
