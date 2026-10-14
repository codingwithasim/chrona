"use client";

import { Minus, Plus, RefreshCcw, Sparkles } from "lucide-react";

import { SoundPicker } from "@/components/shell/sound-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  type PomodoroSettings,
  pomodoroModes,
  usePomodoroStore,
} from "@/stores/pomodoro-store";
import { useSettingsStore } from "@/stores/settings-store";

type NumberSetting = "focus" | "shortBreak" | "longBreak" | "cyclesBeforeLongBreak";

const steppers: Array<{
  key: NumberSetting;
  label: string;
  jp: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "focus", label: "Focus", jp: pomodoroModes.focus.jp, unit: "min", min: 5, max: 120, step: 5 },
  { key: "shortBreak", label: "Short break", jp: pomodoroModes.shortBreak.jp, unit: "min", min: 1, max: 30, step: 1 },
  { key: "longBreak", label: "Long break", jp: pomodoroModes.longBreak.jp, unit: "min", min: 5, max: 60, step: 5 },
  { key: "cyclesBeforeLongBreak", label: "Sessions per set", jp: "セット", unit: "", min: 2, max: 8, step: 1 },
];

function Stepper({
  value,
  min,
  max,
  step,
  unit,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="icon-xs"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus />
      </Button>
      <span className="w-14 text-center font-display text-sm">
        {value}
        {unit && <span className="ml-0.5 font-sans text-[10px] text-muted-foreground">{unit}</span>}
      </span>
      <Button
        variant="outline"
        size="icon-xs"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus />
      </Button>
    </div>
  );
}

export function PomodoroControls() {
  const settings = usePomodoroStore((state) => state.settings);
  const updateSettings = usePomodoroStore((state) => state.updateSettings);
  const reset = usePomodoroStore((state) => state.reset);

  const sound = useSettingsStore((state) => state.sounds.pomodoro);
  const setSound = useSettingsStore((state) => state.setSound);

  function toggle(key: keyof Pick<PomodoroSettings, "autoStartBreaks" | "autoStartFocus">) {
    updateSettings({ [key]: !settings[key] });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Lengths
        </p>

        {steppers.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">
              {item.label}
              <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                {item.jp}
              </span>
            </span>
            <Stepper
              value={settings[item.key]}
              min={item.min}
              max={item.max}
              step={item.step}
              unit={item.unit}
              label={item.label}
              onChange={(value) => updateSettings({ [item.key]: value })}
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Flow
        </p>

        <label className="flex items-center justify-between gap-3 text-sm font-bold">
          Start breaks automatically
          <Switch
            checked={settings.autoStartBreaks}
            onCheckedChange={() => toggle("autoStartBreaks")}
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm font-bold">
          Start focus automatically
          <Switch
            checked={settings.autoStartFocus}
            onCheckedChange={() => toggle("autoStartFocus")}
          />
        </label>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Sound
        </p>
        <SoundPicker
          compact
          value={sound}
          onChange={(value) => setSound("pomodoro", value)}
        />
      </section>

      <Button variant="outline" onClick={reset}>
        <RefreshCcw />
        Reset sessions
      </Button>

      <div className="flex gap-2 rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-honey" />
        <span>
          The pomodoro keeps running while you use other tools — even
          if you reload the page.
        </span>
      </div>
    </div>
  );
}
