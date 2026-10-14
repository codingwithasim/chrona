"use client";

import { useEffect, useRef } from "react";

/**
 * Simple single-key shortcuts ("space", "r", "l", …). Ignored while
 * typing, inside dialogs, or when a button/link has focus (those
 * already respond to Space and Enter on their own).
 */
export function useShortcuts(map: Record<string, () => void>) {
  const latest = useRef(map);

  useEffect(() => {
    latest.current = map;
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName) ||
          target.closest("[role=dialog]"))
      ) {
        return;
      }

      const key = event.code === "Space" ? "space" : event.key.toLowerCase();
      const action = latest.current[key];

      if (action) {
        event.preventDefault();
        action();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
