"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { useRoomUnlocks } from "@/hooks/use-room";
import { SESSION_EVENT, type SessionDetail } from "@/lib/session-events";
import { playSfx } from "@/lib/sfx";
import { useDialogueStore } from "@/stores/dialogue-store";

import {
  floatStyle,
  OUTSIDE_EVENT,
  pick,
  pivot,
  useParticles,
  useSpeak,
} from "../scene-shared";
import { SKY_EVENT, type SkyEventKind } from "../rain-canvas";
import { useCoatStyle } from "../room-unlocks";
import {
  CatDefs,
  CatWear,
  type Eyes,
  type Look,
  LoafPose,
  type Mouth,
  type Pupil,
  SitPose,
  StretchPose,
  WalkPose,
} from "./art";
import { type Activity, type ArtPose, BED_X, CatBrain, FLOOR_Y, type Pt, SCALE } from "./brain";
import { FieldMouse } from "./mouse";

/** Fire this event to send a mouse across the floor (handy for testing). */
export const MOUSE_EVENT = "chrona:mouse";

const CAT_LINES = [
  "Nya~",
  "Purrrr… five more minutes.",
  "Pets accepted. Carry on.",
  "Did you finish your pomodoro?",
  "The rain is nice, isn't it?",
  "I'm not sleeping. I'm resting my eyes.",
  "Mrrp! That tickles.",
  "Is it snack time? It's always snack time.",
];

/* ------------------------------------------------------------------ */
/* Her bed: a round knitted cushion on the rug                         */
/* ------------------------------------------------------------------ */

const BED = { cx: BED_X, cy: FLOOR_Y - 30, rx: 128, ry: 28, innerRx: 98, innerRy: 15, wall: 26 };

function CatBedBack() {
  const { cx, cy, rx, ry, innerRx, innerRy, wall } = BED;

  return (
    <g style={{ pointerEvents: "none" }}>
      <ellipse cx={cx} cy={cy + wall + 6} rx={rx + 10} ry={ry * 0.5} fill="url(#sc-drop-shadow)" />
      {/* Outer wall and top of the rim */}
      <ellipse cx={cx} cy={cy + wall} rx={rx} ry={ry} fill="#c9b49a" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#e6d6bf" />
      {/* The hollow, a little darker and soft */}
      <ellipse cx={cx} cy={cy + 4} rx={innerRx} ry={innerRy} fill="#cdb89c" />
      <ellipse cx={cx} cy={cy + 7} rx={innerRx - 8} ry={innerRy - 5} fill="#d8c5aa" />
      {/* Knit stitches along the back of the rim */}
      <g fill="none" stroke="#cbb595" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
        {Array.from({ length: 13 }, (_, i) => {
          const a = Math.PI + (i + 0.5) * (Math.PI / 13);
          const x = cx + Math.cos(a) * (rx + innerRx) / 2;
          const y = cy + Math.sin(a) * (ry + innerRy) / 2;
          return <path key={i} d={`M${(x - 3).toFixed(1)} ${(y - 2).toFixed(1)} l3 3 l3 -3`} />;
        })}
      </g>
    </g>
  );
}

