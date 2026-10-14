"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type DockProps = {
  orientation: "vertical" | "horizontal";
  className?: string;
};

/** A quiet, icon-only dock of tools. */
export function NavDock({ orientation, className }: DockProps) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      data-ui
      data-chrome
      aria-label="Tools"
      className={cn(
        "panel flex gap-0.5 rounded-full p-1",
        vertical ? "flex-col" : "flex-row",
        className
      )}
    >
      {navigation.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger
              render={
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.title}
                  className={cn(
                    "relative grid size-9 place-items-center rounded-full transition-colors duration-300",
                    active
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-foreground/45 hover:bg-foreground/5 hover:text-foreground/80"
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={1.7} />
                  {active && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute size-1 rounded-full",
                        vertical ? "-left-0.5 top-1/2 -translate-y-1/2" : "-bottom-0.5 left-1/2 -translate-x-1/2"
                      )}
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                </Link>
              }
            />
            <TooltipContent side={vertical ? "right" : "top"}>
              {item.title} · {item.jp}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
