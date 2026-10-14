"use client";

import { useEffect, useState } from "react";

import type { ResolvedScene } from "@/stores/scene-store";

import { ambienceOneShot } from "./ambience-sound";
import { announceOutside, type OutsideEventKind } from "./scene-shared";

/*
 * Little things that happen outside every so often: a train rolls
 * through the valley, birds cross the sky, stars fall, a plane
 * blinks past at night, butterflies flutter by in the warm months.
 */

type SkyEvent = {
  id: number;
  kind: OutsideEventKind;
  ltr: boolean;
  y: number;
  x: number;
  duration: number;
};

let eventId = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Rule = {
  kind: OutsideEventKind;
  every: [number, number];
  allowed: (scene: ResolvedScene) => boolean;
  make: () => Pick<SkyEvent, "ltr" | "y" | "x" | "duration">;
};

const RULES: Rule[] = [
  {
    kind: "train",
    every: [35_000, 80_000],
    allowed: () => true,
    make: () => ({ ltr: Math.random() > 0.5, y: 0, x: 0, duration: 13 }),
  },
  {
    kind: "birds",
    every: [22_000, 55_000],
    allowed: (s) => s.time !== "night" && (s.weather === "clear" || s.weather === "drizzle"),
    make: () => ({ ltr: Math.random() > 0.4, y: rand(190, 320), x: 0, duration: rand(13, 18) }),
  },
  {
    kind: "star",
    every: [9_000, 26_000],
    allowed: (s) => s.time === "night" && s.weather === "clear",
    make: () => ({ ltr: true, y: rand(150, 260), x: rand(500, 900), duration: 1.4 }),
  },
  {
    kind: "plane",
    every: [45_000, 90_000],
    allowed: (s) => (s.time === "night" || s.time === "evening") && s.weather !== "storm",
    make: () => ({ ltr: Math.random() > 0.5, y: rand(160, 230), x: 0, duration: 42 }),
  },
  {
    kind: "butterfly",
    every: [25_000, 60_000],
    allowed: (s) =>
      (s.season === "spring" || s.season === "summer") &&
      (s.time === "morning" || s.time === "day") &&
      s.weather === "clear",
    make: () => ({ ltr: Math.random() > 0.5, y: rand(420, 560), x: 0, duration: 11 }),
  },
];

function Train({ event, railY }: { event: SkyEvent; railY: number }) {
  const cars = [0, 72];

  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={event.ltr ? undefined : "translate(140 0) scale(-1 1)"}>
        {/* Headlight beam */}
        <path
          d={`M140 ${railY - 9} L230 ${railY - 16} L230 ${railY - 2} Z`}
          fill="url(#sc-headlight)"
          style={{ opacity: "var(--sc-window-glow)" }}
        />

        {cars.map((x, index) => (
          <g key={x}>
            <rect x={x} y={railY - 19} width="68" height="16" rx="3" fill="var(--sc-train)" />
            <rect x={x + 2} y={railY - 22} width="64" height="4" rx="2" fill="#8a8a98" />
            <rect x={x} y={railY - 8} width="68" height="3" fill="#4f8a6a" />
            {[0, 1, 2, 3, 4].map((window) => (
              <rect
                key={window}
                x={x + 6 + window * 12}
                y={railY - 16}
                width="8"
                height="5"
                rx="1"
                fill="var(--sc-train-window)"
              />
            ))}
            <circle cx={x + 10} cy={railY - 2} r="2" fill="#2c2c3a" />
            <circle cx={x + 58} cy={railY - 2} r="2" fill="#2c2c3a" />
            {index === 1 && (
              <path
                d={`M${x + 30} ${railY - 22} L${x + 38} ${railY - 30} L${x + 46} ${railY - 22}`}
                fill="none"
                stroke="#55556a"
                strokeWidth="1"
              />
            )}
          </g>
        ))}

        <circle cx="139" cy={railY - 10} r="1.8" fill="#fff6c8" />
      </g>
    </g>
  );
}

