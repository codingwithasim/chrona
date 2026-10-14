"use client";

import type { ReactNode } from "react";

import { getNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { type PanelStyle, useSettingsStore } from "@/stores/settings-store";

import { PanelStyleContext } from "./panel-style";
import { ToolOptions } from "./tool-options";

type ToolFrameProps = {
  href: string;
  actions?: ReactNode;
  /**
   * "side" is for the focus tools (timer, pomodoro, stopwatch): they
   * follow the chosen panel style and sit to the right on wide screens.
   * Other pages always use a card, which their lists need.
   */
  placement?: "center" | "side";
  className?: string;
  children: ReactNode;
};

const OUTER: Record<PanelStyle, string> = {
  float: "mx-auto my-auto w-full max-w-md py-4 xl:mr-[5vw] xl:ml-auto xl:max-w-sm",
  card: "mx-auto my-auto w-full max-w-md py-4 xl:mr-[5vw] xl:ml-auto xl:max-w-sm",
  memo: "mx-auto my-auto w-full max-w-[22rem] py-6 xl:mr-[6vw] xl:ml-auto",
  bar: "fixed inset-x-0 bottom-24 z-20 mx-auto w-fit max-w-[calc(100vw-1.5rem)] lg:bottom-6 xl:right-[7vw] xl:left-auto xl:mx-0",
  corner: "fixed right-4 bottom-24 z-20 w-[15rem] lg:right-6 lg:bottom-6",
};

const INNER: Record<PanelStyle, string> = {
  float: "relative isolate px-6 pt-4 pb-7 sm:px-8",
  card: "panel px-6 pt-4 pb-7 sm:px-8 sm:pb-8",
  memo: "memo px-6 pt-7 pb-7 sm:px-7",
  bar: "panel flex items-center gap-4 rounded-full py-2 pr-2 pl-5",
  corner: "panel rounded-3xl px-4 pt-3 pb-4",
};

/** Holds a tool, in whichever style was chosen. */
export function ToolFrame({
  href,
  actions,
  placement = "center",
  className,
  children,
}: ToolFrameProps) {
  const item = getNavItem(href);
  const chosen = useSettingsStore((state) => state.panelStyle);
  const style: PanelStyle =
    placement === "side" ? chosen : chosen === "memo" ? "memo" : "card";
  const compact = style === "bar" || style === "corner";

  const title = item && (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full opacity-80"
        style={{ backgroundColor: item.color }}
      />
      <h1 className="truncate text-[13px] font-medium tracking-wide text-foreground/70">
        {item.title}
      </h1>
      {!compact && (
        <span className="hidden text-[11px] text-muted-foreground/60 sm:inline">
          {item.jp}
        </span>
      )}
    </div>
  );

  const tools = (
    <div className="flex shrink-0 items-center gap-0.5 text-foreground/60">
      {actions}
      <ToolOptions />
    </div>
  );

  return (
    <PanelStyleContext.Provider value={style}>
      <section
        data-panel={style}
        className={cn(
          "animate-in fade-in-0 slide-in-from-bottom-2 duration-700",
          placement === "side" ? OUTER[style] : "mx-auto my-auto w-full max-w-md py-4",
          className
        )}
      >
        <div data-focus-panel className={INNER[style]}>
          {style === "float" && (
            // A soft frosted glow behind the time, with no edges.
            <div
              aria-hidden="true"
              data-halo
              className="pointer-events-none absolute -inset-x-12 -inset-y-14 -z-10 bg-white/30 backdrop-blur-[3px] [mask-image:radial-gradient(closest-side,black_50%,transparent)] dark:bg-transparent dark:backdrop-blur-none"
            />
          )}

          {style === "bar" ? (
            <>
              <div data-recede className="hidden sm:block">
                {title}
              </div>
              {children}
              <div data-recede>{tools}</div>
            </>
          ) : (
            <>
              <header
                data-recede
                className={cn(
                  "flex items-center justify-between gap-3",
                  compact ? "mb-1 min-h-8" : "mb-2 min-h-9"
                )}
              >
                {title}
                {tools}
              </header>
              {children}
            </>
          )}
        </div>
      </section>
    </PanelStyleContext.Provider>
  );
}
