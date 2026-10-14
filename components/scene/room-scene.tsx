"use client";

import { useEffect, useRef, useState } from "react";

import { useMounted } from "@/hooks/use-now";
import { playSfx } from "@/lib/sfx";
import { useResolvedScene } from "@/stores/scene-store";

import { Landscape } from "./landscape";
import { RainCanvas, triggerSky } from "./rain-canvas";
import type { TimeOfDay } from "@/lib/scene-time";

import {
  CurtainsAndLights,
  PendantLamp,
  RoomShell,
  WindowUnit,
} from "./room-architecture";
import { Cat } from "./room-cat";
import { RoomDefs } from "./room-defs";
import {
  Bed,
  Bookcase,
  Chair,
  Corkboard,
  Desk,
  Dresser,
  FloorClutter,
  Painting,
  Plush,
  Rug,
  WallClock,
  WallShelf,
} from "./room-furniture";
import {
  AmbientTint,
  Atmosphere,
  DustMotes,
  LampLight,
  LightPatches,
  LightShafts,
  WallLight,
  WindowGlow,
} from "./room-light";
import {
  Candle,
  DeskLamp,
  FlipClock,
  Furin,
  Mug,
  Notebook,
  PenCup,
  Persimmons,
  Radio,
  SillPlant,
  SillVase,
  Succulent,
  TeruTeruBozu,
  YarnBall,
} from "./room-props";
import { SpeakContext, svgProps } from "./scene-shared";

/*
 * A cozy room with a window onto the countryside, drawn in a fixed
 * 1600×1000 space and scaled to cover the viewport. The landscape
 * sits behind the glass, the weather canvas between, and the room
 * in front. Almost everything in the room reacts when clicked.
 */

type Bubble = { id: number; x: number; y: number; text: string };

/** Mochi's spot on the rug, nudged left of the tool card. */
const CAT_OFFSET = -120;

function SpeechBubble({ bubble }: { bubble: Bubble }) {
  const width = 340;
  const height = 150;

  return (
    <foreignObject
      x={bubble.x - width / 2}
      y={bubble.y - height}
      width={width}
      height={height}
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      <div className="flex h-full items-end justify-center">
        <div
          className="relative max-w-[320px] animate-in rounded-2xl bg-[#fffaf2]/95 px-4 py-2.5 text-center text-[16px] leading-snug text-[#3b2e4a] shadow-[0_8px_24px_-10px_rgb(40_20_60/0.5)] ring-1 ring-black/5 duration-200 fade-in-0 zoom-in-90 slide-in-from-bottom-2"
          style={{ fontFamily: "var(--font-kiwi)" }}
        >
          {bubble.text}
          <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-[#fffaf2]/95" />
        </div>
      </div>
    </foreignObject>
  );
}

function RoomLayer({
  onKnock,
  time,
}: {
  onKnock: () => void;
  time: TimeOfDay | null;
}) {
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const bubbleTimer = useRef<number | null>(null);
  const [yarnKick, setYarnKick] = useState(0);

  function speak(x: number, y: number, text: string) {
    const id = Date.now();

    setBubble({ id, x, y, text });

    if (bubbleTimer.current !== null) {
      window.clearTimeout(bubbleTimer.current);
    }

    bubbleTimer.current = window.setTimeout(() => {
      setBubble((current) => (current?.id === id ? null : current));
    }, 4000);
  }

  return (
    <SpeakContext.Provider value={speak}>
      <svg {...svgProps} style={{ pointerEvents: "none" }}>
        <RoomDefs />

        {/* The room, from the back wall forward */}
        <RoomShell />
        <WallLight />
        <Painting />
        <WallClock />
        <Corkboard />

        <WindowUnit onKnock={onKnock} />
        <SillPlant />
        <Candle />
        <SillVase />
        <Persimmons />
        <TeruTeruBozu />
        <Furin />
        <CurtainsAndLights />
        <PendantLamp />

        <Bookcase />
        <WallShelf />

        <Desk />
        <PenCup />
        <Succulent />
        <Radio />
        <FlipClock />
        <DeskLamp />
        <Notebook />
        <Mug />

        <Bed />
        <Plush />
        <Dresser />
        <Rug />
        <FloorClutter />
        <Chair />
        <YarnBall kick={yarnKick} offsetX={CAT_OFFSET} />
        <Cat offsetX={CAT_OFFSET} onBat={() => setYarnKick((value) => value + 1)} />

        {/* Light, applied like a painter would */}
        <AmbientTint />
        <WindowGlow />
        <LightPatches />
        <LightShafts />
        {time && <DustMotes time={time} />}
        <LampLight />
        <Atmosphere />

        {bubble && <SpeechBubble key={bubble.id} bubble={bubble} />}
      </svg>
    </SpeakContext.Provider>
  );
}

/** A soft watercolor-paper texture over everything. */
function PaperTexture() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Soft blotches: tiny noise scaled up with smoothing.
    const small = document.createElement("canvas");
    small.width = 32;
    small.height = 32;

    const smallCtx = small.getContext("2d");

    if (smallCtx) {
      const blotches = smallCtx.createImageData(32, 32);

      for (let i = 0; i < blotches.data.length; i += 4) {
        const value = 110 + Math.random() * 40;
        blotches.data[i] = value;
        blotches.data[i + 1] = value;
        blotches.data[i + 2] = value;
        blotches.data[i + 3] = 255;
      }

      smallCtx.putImageData(blotches, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(small, 0, 0, size, size);
    }

    // Fine grain on top.
    const image = ctx.getImageData(0, 0, size, size);

    for (let i = 0; i < image.data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 60;
      image.data[i] += grain;
      image.data[i + 1] += grain;
      image.data[i + 2] += grain;
    }

    ctx.putImageData(image, 0, 0);
    element.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light"
    />
  );
}

export function RoomScene() {
  const glassRef = useRef<SVGRectElement | null>(null);

  const mounted = useMounted();
  const scene = useResolvedScene();

  const [flashKey, setFlashKey] = useState(0);

  /** Clicking the window does something different in every weather. */
  function knock() {
    if (scene.weather === "clear") {
      triggerSky("firework");
      window.setTimeout(() => playSfx("firework"), 900);
      return;
    }

    if (scene.weather === "snow") {
      triggerSky("gust");
      playSfx("rustle");
      return;
    }

    triggerSky("lightning");
    setFlashKey((value) => value + 1);

    // Light travels faster than sound.
    window.setTimeout(() => playSfx("thunder"), 280);
  }

  return (
    <div
      data-scene
      className="fixed inset-0 z-0 overflow-hidden bg-background select-none"
    >
      <Landscape glassRef={glassRef} scene={mounted ? scene : null} />

      {mounted && (
        <RainCanvas
          targetRef={glassRef}
          weather={scene.weather}
          season={scene.season}
          time={scene.time}
        />
      )}

      <RoomLayer onKnock={knock} time={mounted ? scene.time : null} />

      {flashKey > 0 && (
        <div
          key={flashKey}
          aria-hidden="true"
          className="sc-room-flash pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgb(225 232 255 / 0.85), rgb(225 232 255 / 0.15) 70%)",
          }}
        />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 45%, var(--sc-vignette) 100%)",
        }}
      />

      <PaperTexture />
    </div>
  );
}
