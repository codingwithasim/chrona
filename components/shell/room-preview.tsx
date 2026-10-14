"use client";

import { useId } from "react";

import { useCoatStyle } from "@/components/scene/room-unlocks";
import type { Season, TimeOfDay, Weather } from "@/lib/scene-time";
import { cn } from "@/lib/utils";

/*
 * A tiny window onto the room's view, redrawn as you choose: the sky for
 * the time of day, hills and trees for the season, and the weather
 * falling across it.
 */

const SKY: Record<TimeOfDay, [string, string]> = {
  morning: ["#f5c4a6", "#bcd6ee"],
  day: ["#6fb2ea", "#d3e9f7"],
  evening: ["#5e5294", "#f3a06e"],
  night: ["#10173a", "#2c3a6e"],
};

const HILLS: Record<Season, { far: string; near: string; canopy: string; dots?: string }> = {
  spring: { far: "#9ccc9f", near: "#77b383", canopy: "#f4b5c7", dots: "#ffffff" },
  summer: { far: "#6fb06f", near: "#4d9459", canopy: "#3f8a4e" },
  autumn: { far: "#dca063", near: "#c2763f", canopy: "#e2733f", dots: "#f6c25a" },
  winter: { far: "#e9eef5", near: "#d3dcea", canopy: "#f6f8fb", dots: "#b9c7d8" },
};

/** Night and evening lay a dusky blue over the land. */
const DUSK: Record<TimeOfDay, number> = { morning: 0.04, day: 0, evening: 0.22, night: 0.5 };

const RAIN = Array.from({ length: 30 }, (_, index) => ({
  x: (index * 37) % 330,
  y: (index * 53) % 150,
  delay: -((index * 0.137) % 0.8),
}));

const FLAKES = Array.from({ length: 26 }, (_, index) => ({
  x: (index * 41) % 330,
  y: (index * 29) % 150,
  r: 1.2 + ((index * 7) % 3) * 0.5,
  delay: -((index * 0.71) % 6),
}));

const STARS = [
  [30, 18], [72, 34], [118, 14], [150, 44], [204, 22], [236, 52], [282, 16], [300, 40], [96, 58], [178, 12],
];

function Celestial({ time, weather }: { time: TimeOfDay; weather: Weather }) {
  const hidden = weather === "storm" ? 0.15 : weather === "drizzle" || weather === "snow" ? 0.45 : 1;

  if (time === "night") {
    return (
      <g opacity={hidden}>
        {STARS.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 1.4 : 0.9} fill="#fff6d6" className="sc-twinkle" style={{ animationDelay: `${-index * 0.4}s` }} />
        ))}
        <circle cx="252" cy="34" r="13" fill="#fbf1d0" />
        <circle cx="258" cy="30" r="12" fill="#10173a" opacity="0.85" />
      </g>
    );
  }

  const sun = {
    morning: { x: 64, y: 74, fill: "#ffd7a8" },
    day: { x: 246, y: 30, fill: "#ffe48a" },
    evening: { x: 268, y: 78, fill: "#ffb36b" },
  }[time];

  return (
    <g opacity={hidden}>
      <circle cx={sun.x} cy={sun.y} r="24" fill={sun.fill} opacity="0.25" />
      <circle cx={sun.x} cy={sun.y} r="12" fill={sun.fill} />
    </g>
  );
}

function Clouds({ weather }: { weather: Weather }) {
  if (weather === "clear") {
    return (
      <g fill="#ffffff" opacity="0.55" className="rp-drift">
        <ellipse cx="110" cy="40" rx="26" ry="7" />
        <ellipse cx="124" cy="35" rx="14" ry="7" />
      </g>
    );
  }

  const tone = weather === "storm" ? "#5b6278" : weather === "snow" ? "#e6ebf3" : "#c3cad8";

  return (
    <g fill={tone} opacity={weather === "storm" ? 0.92 : 0.8} className="rp-drift">
      <ellipse cx="60" cy="22" rx="62" ry="18" />
      <ellipse cx="160" cy="16" rx="70" ry="20" />
      <ellipse cx="270" cy="24" rx="70" ry="18" />
      <ellipse cx="110" cy="34" rx="50" ry="12" opacity="0.7" />
      <ellipse cx="220" cy="36" rx="54" ry="12" opacity="0.7" />
    </g>
  );
}

function Tree({ x, y, scale, season }: { x: number; y: number; scale: number; season: Season }) {
  const hills = HILLS[season];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-1.4" y="-2" width="2.8" height="10" rx="1" fill="#6b4b3e" />
      <circle cx="0" cy="-8" r="9" fill={hills.canopy} />
      <circle cx="-6" cy="-3" r="6" fill={hills.canopy} />
      <circle cx="6" cy="-4" r="6.5" fill={hills.canopy} />
      {hills.dots && (
        <g fill={hills.dots} opacity="0.85">
          <circle cx="-3" cy="-10" r="1.3" />
          <circle cx="4" cy="-7" r="1.1" />
          <circle cx="-5" cy="-3" r="1" />
          <circle cx="2" cy="-13" r="0.9" />
        </g>
      )}
    </g>
  );
}

