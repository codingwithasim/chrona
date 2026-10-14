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
        "panel flex gap-1 rounded-full p-1.5",
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
                    "grid size-10 place-items-center rounded-full transition-colors",
                    active
                      ? "text-[#1b1530] shadow-cel-sm"
                      : "text-muted-foreground hover:bg-foreground/6 hover:text-foreground"
                  )}
                  style={active ? { backgroundColor: item.color } : undefined}
                >
                  <Icon className="size-[18px]" strokeWidth={2.2} />
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
