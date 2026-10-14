import type { ReactNode } from "react";

import { getNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { ToolOptions } from "./tool-options";

type ToolFrameProps = {
  href: string;
  actions?: ReactNode;
  /**
   * "side" keeps compact tools to the right on wide screens,
   * so the window stays in view.
   */
  placement?: "center" | "side";
  className?: string;
  children: ReactNode;
};

/** A soft, see-through card that holds a tool, with a quiet title row. */
export function ToolFrame({
  href,
  actions,
  placement = "center",
  className,
  children,
}: ToolFrameProps) {
  const item = getNavItem(href);

  return (
    <section
      className={cn(
        "mx-auto my-auto w-full max-w-md py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-700",
        placement === "side" && "xl:mr-[5vw] xl:ml-auto xl:max-w-sm",
        className
      )}
    >
      <div data-focus-panel className="panel px-6 pt-4 pb-7 sm:px-8 sm:pb-8">
        <header data-recede className="mb-2 flex min-h-9 items-center justify-between gap-3">
          {item && (
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full opacity-80"
                style={{ backgroundColor: item.color }}
              />
              <h1 className="truncate text-[13px] font-medium tracking-wide text-foreground/70">
                {item.title}
              </h1>
              <span className="hidden text-[11px] text-muted-foreground/60 sm:inline">
                {item.jp}
              </span>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-0.5 text-foreground/60">
            {actions}
            <ToolOptions />
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}
