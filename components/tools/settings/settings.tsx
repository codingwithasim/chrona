"use client";

import { type ReactNode, useState } from "react";
import { Bell, Clock3, HardDrive, Keyboard, LayoutPanelLeft, Music2, Play, Sofa } from "lucide-react";

import { PanelStylePicker } from "@/components/shell/panel-style";
import { RoomControls } from "@/components/shell/room-controls";
import { SoundPicker } from "@/components/shell/sound-picker";
import { ToolFrame } from "@/components/shell/tool-frame";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { requestNotifications } from "@/lib/notify";
import { SHORTCUTS } from "@/lib/shortcuts";
import { previewSound } from "@/lib/sounds";
import { useSceneStore } from "@/stores/scene-store";

import { YourData } from "./your-data";
import {
  type SoundSlot,
  soundSlots,
  useSettingsStore,
} from "@/stores/settings-store";

function Section({
  icon: Icon,
  title,
  jp,
  children,
}: {
  icon: typeof Music2;
  title: string;
  jp: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-foreground/[0.06] pt-7 first:border-t-0 first:pt-0">
      <h2 className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.7} />
        {title}
        <span className="font-sans text-[11px] text-muted-foreground/60">
          {jp}
        </span>
      </h2>
      {children}
    </section>
  );
}

export function SettingsPanel() {
  const sounds = useSettingsStore((state) => state.sounds);
  const setSound = useSettingsStore((state) => state.setSound);
  const toneVolume = useSettingsStore((state) => state.toneVolume);
  const setToneVolume = useSettingsStore((state) => state.setToneVolume);

  const hour24 = useSceneStore((state) => state.hour24);
  const toggleHour24 = useSceneStore((state) => state.toggleHour24);

  const keepAwake = useSettingsStore((state) => state.keepAwake);
  const setKeepAwake = useSettingsStore((state) => state.setKeepAwake);

  const focusFade = useSettingsStore((state) => state.focusFade);
  const setFocusFade = useSettingsStore((state) => state.setFocusFade);

  const notifyOn = useSettingsStore((state) => state.notify);
  const setNotify = useSettingsStore((state) => state.setNotify);
  const [notifyBlocked, setNotifyBlocked] = useState(false);

  async function handleNotify(enabled: boolean) {
    if (!enabled) {
      setNotify(false);
      return;
    }

    const allowed = await requestNotifications();

    setNotify(allowed);
    setNotifyBlocked(!allowed);
  }

  return (
    <ToolFrame href="/settings">
      <div className="space-y-8">
        <Section icon={LayoutPanelLeft} title="Panel style" jp="かたち">
          <p className="text-[12px] text-muted-foreground">
            How the timer, pomodoro and stopwatch sit over the room.
          </p>
          <PanelStylePicker />

          <label className="flex items-center justify-between gap-3 pt-2 text-[13px] font-medium">
            <span>
              Focus mode
              <span className="block text-[12px] font-normal text-muted-foreground">
                While counting, fade the panel to just the time when you&apos;re not using it.
              </span>
            </span>
            <Switch checked={focusFade} onCheckedChange={setFocusFade} />
          </label>
        </Section>

        <Section icon={Music2} title="Sounds" jp="おと">
          <div className="flex flex-wrap items-center gap-3 py-1">
            <span className="text-[13px] text-foreground/80">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={toneVolume}
              aria-label="Alarm and notification volume"
              onChange={(event) => setToneVolume(Number(event.target.value))}
              className="min-w-32 flex-1 accent-(--primary)"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => previewSound(sounds.timer, toneVolume)}
            >
              <Play />
              Test
            </Button>
          </div>

          {(Object.keys(soundSlots) as SoundSlot[]).map((slot) => (
            <div key={slot} className="space-y-3">
              <div>
                <p className="text-[13px] font-medium">
                  {soundSlots[slot].label}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {soundSlots[slot].jp}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {soundSlots[slot].description}
                </p>
              </div>

              <SoundPicker
                value={sounds[slot]}
                onChange={(sound) => setSound(slot, sound)}
              />
            </div>
          ))}
        </Section>

        <Section icon={Sofa} title="The room" jp="へや">
          <RoomControls />
        </Section>

        <Section icon={Bell} title="Notifications" jp="おしらせ">
          <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
            <span>
              Notify me in the background
              <span className="block text-xs font-normal text-muted-foreground">
                When a timer, pomodoro or alarm finishes while Chrona is in another tab.
              </span>
            </span>
            <Switch checked={notifyOn} onCheckedChange={(value) => void handleNotify(value)} />
          </label>

          {notifyBlocked && (
            <p className="text-xs text-destructive">
              Notifications are blocked for this site. You can allow them in your
              browser&apos;s site settings.
            </p>
          )}
        </Section>

        <Section icon={Clock3} title="Clock" jp="とけい">
          <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
            24-hour time
            <Switch checked={hour24} onCheckedChange={toggleHour24} />
          </label>

          <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
            <span>
              Keep the screen on
              <span className="block text-xs font-normal text-muted-foreground">
                While a timer, pomodoro or stopwatch is running.
              </span>
            </span>
            <Switch checked={keepAwake} onCheckedChange={setKeepAwake} />
          </label>
        </Section>

        <Section icon={HardDrive} title="Your data" jp="データ">
          <YourData />
        </Section>

        <Section icon={Keyboard} title="Shortcuts" jp="ショートカット">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {SHORTCUTS.map(([key, description]) => (
              <div key={key} className="contents">
                <dt>
                  <kbd className="rounded-md bg-foreground/[0.06] px-2 py-0.5 font-sans text-xs">
                    {key}
                  </kbd>
                </dt>
                <dd className="text-muted-foreground">{description}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </ToolFrame>
  );
}