function Birds({ event }: { event: SkyEvent }) {
  const flock = [
    [0, 0],
    [-14, 8],
    [-26, 15],
    [-13, -7],
    [-27, -13],
  ];

  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y}) ${event.ltr ? "" : "scale(-1 1)"}`}>
        <g className="ev-bob">
          {flock.map(([dx, dy], index) => (
            <g key={index} transform={`translate(${dx} ${dy})`}>
              <path
                d="M-6 0 Q -3 -4 0 0 Q 3 -4 6 0"
                fill="none"
                stroke="var(--sc-bird)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="ev-flap"
                style={{ animationDelay: `${index * 0.08}s` }}
              />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

function ShootingStar({ event }: { event: SkyEvent }) {
  return (
    <g transform={`translate(${event.x} ${event.y}) rotate(22)`}>
      <g className="ev-star" style={{ animationDuration: `${event.duration}s` }}>
        <line x1="-70" y1="0" x2="0" y2="0" stroke="url(#sc-star-trail)" strokeWidth="2" strokeLinecap="round" />
        <circle r="1.8" fill="#ffffff" />
      </g>
    </g>
  );
}

function Plane({ event }: { event: SkyEvent }) {
  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y})`}>
        <circle r="1.6" fill="#ff6b84" className="sc-blink-light" style={{ animationDuration: "1.4s" }} />
        <circle cx="5" r="1.2" fill="#ffffff" className="sc-blink-light" style={{ animationDuration: "1.4s", animationDelay: "0.7s" }} />
      </g>
    </g>
  );
}

function Butterfly({ event }: { event: SkyEvent }) {
  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y})`}>
        <g className="ev-flutter">
          <g className="ev-wing" style={{ transformOrigin: "100% 50%" }}>
            <ellipse cx="-4" cy="-2" rx="4.5" ry="3.5" fill="#fff3a8" />
            <ellipse cx="-3" cy="3" rx="3" ry="2.5" fill="#ffe27a" />
          </g>
          <g className="ev-wing" style={{ transformOrigin: "0% 50%" }}>
            <ellipse cx="4" cy="-2" rx="4.5" ry="3.5" fill="#fff3a8" />
            <ellipse cx="3" cy="3" rx="3" ry="2.5" fill="#ffe27a" />
          </g>
          <rect x="-0.6" y="-4" width="1.2" height="9" rx="0.6" fill="#4a3a2a" />
        </g>
      </g>
    </g>
  );
}

export function SkyEvents({
  scene,
  railY,
}: {
  scene: ResolvedScene;
  railY: number;
}) {
  const [events, setEvents] = useState<SkyEvent[]>([]);

  const { time, season, weather } = scene;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const current = { time, season, weather, dark: time === "evening" || time === "night" };
    const timers = new Set<number>();

    function later(fn: () => void, ms: number) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);

      timers.add(id);
    }

    for (const rule of RULES) {
      const run = () => {
        if (!document.hidden && rule.allowed(current)) {
          const event: SkyEvent = { id: ++eventId, kind: rule.kind, ...rule.make() };

          setEvents((list) => [...list, event]);
          announceOutside(rule.kind);

          if (rule.kind === "train") {
            ambienceOneShot("train");
          }

          later(
            () => setEvents((list) => list.filter((item) => item.id !== event.id)),
            event.duration * 1000 + 300
          );
        }

        later(run, rand(rule.every[0], rule.every[1]));
      };

      later(run, rand(rule.every[0] * 0.15, rule.every[1] * 0.5));
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [time, season, weather]);

  return (
    <g>
      {events.map((event) => {
        switch (event.kind) {
          case "train":
            return <Train key={event.id} event={event} railY={railY} />;
          case "birds":
            return <Birds key={event.id} event={event} />;
          case "star":
            return <ShootingStar key={event.id} event={event} />;
          case "plane":
            return <Plane key={event.id} event={event} />;
          case "butterfly":
            return <Butterfly key={event.id} event={event} />;
        }
      })}
    </g>
  );
}
