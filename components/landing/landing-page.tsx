import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  ChevronDown,
  CloudSun,
  Hourglass,
  ShieldCheck,
} from "lucide-react";

import { AnalyticsSettingsButton } from "@/components/analytics/analytics-settings-button";
import { Logo } from "@/components/shell/hud";
import { buttonVariants } from "@/components/ui/button";
import { navigation } from "@/lib/navigation";

import { LandingControls, WatchRainButton } from "./landing-controls";

const features = [
  {
    icon: CloudSun,
    title: "Seasons & weather",
    jp: "きせつ",
    text: "Sakura in spring, fireflies and fireworks in summer, falling leaves in autumn, snow in winter — following your clock.",
  },
  {
    icon: AudioLines,
    title: "Hand-made sounds",
    jp: "おと",
    text: "Rain, birds and cicadas, plus fifteen alarm tones from music boxes to temple bells. All synthesized, nothing to download.",
  },
  {
    icon: Hourglass,
    title: "Keeps on ticking",
    jp: "つづく",
    text: "Timers, pomodoros and stopwatches keep running while you wander between tools — even after a reload.",
  },
  {
    icon: ShieldCheck,
    title: "Free & private",
    jp: "むりょう",
    text: "No account, no ads. Your alarms, cities and settings stay in your browser.",
  },
];

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
          <div className="relative flex flex-col items-center text-center animate-in fade-in-0 duration-1000">
            {/* A soft halo so the words read over the scene, without a box */}
            <div
              aria-hidden="true"
              className="absolute -inset-x-28 -inset-y-24 -z-10 bg-background/55 backdrop-blur-md [mask-image:radial-gradient(closest-side,black_45%,transparent)]"
            />

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
                  className="group panel block p-6 transition-all duration-500 hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-[18px] text-foreground/60" strokeWidth={1.7} />
                    <span className="text-[15px] font-medium">{tool.title}</span>
                    <span className="size-1.5 rounded-full opacity-80" style={{ backgroundColor: tool.color }} />
                  </span>

                  <span className="mt-3 block text-[13px] leading-6 text-muted-foreground">
                    {tool.description}
                  </span>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs text-foreground/50 transition-colors duration-300 group-hover:text-foreground">
                    Open
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.8} />
                  </span>
                </Link>
              );
            })}

            <div className="rounded-[calc(var(--radius)*1.8)] border border-dashed border-foreground/15 p-6">
              <span className="text-[15px] font-medium text-foreground/70">Planner</span>
              <p className="mt-3 text-[13px] leading-6 text-muted-foreground">
                Organize your day, gently. Coming soon.
              </p>
            </div>
          </div>
        </section>

        {/* What makes it calm */}
        <section className="mx-auto max-w-5xl px-4 pb-20">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="size-[18px] text-foreground/50" strokeWidth={1.7} />
                <h3 className="mt-3 text-[13px] font-medium">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 border-t border-foreground/[0.06] px-2 pt-6 text-xs text-muted-foreground/80 sm:flex-row">
          <span>© {year} Chrona · made with rain and tea</span>
          <span className="flex items-center gap-4">
            <Link href="/feedback" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
            <AnalyticsSettingsButton />
          </span>
        </div>
      </footer>
    </div>
  );
}
