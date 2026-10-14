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

/** A soft glass card that holds a tool, with a quiet title row. */
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
        "mx-auto my-auto w-full max-w-xl py-4",
        placement === "side" && "xl:mr-[4vw] xl:ml-auto xl:max-w-md",
        className
      )}
    >
      <div className="panel px-5 pt-4 pb-6 sm:px-8 sm:pb-8">
        <header className="mb-4 flex min-h-9 items-center justify-between gap-3">
          {item && (
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <h1 className="truncate font-display text-[15px]">
                {item.title}
              </h1>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {item.jp}
              </span>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <ToolOptions />
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}
