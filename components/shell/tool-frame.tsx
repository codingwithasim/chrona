import type { ReactNode } from "react";
import { Cat } from "lucide-react";

import { getNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ToolFrameProps = {
  href: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * The anime-style panel every tool sits in: a sticker title tab,
 * a line from Mochi, and the tool itself.
 */
export function ToolFrame({
  href,
  actions,
  className,
  children,
}: ToolFrameProps) {
  const item = getNavItem(href);

  if (!item) {
    return <>{children}</>;
  }

  const Icon = item.icon;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl pt-6",
        className
      )}
    >
      <div className="panel px-4 pt-10 pb-6 sm:px-8 sm:pb-8">
        <div
          className="absolute -top-5 left-4 flex -rotate-2 items-center gap-2 rounded-xl border-2 border-ink px-3 py-1.5 text-[#1b1530] shadow-cel"
          style={{ backgroundColor: item.color }}
        >
          <Icon className="size-4" strokeWidth={2.5} />
          <h1 className="font-display text-base leading-none">
            {item.title}
          </h1>
          <span className="text-xs font-bold opacity-70">
            {item.jp}
          </span>
        </div>

        {actions && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {actions}
          </div>
        )}

        <p className="mb-6 flex items-start gap-2 pr-24 text-sm text-muted-foreground">
          <Cat className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            「{item.line}」
          </span>
        </p>

        {children}
      </div>
    </section>
  );
}
