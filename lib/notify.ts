"use client";

import { useSettingsStore } from "@/stores/settings-store";

/**
 * Shows a desktop notification when the tab is in the background,
 * if the user turned them on and granted permission.
 */
export function notify(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (!useSettingsStore.getState().notify || Notification.permission !== "granted") {
    return;
  }

  if (!document.hidden) {
    return;
  }

  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      tag: "chrona",
    });
  } catch {
    // Some browsers only allow notifications from a service worker.
  }
}

/** Asks for permission; resolves to whether notifications can be shown. */
export async function requestNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  return (await Notification.requestPermission()) === "granted";
}
