"use client";

import { Eye, Volume2, VolumeX } from "lucide-react";

import { AmbienceMenu } from "@/components/shell/ambience-menu";
import { Button } from "@/components/ui/button";
import { useSceneStore } from "@/stores/scene-store";

export function LandingControls() {
  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const setGaze = useSceneStore((state) => state.setGaze);

  return (
    <div className="panel flex items-center gap-0.5 rounded-full p-0.5">
      <AmbienceMenu />

      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full text-foreground/55 hover:text-foreground"
        aria-label={soundOn ? "Mute the room" : "Play rain & ambient sounds"}
        onClick={() => setSoundOn(!soundOn)}
      >
        {soundOn ? <Volume2 className="size-[17px]" strokeWidth={1.7} /> : <VolumeX className="size-[17px]" strokeWidth={1.7} />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full text-foreground/55 hover:text-foreground"
        aria-label="Watch the rain (Esc to return)"
        onClick={() => setGaze(true)}
      >
        <Eye className="size-[17px]" strokeWidth={1.7} />
      </Button>
    </div>
  );
}

export function WatchRainButton() {
  const setGaze = useSceneStore((state) => state.setGaze);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);

  return (
    <button
      type="button"
      onClick={() => {
        setSoundOn(true);
        setGaze(true);
      }}
      className="text-sm text-foreground/55 underline-offset-4 transition-colors duration-300 hover:text-foreground hover:underline"
    >
      or just watch the rain
    </button>
  );
}
