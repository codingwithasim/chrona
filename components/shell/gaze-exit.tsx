"use client";

import { EyeOff, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useSceneStore } from "@/stores/scene-store";

/** The only control visible while watching the rain. */
export function GazeExit() {
  const gaze = useSceneStore((state) => state.gaze);
  const setGaze = useSceneStore((state) => state.setGaze);

  if (!gaze) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center gap-2 px-4 animate-in fade-in-0 duration-700">
      <Button
        variant="outline"
        className="h-10 rounded-full px-4 opacity-60 transition-opacity hover:opacity-100"
        onClick={() => setGaze(false)}
      >
        <EyeOff />
        Back to the room
        <kbd className="ml-1 rounded-md border px-1.5 text-[10px] text-muted-foreground">
          Esc
        </kbd>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full opacity-60 transition-opacity hover:opacity-100"
        aria-label="Full screen (F)"
        title="Full screen (F)"
        onClick={toggleFullscreen}
      >
        <Maximize2 className="size-4" strokeWidth={1.7} />
      </Button>
    </div>
  );
}
