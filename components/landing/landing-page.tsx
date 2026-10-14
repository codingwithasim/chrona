import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BookOpenText,
  ChevronDown,
  CloudSun,
  Hourglass,
  ShieldCheck,
  Sprout,
} from "lucide-react";

import { AnalyticsSettingsButton } from "@/components/analytics/analytics-settings-button";
import { Logo } from "@/components/shell/hud";
import { buttonVariants } from "@/components/ui/button";
import { COFFEE_URL } from "@/lib/links";
import { navigation } from "@/lib/navigation";

import { LandingControls, WatchRainButton } from "./landing-controls";

const features = [
  {
    icon: CloudSun,
    color: "var(--sky)",
    title: "Seasons & weather",
    text: "Sakura in spring, fireflies in summer, snow in winter. The room follows your clock, and can follow the real weather outside.",
  },
  {
    icon: AudioLines,
    color: "var(--ember)",
    title: "Sounds & your music",
    text: "Rain, café, fireplace and more, mixed your way. Or bring your own songs and the desk radio plays them.",
  },
  {
    icon: Sprout,
    color: "var(--mint)",
    title: "A room that grows",
    text: "A pothos that grows with every session, a bell for the cat, stars on the ceiling. Little things, earned by focusing.",
  },
  {
    icon: BookOpenText,
    color: "var(--honey)",
    title: "Tasks & a journal",
    text: "Say what you're working on, guess how long it'll take, and note what you got done. Your week, as a picture.",
  },
  {
    icon: Hourglass,
    color: "var(--lavender)",
    title: "Keeps on ticking",
    text: "Timers keep running while you wander between tools, even after a reload, and the room opens offline too.",
  },
  {
    icon: ShieldCheck,
    color: "var(--mint)",
    title: "Free & private",
    text: "No account, no ads. Everything stays on your device, with a backup file whenever you want one.",
  },
];

const badge = (color: string) =>
  ({
    color,
    background: `color-mix(in oklab, ${color} 17%, transparent)`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 26%, transparent)`,
  }) as CSSProperties;

export function LandingPage() {
  const tools = navigation.filter((item) => item.href !== "/feedback");
  const year = new Date().getFullYear();

  return (
    <div data-ui className="min-h-dvh">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Logo />
        <LandingControls />
      </header>

      <main>
        {/* Hero: a few quiet words over the room */}
        <section className="relative mx-auto flex min-h-[calc(100dvh-5.5rem)] max-w-6xl flex-col items-center justify-center px-4 pb-10">
          <div className="relative flex flex-col items-center text-center">
            {/* A soft halo so the words read over the scene, without a box */}
            <div
              aria-hidden="true"
              className="absolute -inset-x-28 -inset-y-24 -z-10 bg-background/55 backdrop-blur-md [mask-image:radial-gradient(closest-side,black_45%,transparent)] ui-fade"
            />

            <div className="flex flex-col items-center ui-fade">

            <Link
              href="/settings"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/40 px-3.5 py-1.5 text-[12px] text-foreground/75 ring-1 ring-foreground/10 backdrop-blur-sm transition-colors hover:text-foreground"
            >
              <span className="rounded-full bg-[color-mix(in_oklab,var(--mint)_25%,transparent)] px-2 py-0.5 text-[10px] tracking-wider text-foreground">
                new
              </span>
              Your room now grows as you focus 🌱
            </Link>

            <p className="text-[11px] tracking-[0.6em] text-foreground/50">クロナ</p>
            <h1 className="mt-3 font-display text-6xl font-light leading-none tracking-wide text-foreground/90 sm:text-7xl">
              Chrona
            </h1>

            <p className="mt-6 max-w-sm text-[15px] leading-7 text-foreground/65">
              Timers, focus and alarms in a quiet room, with rain on the
              window and a sleepy cat.
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
              <Link
                href="/timer"
                className={buttonVariants({ size: "lg", className: "rounded-full px-7" })}
              >
                Enter the room
                <ArrowRight strokeWidth={1.8} />
              </Link>

              <WatchRainButton />
            </div>
            </div>
          </div>

          <a
            href="#tools"
            aria-label="See the tools"
            className="absolute bottom-6 flex flex-col items-center text-foreground/40 transition-colors duration-300 float-soft hover:text-foreground/70"
          >
            <ChevronDown className="size-5" strokeWidth={1.6} />
          </a>
        </section>

        {/* The tools */}
        <section id="tools" className="mx-auto max-w-5xl scroll-mt-6 px-4 pb-20">
          <h2 className="mb-6 text-center text-[11px] tracking-[0.4em] text-foreground/50 lowercase">
            on the desk · どうぐ
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  style={{ "--tool": tool.color } as CSSProperties}
                  className="group panel block overflow-hidden p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_50px_-30px_var(--tool)]"
                >
                  <div aria-hidden="true" className="tool-wash" />
                  <span className="relative flex items-center gap-3">
                    <span className="tool-badge grid size-10 place-items-center rounded-2xl">
                      <Icon className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="font-display text-[16px]">{tool.title}</span>
                      <span className="text-[10.5px] tracking-[0.2em] text-muted-foreground">{tool.jp}</span>
                    </span>
                  </span>

                  <span className="relative mt-4 block text-[13px] leading-6 text-muted-foreground">
                    {tool.description}
                  </span>

                  <span className="relative mt-4 inline-flex items-center gap-1 text-xs text-foreground/60 transition-colors duration-300 group-hover:text-foreground">
                    Open
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.8} />
                  </span>
                </Link>
              );
            })}

            <Link
              href="/settings"
              style={{ "--tool": "var(--mint)" } as CSSProperties}
              className="group panel block overflow-hidden p-6 transition-all duration-500 hover:-translate-y-1"
            >
              <div aria-hidden="true" className="tool-wash" />
              <span className="relative flex items-center gap-3">
                <span className="tool-badge grid size-10 place-items-center rounded-2xl">
                  <Sprout className="size-[18px]" strokeWidth={1.8} />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-[16px]">Make it yours</span>
                  <span className="text-[10.5px] tracking-[0.2em] text-muted-foreground">じぶんの へや</span>
                </span>
              </span>
              <span className="relative mt-4 block text-[13px] leading-6 text-muted-foreground">
                Name the cat, pick her coat, and watch the room fill up with
                little things as your focus hours add up.
              </span>
              <span className="relative mt-4 inline-flex items-center gap-1 text-xs text-foreground/60 transition-colors duration-300 group-hover:text-foreground">
                Settings
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.8} />
              </span>
            </Link>
          </div>
        </section>

        {/* What makes it calm */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <h2 className="mb-6 text-center text-[11px] tracking-[0.4em] text-foreground/50 lowercase">
            what&apos;s in the room · へや
          </h2>

          <div className="panel grid gap-x-8 gap-y-7 p-7 sm:grid-cols-2 sm:p-9 lg:grid-cols-3">
            {features.map(({ icon: Icon, color, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl" style={badge(color)}>
                  <Icon className="size-[18px]" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-display text-[15px]">{title}</h3>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8">
        <div className="panel mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} Chrona · made with rain and tea</span>
          <span className="flex items-center gap-4">
            <Link href="/feedback" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
            <a href={COFFEE_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
              Buy me a coffee ☕
            </a>
            <AnalyticsSettingsButton />
          </span>
        </div>
      </footer>
    </div>
  );
}
