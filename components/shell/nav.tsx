"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function NavRail({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-ui
      aria-label="Tools"
      className={cn(
        "panel w-56 shrink-0 flex-col gap-1 self-start p-2",
        className
      )}
    >
      <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-[0.25em] text-muted-foreground">
        メニュー · MENU
      </p>

      {navigation.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl border-2 px-2.5 py-2 transition-all",
              active
                ? "border-ink text-[#1b1530] shadow-cel-sm"
                : "border-transparent hover:translate-x-1 hover:bg-muted"
            )}
            style={
              active
                ? { backgroundColor: item.color }
                : undefined
            }
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink/80 transition-transform group-hover:-rotate-6",
                active ? "bg-white/60" : "bg-card"
              )}
              style={active ? undefined : { color: item.color }}
            >
              <Icon className="size-4" strokeWidth={2.4} />
            </span>

            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold">
                {item.title}
              </span>
              <span
                className={cn(
                  "truncate text-[11px]",
                  active ? "opacity-70" : "text-muted-foreground"
                )}
              >
                {item.jp}
              </span>
            </span>

            {active && (
              <span aria-hidden="true" className="ml-auto text-xs">
                ▶
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function NavDock({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      data-ui
      aria-label="Tools"
      className={cn(
        "panel fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-6 gap-1 rounded-2xl p-1.5",
        className
      )}
    >
      {navigation.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.title}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border-2 py-1.5 transition-all",
              active
                ? "border-ink text-[#1b1530] shadow-cel-sm"
                : "border-transparent text-muted-foreground"
            )}
            style={
              active
                ? { backgroundColor: item.color }
                : undefined
            }
          >
            <Icon className="size-5" strokeWidth={2.3} />
            <span className="max-w-full truncate px-0.5 text-[10px] font-bold">
              {item.jp}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