export function RoomPreview({
  time,
  season,
  weather,
  framed = true,
  className,
}: {
  time: TimeOfDay;
  season: Season;
  weather: Weather;
  /** Draw the window frame, the sill and the cat. Off for a slim banner. */
  framed?: boolean;
  className?: string;
}) {
  const hills = HILLS[season];
  const [top, bottom] = SKY[time];
  const coat = useCoatStyle();
  const id = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 320 150"
      preserveAspectRatio={framed ? undefined : "xMidYMid slice"}
      className={cn("block w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <clipPath id={`${id}-glass`}>
          <rect x="0" y="0" width="320" height="150" rx="14" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-glass)`}>
        <rect width="320" height="150" fill={`url(#${id}-sky)`} />
        {weather === "storm" && <rect width="320" height="150" fill="#2b3046" opacity="0.35" />}

        <Celestial time={time} weather={weather} />
        <Clouds weather={weather} />

        {/* Hills, far and near, and a few trees */}
        <path d="M0 98 C 50 76 96 84 140 92 C 190 100 230 74 320 86 L320 150 L0 150 Z" fill={hills.far} />
        <Tree x={238} y={84} scale={0.7} season={season} />
        <Tree x={262} y={88} scale={0.55} season={season} />
        <path d="M0 118 C 60 102 120 108 170 116 C 220 124 270 104 320 110 L320 150 L0 150 Z" fill={hills.near} />
        <Tree x={52} y={110} scale={1} season={season} />
        <Tree x={78} y={114} scale={0.75} season={season} />
        {/* A little house with a lit window after dark */}
        <g transform="translate(176 104)">
          <path d="M-12 0 L0 -10 L12 0 Z" fill="#b85a4a" />
          <rect x="-10" y="0" width="20" height="13" fill="#f2e6d4" />
          <rect x="-3" y="4" width="6" height="5" fill={time === "night" || time === "evening" ? "#ffd27a" : "#9fb6c9"} />
        </g>

        {/* Dusk over the land */}
        <rect y="70" width="320" height="80" fill="#1a2350" opacity={DUSK[time]} />

        {(weather === "drizzle" || weather === "storm") && (
          <g stroke="#dfe8f5" strokeWidth={weather === "storm" ? 1.3 : 1} strokeLinecap="round" opacity={weather === "storm" ? 0.7 : 0.55}>
            {RAIN.concat(weather === "storm" ? RAIN.map((drop) => ({ ...drop, x: drop.x + 17, delay: drop.delay - 0.3 })) : []).map((drop, index) => (
              <line
                key={index}
                x1={drop.x}
                y1={drop.y - 150}
                x2={drop.x - 3}
                y2={drop.y - 140}
                className="rp-rain"
                style={{ animationDelay: `${drop.delay}s`, animationDuration: weather === "storm" ? "0.55s" : "0.85s" }}
              />
            ))}
          </g>
        )}

        {weather === "storm" && <rect width="320" height="150" fill="#eef2ff" className="rp-flash" />}

        {weather === "snow" && (
          <g fill="#ffffff" opacity="0.9">
            {FLAKES.map((flake, index) => (
              <circle key={index} cx={flake.x} cy={flake.y - 150} r={flake.r} className="rp-snow" style={{ animationDelay: `${flake.delay}s` }} />
            ))}
          </g>
        )}

        {/* The window: frame, cross, and a sill with the cat on it */}
        {framed && (
        <>
        <g fill="none" stroke="#fbf7f0" strokeOpacity="0.95">
          <rect x="1.5" y="1.5" width="317" height="147" rx="13" strokeWidth="3" />
          <path d="M160 0 V150 M0 64 H320" strokeWidth="3.4" />
        </g>
        <rect x="0" y="136" width="320" height="14" fill="#e9dcc7" />
        <rect x="0" y="136" width="320" height="2" fill="#fffaf2" opacity="0.7" />
        <g transform="translate(250 136)" style={coat}>
          {/* A loaf of cat, seen from behind, in her own coat */}
          <ellipse cx="0" cy="-7" rx="15" ry="8" fill="var(--sc-cat)" />
          <circle cx="-11" cy="-13" r="7" fill="var(--sc-cat)" />
          <path d="M-17 -17 L-16 -24 L-12 -19 Z M-9 -19 L-5 -24 L-5 -17 Z" fill="var(--sc-cat-patch)" />
          <ellipse cx="6" cy="-10" rx="7" ry="4.5" fill="var(--sc-cat-patch)" />
          <path d="M14 -4 Q 22 -6 19 -14" stroke="var(--sc-cat)" strokeWidth="3.4" fill="none" strokeLinecap="round" className="rp-tail" />
        </g>
        <g transform="translate(206 136)">
          <rect x="-5" y="-11" width="10" height="11" rx="2" fill="#8fb3a8" />
          <path d="M5 -8 q4 0 4 3.5 q0 3.5 -4 3.5" stroke="#8fb3a8" strokeWidth="1.6" fill="none" />
          {time !== "day" && <path d="M-1 -14 q2 -3 0 -6 M2 -14 q2 -3 0 -6" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" fill="none" className="rp-steam" />}
        </g>
        </>
        )}
      </g>
    </svg>
  );
}
