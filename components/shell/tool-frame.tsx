"use client";

import type { CSSProperties, ReactNode } from "react";

import { getNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { type PanelStyle, useSettingsStore } from "@/stores/settings-store";

import { PanelStyleContext } from "./panel-style";
import { PopOutButton } from "./pop-out";
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
  /** Overrides the tool's colour, e.g. the pomodoro's current phase. */
  accent?: string;
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
  accent,
  className,
  children,
}: ToolFrameProps) {
  const item = getNavItem(href);
  const Icon = item?.icon;
  const chosen = useSettingsStore((state) => state.panelStyle);
  const style: PanelStyle =
    placement === "side" ? chosen : chosen === "memo" ? "memo" : "card";
  const compact = style === "bar" || style === "corner";

  const title = item && (
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon && (
        <span
          aria-hidden="true"
          className={cn("tool-badge grid shrink-0 place-items-center rounded-xl", compact ? "size-7" : "size-8")}
        >
          <Icon className={compact ? "size-3.5" : "size-4"} strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <h1 className="truncate font-display text-[15px] text-foreground/90">{item.title}</h1>
        {!compact && (
          <p className="truncate text-[10.5px] tracking-[0.2em] text-muted-foreground/80">{item.jp}</p>
        )}
      </div>
    </div>
  );

  const tools = (
    <div className="flex shrink-0 items-center gap-0.5 text-foreground/60">
      {actions}
      {placement === "side" && <PopOutButton />}
      <ToolOptions />
    </div>
  );

  return (
    <PanelStyleContext.Provider value={style}>
      <section
        data-panel={style}
        style={{ "--tool": accent ?? item?.color ?? "var(--primary)" } as CSSProperties}
        className={cn(
          // Only a slide here: fading (or filtering) a parent would stop
          // the glass inside from blurring until the animation finished.
          "ui-rise",
          placement === "side" ? OUTER[style] : "mx-auto my-auto w-full max-w-md py-4",
          className
        )}
      >
        <div
          data-focus-panel
          className={cn(INNER[style], style !== "float" && "ui-fade")}
        >
          {/* A wash of the tool's colour, and a strip of washi tape */}
          {(style === "card" || style === "corner") && <div aria-hidden="true" className="tool-wash" />}
          {style === "card" && <span aria-hidden="true" className="tool-tape" />}

          {style === "float" && (
            // A soft frosted glow behind the time, with no edges.
            <div
              aria-hidden="true"
              data-halo
              className="pointer-events-none absolute -inset-x-12 -inset-y-14 -z-10 bg-white/30 backdrop-blur-[3px] [mask-image:radial-gradient(closest-side,black_50%,transparent)] ui-fade dark:bg-transparent dark:backdrop-blur-none"
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
            <div className={cn("relative", style === "float" && "ui-fade")}>
              <header
                data-recede
                className={cn(
                  "flex items-center justify-between gap-3",
                  compact ? "mb-1 min-h-8" : "mb-4 min-h-10"
                )}
              >
                {title}
                {tools}
              </header>
              {children}
            </div>
          )}
        </div>
      </section>
    </PanelStyleContext.Provider>
  );
}
