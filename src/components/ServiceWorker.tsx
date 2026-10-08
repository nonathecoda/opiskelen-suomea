"use client";

import { useEffect } from "react";

/** Registers the offline worker and hands it the files this visit already loaded. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    navigator.serviceWorker.ready
      .then((registration) => {
        const urls = performance
          .getEntriesByType("resource")
          .map((entry) => new URL(entry.name))
          .filter((url) => url.origin === location.origin && url.pathname.startsWith("/_next/static/"))
          .map((url) => url.pathname);
        registration.active?.postMessage({ type: "cache-urls", urls });
      })
      .catch(() => {});
  }, []);
  return null;
}
