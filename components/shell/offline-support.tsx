"use client";

import { useEffect } from "react";

/** Registers the service worker that lets Chrona open without internet. */
export function OfflineSupport() {
  useEffect(() => {
    // Only the built app: in development it would serve stale code.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);

  return null;
}
