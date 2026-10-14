import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Cat,
  ChevronDown,
  CloudSun,
  Hourglass,
  ShieldCheck,
} from "lucide-react";

import { AnalyticsSettingsButton } from "@/components/analytics/analytics-settings-button";
import { Logo } from "@/components/shell/hud";
import { Button } from "@/components/ui/button";
import { navigation } from "@/lib/navigation";

import { LandingControls, WatchRainButton } from "./landing-controls";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "-rotate-1"];

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
        {/* Hero */}
        <section className="mx-auto flex min-h-[calc(100dvh-5.5rem)] max-w-6xl flex-col items-center justify-center px-4 pb-10">
          <div className="panel w-full max-w-2xl px-6 py-10 text-center sm:px-12">
            <p className="inline-flex -rotate-1 items-center gap-2 rounded-full border border-black/10 bg-honey px-3 py-1 text-xs font-bold text-[#1b1530] shadow-cel-sm">
              雨の日の時間 · time tools for rainy days
            </p>

            <h1 className="mt-6 font-display text-6xl leading-none sm:text-7xl">
              <ruby className="cel-text">
                Chrona
                <rt className="pb-2 font-sans text-sm font-bold tracking-[0.5em] text-muted-foreground [text-shadow:none]">
                  クロナ
                </rt>
              </ruby>
            </h1>

            <p className="mx-auto mt-6 max-w-md text-base leading-7 text-muted-foreground">
              A cozy little room of timers, pomodoros, world clocks
              and alarms — with rain on the window and a sleepy cat
              on the desk.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/timer" />}>
                Enter the room
                <ArrowRight />
              </Button>

              <WatchRainButton />
            </div>

            <p className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Cat className="size-4 text-primary" />
              「Welcome in! Make yourself at home, nya~」
            </p>
          </div>

          <a
            href="#tools"
            className="mt-8 flex flex-col items-center gap-1 text-xs font-bold text-foreground/80 float-soft"
          >
            the desk
            <ChevronDown className="size-5" />
          </a>
        </section>

        {/* Tools as sticky notes */}
        <section id="tools" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-20">
          <div className="mb-8 flex justify-center">
            <h2 className="panel rounded-full px-5 py-2 font-display text-xl">
              On the desk
              <span className="ml-2 font-sans text-xs font-bold text-muted-foreground">
                どうぐ
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative block rounded-2xl border border-black/10 p-6 pt-8 text-[#1b1530] shadow-cel-lg transition-transform duration-300 hover:-translate-y-1 hover:rotate-0 ${tilts[index % tilts.length]}`}
                  style={{ backgroundColor: tool.color }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 bg-white/55 backdrop-blur-sm"
                  />

                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl border border-black/10 bg-white/60 transition-transform group-hover:-rotate-6">
                      <Icon className="size-5" strokeWidth={2.4} />
                    </span>
                    <span>
                      <span className="block font-display text-xl leading-tight">
                        {tool.title}
                      </span>
                      <span className="text-xs font-bold opacity-70">{tool.jp}</span>
                    </span>
                  </span>

                  <span className="mt-4 block text-sm leading-6 opacity-85">
                    {tool.description}
                  </span>

                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold">
                    Open
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}

            <div className="relative rotate-1 rounded-2xl border border-dashed border-foreground/20 bg-card/70 p-6 pt-8 backdrop-blur-sm">
              <span className="font-display text-xl">Planner</span>
              <span className="ml-2 text-xs font-bold text-muted-foreground">よてい</span>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Organize your day, gently. Coming soon~
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, jp, text }) => (
              <div key={title} className="panel p-5">
                <Icon className="size-6 text-primary" />
                <h3 className="mt-3 font-display text-base">
                  {title}
                  <span className="ml-2 font-sans text-[11px] font-bold text-muted-foreground">
                    {jp}
                  </span>
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-4 pb-8">
        <div className="panel mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-sm text-muted-foreground sm:flex-row">
          <span>© {year} Chrona · made with rain and tea</span>
          <span className="flex items-center gap-4">
            <Link href="/feedback" className="hover:text-foreground">
              Feedback
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
