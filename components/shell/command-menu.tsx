"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  Eye,
  Hourglass,
  Keyboard,
  Lamp,
  ListPlus,
  MapPin,
  Moon,
  Music2,
  NotebookPen,
  Play,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Timer,
  TimerReset,
  Volume2,
  Wand2,
} from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { locate } from "@/lib/live-weather";
import { navigation, settingsItem } from "@/lib/navigation";
import { useFocusStore } from "@/stores/focus-store";
import { BUILT_IN_PRESETS, useMixerStore } from "@/stores/mixer-store";
import { useMusicStore } from "@/stores/music-store";
import { useRadioStore } from "@/stores/radio-store";
import { useNotesStore } from "@/stores/notes-store";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import { useRoomStore } from "@/stores/room-store";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";

/** Fire this to open the menu from anywhere (e.g. a button). */
export const COMMAND_EVENT = "chrona:command";
export const SHORTCUTS_EVENT = "chrona:shortcuts";

/** "10", "10m", "1h30", "1h 30m", "90 sec" → seconds, or null. */
function parseDuration(text: string) {
  const clean = text.trim().toLowerCase().replace(/^(timer|start|set)\s+/, "");
  const match = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*(m|min|mins|minutes?)?)?\s*(?:(\d+)\s*(s|sec|secs|seconds?))?$/.exec(clean);

  if (!match || !clean || !/\d/.test(clean)) {
    return null;
  }

  const [, hours, minutes, , seconds] = match;
  const total = Math.round(Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0));

  return total > 0 && total <= 24 * 3600 ? total : null;
}

function describe(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  return [hours && `${hours} hour${hours > 1 ? "s" : ""}`, minutes && `${minutes} min`, rest && `${rest} sec`]
    .filter(Boolean)
    .join(" ");
}

function Item({
  icon: Icon,
  color,
  children,
  hint,
  onSelect,
  keywords,
}: {
  icon: typeof Sun;
  color?: string;
  children: ReactNode;
  hint?: string;
  onSelect: () => void;
  keywords?: string[];
}) {
  return (
    <CommandItem onSelect={onSelect} keywords={keywords} className="gap-3 py-2">
      <span
        className="grid size-7 place-items-center rounded-lg"
        style={{
          color: color ?? "var(--foreground)",
          background: `color-mix(in oklab, ${color ?? "var(--foreground)"} 14%, transparent)`,
        }}
      >
        <Icon className="size-3.5" strokeWidth={1.8} />
      </span>
      <span className="flex-1">{children}</span>
      {hint && <CommandShortcut>{hint}</CommandShortcut>}
    </CommandItem>
  );
}