/** The front of the rim, drawn over her when she is curled up inside. */
function CatBedFront() {
  const { cx, cy, rx, ry, innerRx, innerRy, wall } = BED;
  const d = [
    `M${cx - rx} ${cy}`,
    `L${cx - rx} ${cy + wall}`,
    `A${rx} ${ry} 0 0 0 ${cx + rx} ${cy + wall}`,
    `L${cx + rx} ${cy}`,
    `A${rx} ${ry} 0 0 0 ${cx + innerRx} ${cy + 4}`,
    `A${innerRx} ${innerRy} 0 0 1 ${cx - innerRx} ${cy + 4}`,
    `A${rx} ${ry} 0 0 0 ${cx - rx} ${cy}`,
    "Z",
  ].join(" ");
  const top = [
    `M${cx - rx} ${cy}`,
    `A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`,
    `A${rx} ${ry} 0 0 0 ${cx + innerRx} ${cy + 4}`,
    `A${innerRx} ${innerRy} 0 0 1 ${cx - innerRx} ${cy + 4}`,
    `A${rx} ${ry} 0 0 0 ${cx - rx} ${cy}`,
    "Z",
  ].join(" ");

  return (
    <g style={{ pointerEvents: "none" }}>
      <path d={d} fill="#c9b49a" />
      <path d={top} fill="#e6d6bf" />
      <path d={`M${cx - innerRx + 6} ${cy + 9} A${innerRx} ${innerRy} 0 0 0 ${cx + innerRx - 6} ${cy + 9}`} fill="none" stroke="#bfa889" strokeWidth="2" opacity="0.6" />
      <g fill="none" stroke="#cbb595" strokeWidth="1.3" strokeLinecap="round" opacity="0.8">
        {Array.from({ length: 13 }, (_, i) => {
          const a = (i + 0.5) * (Math.PI / 13);
          const x = cx + Math.cos(a) * (rx + innerRx) / 2;
          const y = cy + 2 + Math.sin(a) * (ry + innerRy) / 2;
          return <path key={i} d={`M${(x - 3).toFixed(1)} ${(y - 2).toFixed(1)} l3 3 l3 -3`} />;
        })}
      </g>
    </g>
  );
}

/** How far around her she notices the pointer, in scene units. */
const NOTICE = 520;

type View = {
  inBed: boolean;
  pose: ArtPose;
  activity: Activity;
  eyes: Eyes;
  look: Look;
  yawning: boolean;
  earPoke: number;
  legs: "still" | "walk" | "run";
  zzz: Pt | null;
  pupil: Pupil;
  mouth: Mouth;
  kneading: boolean;
  puffed: boolean;
};

/** Bright daylight narrows her pupils; the room says what time it is. */
function daylight() {
  const tod = document.documentElement.dataset.tod;
  return tod === "day" || tod === "morning";
}

function viewOf(brain: CatBrain): View {
  const { activity } = brain;

  let eyes: Eyes = "open";

  if (brain.slowBlinking) eyes = "closed";
  else if (brain.happy) eyes = "happy";
  else if (activity === "sleep" || activity === "groom") eyes = "closed";
  else if (activity === "stretch" || activity === "yawn") eyes = "squint";
  else if (brain.blinking) eyes = "closed";
  else if (activity === "loaf") eyes = "half";

  const gaze = brain.gaze();
  const onTheMove = ["walk", "chase", "crouch", "pounce", "stand", "dash", "startle"].includes(activity);
  let look: Look = onTheMove ? "left" : "viewer";

  if (activity === "groom") {
    look = "down";
  } else if (activity === "look") {
    look = "window";
  } else if (gaze) {
    const [gx, gy] = gaze;
    if (gy < -0.45) look = "window";
    else if (gy > 0.55) look = "down";
    else if (gx < -0.3) look = "left";
    else if (gx > 0.3) look = "right";
    else look = "viewer";
  }

  return {
    inBed: brain.inBed,
    pose: brain.pose,
    activity,
    eyes,
    look,
    yawning: activity === "yawn" || activity === "stretch",
    earPoke: brain.twitches,
    legs: brain.legs,
    zzz: activity === "sleep" ? brain.headSpot() : null,
    pupil: brain.pupil(daylight()),
    mouth: brain.mouth,
    kneading: brain.kneading,
    puffed: brain.puffed,
  };
}

const sameView = (a: View, b: View) =>
  a.inBed === b.inBed &&
  a.pose === b.pose &&
  a.activity === b.activity &&
  a.eyes === b.eyes &&
  a.look === b.look &&
  a.yawning === b.yawning &&
  a.earPoke === b.earPoke &&
  a.legs === b.legs &&
  a.pupil === b.pupil &&
  a.mouth === b.mouth &&
  a.kneading === b.kneading &&
  a.puffed === b.puffed &&
  (a.zzz === null) === (b.zzz === null);

