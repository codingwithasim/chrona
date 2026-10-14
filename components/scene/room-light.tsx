"use client";

import type { TimeOfDay } from "@/lib/scene-time";
import { useSceneStore } from "@/stores/scene-store";

import {
  castPanes,
  DESK,
  GLASS_RECT,
  hull,
  LIGHT_DIRECTION,
  panes,
  pathOf,
  type Plane,
  type Point,
  poly,
  project,
  ROOM,
  type Vec3,
} from "./projection";
import { LAMP_BULB } from "./room-props";
import { mulberry32 } from "./scene-shared";

const TIMES: TimeOfDay[] = ["morning", "day", "evening", "night"];

const { left: L, right: R, floor: F, ceiling: T, back: B, near: N } = ROOM;

/* ------------------------------------------------------------------ */
/* Geometry, computed once per time of day                             */
/* ------------------------------------------------------------------ */

type LightShape = {
  floor: Point[][];
  desk: Point[][];
  leftWall: Point[][];
  rightWall: Point[][];
  shafts: Point[][];
  floorClip: string;
  shaftFrom: Point;
  shaftTo: Point;
};

function centerOf(points: Point[]): Point {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function lightFor(time: TimeOfDay): LightShape {
  const light = LIGHT_DIRECTION[time];

  const floorPlane: Plane = { axis: "y", value: F };
  const floor = castPanes(light, floorPlane);

  // The desk throws a shadow: only light passing over it reaches the floor.
  const t = (F - DESK.top) / light[1];
  const shadowZ = DESK.front + light[2] * t;

  const shafts = panes()
    .map((pane, index) => {
      const window = pane.map((corner) => project(corner));
      const ground = floor[index];
      return ground ? hull([...window, ...ground]) : null;
    })
    .filter((shape): shape is Point[] => shape !== null);

  const glassCenter: Point = [GLASS_RECT.x + GLASS_RECT.w / 2, GLASS_RECT.y + GLASS_RECT.h / 2];

  return {
    floor,
    desk: castPanes(light, { axis: "y", value: DESK.top }),
    leftWall: light[0] < 0 ? castPanes(light, { axis: "x", value: L }) : [],
    rightWall: light[0] > 0 ? castPanes(light, { axis: "x", value: R }) : [],
    shafts,
    floorClip: poly([L, F, Math.min(shadowZ, B)], [R, F, Math.min(shadowZ, B)], [R, F, N], [L, F, N]),
    shaftFrom: glassCenter,
    shaftTo: floor.length ? centerOf(floor.flat()) : [glassCenter[0], 1000],
  };
}

const LIGHT = Object.fromEntries(TIMES.map((time) => [time, lightFor(time)])) as Record<TimeOfDay, LightShape>;

const DESK_CLIP = poly(
  [DESK.left, DESK.top, DESK.front],
  [DESK.right, DESK.top, DESK.front],
  [DESK.right, DESK.top, B],
  [DESK.left, DESK.top, B]
);

const LEFT_WALL_CLIP = poly([L, T, B], [L, F, B], [L, F, N], [L, T, N]);
const RIGHT_WALL_CLIP = poly([R, T, B], [R, F, B], [R, F, N], [R, T, N]);

const strength = (time: TimeOfDay) =>
  `calc(var(--rm-patch-${time}) * var(--rm-light) * var(--sc-ray-weather))`;

/* ------------------------------------------------------------------ */

/**
 * Window-shaped patches of sun (or moon) on the floor or the desk top. The floor patch is drawn
 * before anything standing on the floor, so the chair and the cat
 * stand in it rather than being painted over.
 */
export function LightPatches({ surface }: { surface: "floor" | "desk" }) {
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        {surface === "desk" ? (
          <clipPath id="rm-clip-desk">
            <path d={DESK_CLIP} />
          </clipPath>
        ) : (
          TIMES.map((time) => (
            <clipPath key={time} id={`rm-clip-floor-${time}`}>
              <path d={LIGHT[time].floorClip} />
            </clipPath>
          ))
        )}
      </defs>

      {TIMES.map((time) => {
        const shape = LIGHT[time];

        return (
          <g
            key={time}
            style={{
              // The floor patch sits under the room's tint, so it is lifted to match.
              opacity: surface === "floor" ? `calc(${strength(time)} * var(--rm-floor-boost, 1))` : strength(time),
              transition: "opacity 1.5s ease",
            }}
            fill="var(--rm-glow)"
          >
            {surface === "floor" ? (
              <g clipPath={`url(#rm-clip-floor-${time})`}>
                {shape.floor.map((points, index) => (
                  <path key={index} d={pathOf(points)} />
                ))}
              </g>
            ) : (
              <g clipPath="url(#rm-clip-desk)">
                {shape.desk.map((points, index) => (
                  <path key={index} d={pathOf(points)} />
                ))}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

/**
 * Low sun lands on the side walls. Drawn with the walls, before the
 * furniture, so bookcases and beds stand in front of it.
 */
export function WallLight() {
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <clipPath id="rm-clip-left">
          <path d={LEFT_WALL_CLIP} />
        </clipPath>
        <clipPath id="rm-clip-right">
          <path d={RIGHT_WALL_CLIP} />
        </clipPath>
      </defs>
      {TIMES.map((time) => {
        const shape = LIGHT[time];

        if (!shape.leftWall.length && !shape.rightWall.length) {
          return null;
        }

        return (
          <g key={time} style={{ opacity: strength(time), transition: "opacity 1.5s ease" }} fill="var(--rm-glow)">
            <g clipPath="url(#rm-clip-left)" opacity="0.75">
              {shape.leftWall.map((points, index) => (
                <path key={index} d={pathOf(points)} />
              ))}
            </g>
            <g clipPath="url(#rm-clip-right)" opacity="0.75">
              {shape.rightWall.map((points, index) => (
                <path key={index} d={pathOf(points)} />
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}

/** Soft shafts of light from the window down to the floor. */
export function LightShafts() {
  return (
    <g style={{ mixBlendMode: "screen" }} filter="url(#rm-soften)">
      <defs>
        <filter id="rm-soften" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        {TIMES.map((time) => {
          const shape = LIGHT[time];
          return (
            <linearGradient
              key={time}
              id={`rm-shaft-${time}`}
              gradientUnits="userSpaceOnUse"
              x1={shape.shaftFrom[0]}
              y1={shape.shaftFrom[1]}
              x2={shape.shaftTo[0]}
              y2={shape.shaftTo[1]}
            >
              <stop offset="0" stopColor="var(--rm-glow)" stopOpacity="0.05" />
              <stop offset="0.3" stopColor="var(--rm-glow)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--rm-glow)" stopOpacity="0" />
            </linearGradient>
          );
        })}
      </defs>

      {TIMES.map((time) => (
        <g
          key={time}
          style={{
            opacity: `calc(var(--rm-patch-${time}) * var(--rm-shaft) * var(--sc-ray-weather))`,
            transition: "opacity 1.5s ease",
          }}
        >
          {LIGHT[time].shafts.map((points, index) => (
            <path key={index} d={pathOf(points)} fill={`url(#rm-shaft-${time})`} />
          ))}
        </g>
      ))}
    </g>
  );
}

/** Dust drifting in the light, for the current time of day. */
export function DustMotes({ time }: { time: TimeOfDay }) {
  const light = LIGHT_DIRECTION[time];
  const random = mulberry32(time.length * 97);
  const glassPanes = panes();

  const motes = Array.from({ length: 18 }, (_, index) => {
    const pane = glassPanes[Math.floor(random() * glassPanes.length)];
    const [a, , c] = [pane[0], pane[1], pane[2]];
    const start: Vec3 = [
      a[0] + random() * (c[0] - a[0]),
      a[1] + random() * (c[1] - a[1]),
      a[2],
    ];
    const t = 0.6 + random() * 3.2;
    const point: Vec3 = [start[0] + light[0] * t, start[1] + light[1] * t, start[2] + light[2] * t];

    if (point[1] < F || point[2] < N) {
      return null;
    }

    const [x, y] = project(point);
    return { id: index, x, y, r: 0.7 + random() * 1.4, delay: -random() * 14, duration: 10 + random() * 8 };
  }).filter(Boolean) as Array<{ id: number; x: number; y: number; r: number; delay: number; duration: number }>;

  return (
    <g style={{ opacity: "calc(var(--rm-light) * var(--sc-ray-weather) * 1.4)" }}>
      {motes.map((mote) => (
        <circle
          key={mote.id}
          cx={mote.x}
          cy={mote.y}
          r={mote.r}
          fill="#fffaf0"
          className="sc-mote"
          style={{ animationDelay: `${mote.delay}s`, animationDuration: `${mote.duration}s` }}
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */

const ROOM_MASK = `M0 0 H1600 V1000 H0 Z M${GLASS_RECT.x} ${GLASS_RECT.y} V${GLASS_RECT.y + GLASS_RECT.h} H${GLASS_RECT.x + GLASS_RECT.w} V${GLASS_RECT.y} Z`;

/** The time of day's ambient light, tinting the room (not the view). */
export function AmbientTint() {
  return (
    <path
      d={ROOM_MASK}
      fillRule="evenodd"
      fill="var(--rm-ambient)"
      style={{
        opacity: "var(--rm-ambient-opacity)",
        mixBlendMode: "multiply",
        transition: "opacity 1.5s ease, fill 1.5s ease",
      }}
    />
  );
}

export function WindowGlow() {
  const cx = GLASS_RECT.x + GLASS_RECT.w / 2;
  const cy = GLASS_RECT.y + GLASS_RECT.h / 2;

  return (
    <g style={{ mixBlendMode: "screen", opacity: "var(--sc-bloom)" }}>
      <radialGradient id="rm-window-glow" cx={cx} cy={cy} r="620" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="var(--rm-glow)" stopOpacity="0.7" />
        <stop offset="1" stopColor="var(--rm-glow)" stopOpacity="0" />
      </radialGradient>
      <path d={ROOM_MASK} fillRule="evenodd" fill="url(#rm-window-glow)" />
    </g>
  );
}

/* The pool of lamplight on the desk: a circle in world space, so it
 * follows the perspective of the desk top, clipped to the desk. */
const POOL_CENTER: Vec3 = [1.4, DESK.top, 9.3];

const LAMP_POOL = pathOf(
  Array.from({ length: 36 }, (_, index) => {
    const angle = (index / 36) * Math.PI * 2;
    return project([
      POOL_CENTER[0] + Math.cos(angle) * 1.15,
      DESK.top,
      POOL_CENTER[2] + Math.sin(angle) * 0.62,
    ]);
  })
);

const DESK_TOP = poly(
  [DESK.left, DESK.top, DESK.front],
  [DESK.right, DESK.top, DESK.front],
  [DESK.right, DESK.top, DESK.back],
  [DESK.left, DESK.top, DESK.back]
);

export function LampLight() {
  const lampOn = useSceneStore((state) => state.lampOn);
  const [bx, by] = project(LAMP_BULB);

  return (
    <g
      style={{
        opacity: lampOn ? "var(--rm-lamp)" : 0,
        transition: "opacity 600ms ease",
        mixBlendMode: "screen",
      }}
    >
      <radialGradient id="rm-lamp-room" cx={bx} cy={by} r="560" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffc983" stopOpacity="0.45" />
        <stop offset="0.3" stopColor="#ffb36b" stopOpacity="0.16" />
        <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rm-lamp-pool" cx="0.5" cy="0.45" r="0.5">
        <stop offset="0" stopColor="#ffe9bd" stopOpacity="0.85" />
        <stop offset="0.45" stopColor="#ffd391" stopOpacity="0.32" />
        <stop offset="1" stopColor="#ffc27a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="rm-lamp-bloom">
        <stop offset="0" stopColor="#fff3d6" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
      </radialGradient>
      <clipPath id="rm-desk-top">
        <path d={DESK_TOP} />
      </clipPath>

      <path d={ROOM_MASK} fillRule="evenodd" fill="url(#rm-lamp-room)" />
      <path d={LAMP_POOL} clipPath="url(#rm-desk-top)" fill="url(#rm-lamp-pool)" />
      <circle cx={bx} cy={by} r="34" fill="url(#rm-lamp-bloom)" />
    </g>
  );
}

/** Color grading, and darkness when the lamp is switched off. */
export function Atmosphere() {
  const lampOn = useSceneStore((state) => state.lampOn);

  return (
    <g>
      <path
        d={ROOM_MASK}
        fillRule="evenodd"
        fill="var(--sc-grade)"
        style={{ opacity: "var(--sc-grade-opacity)", mixBlendMode: "soft-light" }}
      />
      <path
        d={ROOM_MASK}
        fillRule="evenodd"
        fill="#05081a"
        style={{ opacity: lampOn ? 0 : "var(--rm-dark)", transition: "opacity 600ms ease" }}
      />
    </g>
  );
}
