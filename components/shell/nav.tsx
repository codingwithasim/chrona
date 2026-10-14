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

/** The dock of tools: an icon and a short name each, the open one in its colour. */
export function NavDock({ orientation, className }: DockProps) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      data-ui
      aria-label="Tools"
      className={cn(
        "panel flex gap-0.5 p-1.5",
        vertical ? "flex-col rounded-[1.6rem]" : "flex-row rounded-[1.4rem]",
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
                    "group relative flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300",
                    vertical ? "h-[3.4rem] w-[3.6rem]" : "h-[3.2rem] w-[3.45rem]",
                    active ? "text-foreground" : "text-foreground/55 hover:bg-foreground/[0.05] hover:text-foreground"
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: `color-mix(in oklab, ${item.color} 18%, transparent)`,
                          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${item.color} 24%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <Icon
                    className="size-[18px] transition-transform duration-300 group-hover:-translate-y-px"
                    strokeWidth={1.7}
                    style={active ? { color: item.color } : undefined}
                  />
                  <span className="max-w-full truncate text-[9.5px] leading-none">
                    {item.short}
                  </span>
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