/**
 * Mochi, the fluffy calico. Her brain runs every animation frame to
 * move her around; React only re-renders when her pose or face changes.
 */
export function Mochi({ yarnX, onBat }: { yarnX: number; onBat: () => void }) {
  const root = useRef<SVGGElement | null>(null);
  const mouseLayer = useRef<SVGGElement | null>(null);
  const brainRef = useRef<CatBrain | null>(null);
  const speak = useSpeak();
  const [hearts, burst] = useParticles();
  const pets = useRef(0);
  const coat = useCoatStyle();
  const showsBell = useRoomUnlocks().shows("bell");

  const [view, setView] = useState<View>({
    inBed: true,
    pose: "loaf",
    activity: "sleep",
    eyes: "closed",
    look: "viewer",
    yawning: false,
    earPoke: 0,
    legs: "still",
    zzz: null,
    pupil: "normal",
    mouth: "smile",
    kneading: false,
    puffed: false,
  });

  const latest = useRef({ speak, onBat });
  const burstRef = useRef(burst);

  useEffect(() => {
    burstRef.current = burst;
  });

  useEffect(() => {
    latest.current = { speak, onBat };
  });

  useEffect(() => {
    const node = root.current;
    const layer = mouseLayer.current;

    if (!node || !layer) {
      return;
    }

    const brain = new CatBrain(
      {
        speak: (point, text) => {
          brainRef.current?.talk();
          latest.current.speak(point[0], point[1] - 40, text);
        },
        bat: () => latest.current.onBat(),
        purr: () => playSfx("purr"),
      },
      yarnX
    );
    brainRef.current = brain;

    let mouse: FieldMouse | null = null;
    let shown = viewOf(brain);

    /* Pointer: she watches it, and hunts it if you wiggle it on the floor */
    const pointer = { point: [0, 0] as Pt, at: -10, energy: 0, onFloor: false, blinkedBack: false };
    let clock = 0;

    const svg = node.ownerSVGElement;

    function onPointerMove(event: PointerEvent) {
      const matrix = svg?.getScreenCTM();

      if (!matrix) {
        return;
      }

      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const moved = Math.hypot(p.x - pointer.point[0], p.y - pointer.point[1]);

      pointer.onFloor = p.y > FLOOR_Y - 90 && p.y < FLOOR_Y + 40;

      if (pointer.onFloor && Math.abs(p.x - brain.x) < 380 && clock - pointer.at < 0.3) {
        pointer.energy += Math.min(moved, 60) / 40;
      }

      pointer.point = [p.x, p.y];
      pointer.at = clock;
    }

    function onPointerLeave() {
      pointer.at = -10;
      pointer.onFloor = false;
    }

    function spawnMouse() {
      if (!mouse) {
        mouse = new FieldMouse(layer!, Math.random() < 0.5);
      }
    }

    function onOutside(event: Event) {
      // Something outside: sit up and watch, or at least glance.
      brain.watchWindow((event as CustomEvent<string>).detail ?? "");
    }

    function onSky(event: Event) {
      if ((event as CustomEvent<SkyEventKind>).detail === "lightning") {
        // Light first, then the thunder that makes her jump.
        window.setTimeout(() => brain.startle(), 300);
      }
    }

    // Away for a while? She comes over to say hello when you're back.
    let hiddenAt = 0;
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 3 * 60_000 && brain.greet()) {
        window.setTimeout(() => brain.events.speak(brain.headSpot(), pick(["Mrrp! You're back~", "Oh! Hi hi hi.", "Where did you go? I waited."])), 2600);
      }
    }

    function onSession(event: Event) {
      const { kind } = (event as CustomEvent<SessionDetail>).detail;

      if (kind === "break") {
        brain.settle();
      } else {
        brain.celebrate();
      }
    }

    window.addEventListener(SESSION_EVENT, onSession);
    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener(MOUSE_EVENT, spawnMouse);
    window.addEventListener(OUTSIDE_EVENT, onOutside);
    window.addEventListener(SKY_EVENT, onSky);
    document.addEventListener("visibilitychange", onVisibility);

    let nextMouse = 70 + Math.random() * 80;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;

      /* Mice */
      nextMouse -= dt;

      if (nextMouse <= 0) {
        spawnMouse();
        nextMouse = 150 + Math.random() * 180;
      }

      if (mouse) {
        const hunting = ["crouch", "chase", "pounce"].includes(brain.activity);
        mouse.update(dt, brain.x, hunting);
        mouse.draw();

        if (mouse.done) {
          const hole = mouse.x < 800 ? "bookcase" : "bed";
          mouse.remove();
          mouse = null;

          if (brain.prey?.kind === "mouse") {
            brain.stopHunting();
            brain.events.speak(
              brain.headSpot(),
              pick(["Mrrp?! It got away…", "Next time, mouse. Next time.", `*stares under the ${hole}*`])
            );
          }
        } else {
          brain.hunt({ point: [mouse.x, FLOOR_Y], kind: "mouse" });
          brain.interest = { point: [mouse.x, FLOOR_Y], strength: 1 };
        }
      }

      /* Pointer */
      pointer.energy *= Math.exp(-dt * 1.6);
      const recent = clock - pointer.at < 2.5;
      const near = Math.hypot(pointer.point[0] - brain.x, pointer.point[1] - (FLOOR_Y - 60)) < NOTICE;

      if (!mouse) {
        if (pointer.energy > 2.6 && pointer.onFloor && brain.activity !== "sleep") {
          brain.hunt({ point: pointer.point, kind: "pointer" });
        } else if (brain.prey?.kind === "pointer") {
          if (!recent || !pointer.onFloor) {
            brain.stopHunting();
          } else {
            brain.prey.point = pointer.point;
          }
        }

        brain.interest = recent && near ? { point: pointer.point, strength: 0.85 } : null;
      }

      /* Hold the pointer still by her face and she slow-blinks back */
      const head = brain.headSpot();
      const nearFace = Math.hypot(pointer.point[0] - head[0], pointer.point[1] - head[1]) < 75;

      if (!nearFace) {
        pointer.blinkedBack = false;
      } else if (!pointer.blinkedBack && clock - pointer.at > 1.1 && clock - pointer.at < 8) {
        pointer.blinkedBack = true;

        if (brain.slowBlink()) {
          window.setTimeout(() => burstRef.current(head[0], head[1] - 40, 1, 20), 900);
        }
      }

      const tod = document.documentElement.dataset.tod;
      brain.evening = tod === "evening" || tod === "night";
      brain.update(dt);

      /* Place her; this is cheap, so it happens every frame */
      const facing = Math.abs(brain.facing) < 0.08 ? 0.08 * Math.sign(brain.facing || 1) : brain.facing;
      node.setAttribute(
        "transform",
        `translate(${brain.x.toFixed(1)} ${(FLOOR_Y - brain.lift).toFixed(1)}) scale(${(facing * SCALE).toFixed(3)} ${SCALE})`
      );

      /* Redraw her only when her pose or face changes */
      const next = viewOf(brain);

      if (!sameView(next, shown)) {
        shown = next;
        setView(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(SESSION_EVENT, onSession);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener(MOUSE_EVENT, spawnMouse);
      window.removeEventListener(OUTSIDE_EVENT, onOutside);
      window.removeEventListener(SKY_EVENT, onSky);
      document.removeEventListener("visibilitychange", onVisibility);
      mouse?.remove();
      brainRef.current = null;
    };
    // The yarn stays put; the brain is built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A message box popped up: wake up and look at you.
  const dialogueOpen = useDialogueStore((state) => state.current !== null);

  useEffect(() => {
    const brain = brainRef.current;

    if (dialogueOpen && brain?.activity === "sleep") {
      brain.start("loaf");
    }
  }, [dialogueOpen]);

  function pet() {
    const brain = brainRef.current;

    if (!brain) {
      return;
    }

    const [x, y] = brain.pet();
    brain.talk();
    pets.current += 1;
    burst(x, y - 50, 3, 70);
    speak(
      x,
      y - 56,
      pets.current % 10 === 0 ? `That's ${pets.current} pets! We're best friends now. 🐾` : pick(CAT_LINES)
    );
  }

  const head = { eyes: view.eyes, look: view.look, yawning: view.yawning, earPoke: view.earPoke };
  const wear = useMemo(
    () => ({ bell: showsBell, pupil: view.pupil, mouth: view.mouth, kneading: view.kneading }),
    [showsBell, view.pupil, view.mouth, view.kneading]
  );

  const legStyle = {
    "--leg-speed": view.legs === "run" ? "0.42s" : "0.9s",
    "--leg-play": view.legs === "still" ? "paused" : "running",
  } as CSSProperties;

  return (
    <CatWear.Provider value={wear}>
    <g style={coat}>
      <CatDefs />
      <CatBedBack />

      <g ref={root} transform={`translate(${BED_X + 8} ${FLOOR_Y}) scale(${SCALE} ${SCALE})`} style={legStyle}>
        <g className="sc-hit" onClick={pet}>
          <g className={view.puffed ? "sc-puff" : undefined}>
          <g key={view.pose} className="sc-pose-in">
            {view.pose === "loaf" && <LoafPose {...head} sleeping={view.activity === "sleep"} />}
            {view.pose === "sit" && <SitPose {...head} activity={view.activity} />}
            {view.pose === "stretch" && <StretchPose earPoke={view.earPoke} />}
            {view.pose === "walk" &&
              (view.activity === "crouch" ? (
                // Low to the ground, bottom wiggling before the pounce.
                <g transform="scale(1.07 0.74)">
                  <g className="sc-wiggle" style={pivot("0% 100%")}>
                    <WalkPose {...head} />
                  </g>
                </g>
              ) : view.activity === "pounce" ? (
                <g transform="rotate(9)">
                  <WalkPose {...head} />
                </g>
              ) : (
                <WalkPose {...head} />
              ))}
          </g>
          </g>
        </g>
      </g>

      {view.inBed && <CatBedFront />}

      <g ref={mouseLayer} />

      {view.zzz && (
        <g fill="var(--lavender)" fontWeight="500" style={{ fontFamily: "var(--font-kiwi)", pointerEvents: "none" }}>
          {[
            { dx: 4, dy: -36, size: 16, char: "z" },
            { dx: 8, dy: -40, size: 22, char: "z" },
            { dx: 12, dy: -44, size: 28, char: "Z" },
          ].map((z, index) => (
            <text
              key={index}
              x={Math.round(view.zzz![0] + z.dx)}
              y={Math.round(view.zzz![1] + z.dy)}
              fontSize={z.size}
              className="sc-zzz"
              style={{ ...pivot("50% 50%"), animationDelay: `${index * 1.1}s`, opacity: 0 }}
            >
              {z.char}
            </text>
          ))}
        </g>
      )}

      {hearts.map((heart) => (
        <g key={heart.id} transform={`translate(${heart.x} ${heart.y}) scale(1.8)`}>
          <path
            d="M0 3 C0 -1 -6 -2 -6 2 C -6 6 0 9 0 11 C 0 9 6 6 6 2 C 6 -2 0 -1 0 3 Z"
            fill="var(--ember)"
            className="sc-float-up"
            style={floatStyle(heart.delay)}
          />
        </g>
      ))}
    </g>
    </CatWear.Provider>
  );
}