/** Ctrl/⌘ K: jump anywhere, start anything, change the room. */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    const show = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(COMMAND_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(COMMAND_EVENT, show);
    };
  }, []);

  /** Run something and close. */
  const run = (action: () => void) => () => {
    action();
    setOpen(false);
    setQuery("");
  };

  const go = (href: string) => run(() => router.push(href));

  const startTimer = (seconds: number, label?: string) =>
    run(() => {
      const timer = useTimerStore.getState();
      timer.reset();
      timer.setDuration(seconds, label ?? null);
      timer.start();
      router.push("/timer");
    });

  const scene = useSceneStore.getState();
  const duration = parseDuration(query);
  const task = /^(task|todo|add)\s*:?\s+(.+)$/i.exec(query.trim())?.[2];
  const playing = useMusicStore((state) => state.playing);
  const radioOn = useRadioStore((state) => state.on);
  const hasMusic = useMusicStore((state) => state.tracks.length > 0);
  const soundOn = useSceneStore((state) => state.soundOn);
  const catName = useRoomStore((state) => state.catName.trim() || "Mochi");

  return (
    <CommandDialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
      title="Quick menu"
      description="Jump to a tool, start a timer, or change the room"
      className="panel max-w-lg"
    >
      <Command className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Try “25 min”, “rain”, “task: read chapter 5”…"
      />
      <CommandList className="max-h-[min(60vh,26rem)]">
        <CommandEmpty>Nothing here. Try “10 min” or “night”.</CommandEmpty>

        {duration && (
          <CommandGroup heading="Timer">
            <Item icon={Hourglass} color="var(--ember)" onSelect={startTimer(duration)} keywords={[query]}>
              Start a {describe(duration)} timer
            </Item>
          </CommandGroup>
        )}

        {task && (
          <CommandGroup heading="Tasks">
            <Item
              icon={ListPlus}
              color="var(--honey)"
              keywords={[query]}
              onSelect={run(() => {
                useFocusStore.getState().addTask(task);
                router.push("/pomodoro");
              })}
            >
              Add “{task}” to your tasks
            </Item>
          </CommandGroup>
        )}

        <CommandGroup heading="Start">
          <Item
            icon={Timer}
            color="var(--ember)"
            keywords={["pomodoro", "focus", "work"]}
            onSelect={run(() => {
              const pomodoro = usePomodoroStore.getState();
              if (pomodoro.mode !== "focus") pomodoro.setMode("focus");
              pomodoro.start();
              router.push("/pomodoro");
            })}
          >
            Start a focus session
          </Item>
          <Item
            icon={Timer}
            color="var(--mint)"
            keywords={["break", "rest", "pause"]}
            onSelect={run(() => {
              const pomodoro = usePomodoroStore.getState();
              pomodoro.setMode("shortBreak");
              pomodoro.start();
              router.push("/pomodoro");
            })}
          >
            Take a short break
          </Item>
          {[5, 10, 25, 45].map((minutes) => (
            <Item key={minutes} icon={Hourglass} color="var(--ember)" onSelect={startTimer(minutes * 60)} keywords={["timer", "countdown"]}>
              {minutes} minute timer
            </Item>
          ))}
          <Item
            icon={TimerReset}
            color="var(--sky)"
            keywords={["stopwatch", "count up"]}
            onSelect={run(() => {
              useStopwatchStore.getState().start();
              router.push("/stopwatch");
            })}
          >
            Start the stopwatch
          </Item>
        </CommandGroup>

        <CommandGroup heading="Go to">
          {[...navigation, settingsItem].map((item) => (
            <Item key={item.href} icon={item.icon} color={item.color} onSelect={go(item.href)} hint={item.jp} keywords={[item.short, item.jp]}>
              {item.title}
            </Item>
          ))}
        </CommandGroup>

        <CommandGroup heading="The room">
          <Item icon={Sun} color="var(--honey)" onSelect={run(() => scene.setWeather("clear"))} keywords={["weather", "sunny"]}>
            Clear sky
          </Item>
          <Item icon={CloudDrizzle} color="var(--sky)" onSelect={run(() => scene.setWeather("drizzle"))} keywords={["weather", "rain"]}>
            Drizzle
          </Item>
          <Item icon={CloudLightning} color="var(--lavender)" onSelect={run(() => scene.setWeather("storm"))} keywords={["weather", "thunder", "rain"]}>
            Storm
          </Item>
          <Item icon={Snowflake} color="var(--sky)" onSelect={run(() => scene.setWeather("snow"))} keywords={["weather", "winter"]}>
            Snow
          </Item>
          <Item
            icon={MapPin}
            color="var(--mint)"
            keywords={["weather", "live", "real", "outside"]}
            onSelect={run(() => {
              void locate()
                .then((place) => useSceneStore.getState().setLiveWeather(true, place))
                .catch(() => {});
            })}
          >
            Match the weather outside
          </Item>
          <Item icon={Wand2} onSelect={run(() => scene.setTimeOfDay("auto"))} keywords={["time", "clock", "auto"]}>
            Follow my clock
          </Item>
          <Item icon={Sunrise} color="var(--ember)" onSelect={run(() => scene.setTimeOfDay("morning"))} keywords={["time"]}>
            Morning
          </Item>
          <Item icon={Sun} color="var(--honey)" onSelect={run(() => scene.setTimeOfDay("day"))} keywords={["time", "afternoon"]}>
            Day
          </Item>
          <Item icon={Sunset} color="var(--ember)" onSelect={run(() => scene.setTimeOfDay("evening"))} keywords={["time", "dusk"]}>
            Evening
          </Item>
          <Item icon={Moon} color="var(--lavender)" onSelect={run(() => scene.setTimeOfDay("night"))} keywords={["time", "dark"]}>
            Night
          </Item>
          <Item icon={Lamp} color="var(--honey)" onSelect={run(() => scene.toggleLamp())} keywords={["light"]}>
            Desk lamp on or off
          </Item>
          <Item icon={Sparkles} color="var(--honey)" onSelect={run(() => useRoomStore.getState().toggleStarLamp())} keywords={["stars", "night light"]}>
            Star lamp on or off
          </Item>
          <Item icon={Eye} onSelect={run(() => scene.setGaze(true))} keywords={["gaze", "hide", "watch"]} hint="G">
            Watch the rain
          </Item>
          <Item
            icon={Clock3}
            onSelect={run(() => {
              useSettingsStore.getState().setGazeClock(true);
              scene.setGaze(true);
            })}
            keywords={["bedside", "desk clock", "big clock"]}
          >
            Big clock over the room
          </Item>
        </CommandGroup>

        <CommandGroup heading="Sounds">
          <Item icon={Volume2} color="var(--sky)" onSelect={run(() => scene.setSoundOn(!soundOn))} hint="M" keywords={["mute", "sound", "ambience"]}>
            {soundOn ? "Mute the room" : "Play the room's sounds"}
          </Item>
          {BUILT_IN_PRESETS.map((preset) => (
            <Item
              key={preset.id}
              icon={Cloud}
              color="var(--sky)"
              keywords={["mix", "sound", "ambience"]}
              onSelect={run(() => {
                useMixerStore.getState().applyMix(preset.mix);
                scene.setSoundOn(true);
              })}
            >
              Sounds: {preset.name}
            </Item>
          ))}
          <Item icon={Music2} color="var(--honey)" onSelect={run(() => useRadioStore.getState().toggle())} keywords={["lofi", "lo-fi", "radio", "music", "beats"]}>
            {radioOn ? "Stop the lo-fi radio" : "Play the lo-fi radio"}
          </Item>
          {hasMusic && (
            <Item icon={Music2} color="var(--honey)" onSelect={run(() => useMusicStore.getState().toggle())} keywords={["music", "song"]}>
              {playing ? "Pause your music" : "Play your music"}
            </Item>
          )}
          {hasMusic && (
            <Item icon={Play} color="var(--honey)" onSelect={run(() => useMusicStore.getState().next())} keywords={["music", "skip", "next song"]}>
              Next song
            </Item>
          )}
        </CommandGroup>

        <CommandGroup heading="You">
          <Item icon={NotebookPen} color="var(--honey)" onSelect={run(() => useNotesStore.getState().setOpen(true))} hint="N" keywords={["notes", "write"]}>
            Open your notes
          </Item>
          <Item icon={ListPlus} color="var(--honey)" onSelect={() => setQuery("task: ")} keywords={["task", "todo"]}>
            Add a task…
          </Item>
          <Item icon={Sparkles} color="var(--ember)" onSelect={go("/settings")} keywords={["cat", "coat", "name", catName]}>
            Change {catName}&apos;s name or coat
          </Item>
          <Item icon={Keyboard} onSelect={run(() => window.dispatchEvent(new Event(SHORTCUTS_EVENT)))} hint="?" keywords={["keys", "help"]}>
            Keyboard shortcuts
          </Item>
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
