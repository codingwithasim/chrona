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
    <div className="panel flex items-center gap-0.5 rounded-full p-1">
      <AmbienceMenu />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label={soundOn ? "Mute the room" : "Play rain & ambient sounds"}
        onClick={() => setSoundOn(!soundOn)}
      >
        {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Watch the rain (Esc to return)"
        onClick={() => setGaze(true)}
      >
        <Eye className="size-5" />
      </Button>
    </div>
  );
}

export function WatchRainButton() {
  const setGaze = useSceneStore((state) => state.setGaze);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);

  return (
    <Button
      size="lg"
      variant="outline"
      onClick={() => {
        setSoundOn(true);
        setGaze(true);
      }}
    >
      <Eye />
      Just watch the rain
    </Button>
  );
}
