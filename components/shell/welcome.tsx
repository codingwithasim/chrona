"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { say } from "@/stores/dialogue-store";
import { catName } from "@/stores/room-store";
import { useSettingsStore } from "@/stores/settings-store";

let started = false;

/** The cat says hello the first time you come into the room. */
export function Welcome() {
  const pathname = usePathname();

  useEffect(() => {
    // The landing page has its own welcome.
    if (pathname === "/") {
      return;
    }

    function begin() {
      if (started || useSettingsStore.getState().welcomed) {
        return;
      }

      started = true;

      const mac = /Mac|iPhone|iPad/.test(navigator.platform);
      const steps = [
        { text: `Hi, I'm ${catName()}! Welcome to our little room. 🐾`, action: "Hi!" },
        {
          text: "Pick a tool from the dock: a timer, a pomodoro, clocks or alarms. They keep running while you wander around.",
          action: "Next",
        },
        {
          text: `Press ${mac ? "⌘" : "Ctrl"} K any time and type “25 min” to start a timer. Or “rain”, or “night”.`,
          action: "Next",
        },
        {
          text: "Almost everything in the room reacts when you click it, the desk radio plays lo-fi, and the room grows as you focus. Make yourself at home~",
          action: "Let's go",
        },
      ];

      const show = (index: number) => {
        const step = steps[index];

        if (!step) {
          return;
        }

        // Only counts as seen once she's actually said hello.
        useSettingsStore.getState().setWelcomed();

        say({
          text: step.text,
          sticky: true,
          actionLabel: step.action,
          onDismiss: () => window.setTimeout(() => show(index + 1), 250),
        });
      };

      // Moving between tools doesn't cancel it: the layout stays.
      window.setTimeout(() => show(0), 1800);
    }

    if (useSettingsStore.persist.hasHydrated()) {
      begin();
      return;
    }

    return useSettingsStore.persist.onFinishHydration(begin);
  }, [pathname]);

  return null;
}
