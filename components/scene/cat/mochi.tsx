"use client";

import { useEffect, useRef } from "react";

import { playSfx } from "@/lib/sfx";
import { useDialogueStore } from "@/stores/dialogue-store";

import {
  floatStyle,
  OUTSIDE_EVENT,
  pick,
  useParticles,
  useSpeak,
} from "../scene-shared";
import { CatBrain, FLOOR_Y } from "./brain";
import type { Pt } from "./geometry";
import { FieldMouse } from "./mouse";
import { CatRig } from "./rig";

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

/** How far around her she notices the pointer, in scene units. */
const NOTICE = 520;

/**
 * Mochi, drawn and animated by a small rig rather than React, so she
 * moves smoothly. React only handles clicks, hearts and speech.
 */
export function Mochi({ yarnX, onBat }: { yarnX: number; onBat: () => void }) {
  const container = useRef<SVGGElement | null>(null);
  const brainRef = useRef<CatBrain | null>(null);
  const speak = useSpeak();
  const [hearts, burst] = useParticles();
  const pets = useRef(0);

  const latest = useRef({ speak, onBat });

  useEffect(() => {
    latest.current = { speak, onBat };
  });

  useEffect(() => {
    const root = container.current;

    if (!root) {
      return;
    }

    const brain = new CatBrain(
      {
        speak: (point, text) => latest.current.speak(point[0], point[1] - 40, text),
        bat: () => latest.current.onBat(),
        purr: () => playSfx("purr"),
      },
      yarnX
    );
    brainRef.current = brain;

    const rig = new CatRig(root);
    let mouse: FieldMouse | null = null;

    /* Pointer: she watches it, and hunts it if you wiggle it on the floor */
    const pointer = { point: [0, 0] as Pt, at: -10, energy: 0, onFloor: false };
    let clock = 0;

    const svg = root.ownerSVGElement;

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
      if (mouse) {
        return;
      }

      mouse = new FieldMouse(root!, Math.random() < 0.5);
    }

    function onOutside() {
      // Something outside: glance at the window.
      brain.glance([800, 380], 3.5);
    }

    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener(MOUSE_EVENT, spawnMouse);
    window.addEventListener(OUTSIDE_EVENT, onOutside);

    let nextMouse = 70 + Math.random() * 80;
    let frame = 0;
    let last = performance.now();
    let skip = 0;

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
          mouse.remove();
          mouse = null;

          if (brain.prey?.kind === "mouse") {
            brain.stopHunting();
            brain.events.speak(brain.headSpot(), pick(["Mrrp?! It got away…", "Next time, mouse. Next time.", "*stares at the hole under the bed*"]));
          }
        } else {
          brain.hunt({ point: [mouse.x, FLOOR_Y], kind: "mouse" });
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
      } else {
        brain.interest = { point: [mouse.x, FLOOR_Y], strength: 1 };
      }

      brain.update(dt);

      // Breathe at a gentler frame rate while she naps.
      if (!brain.restful || skip++ % 3 === 0) {
        rig.draw(brain.frame(dt));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener(MOUSE_EVENT, spawnMouse);
      window.removeEventListener(OUTSIDE_EVENT, onOutside);
      brainRef.current = null;
      root.replaceChildren();
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
    pets.current += 1;
    burst(x, y - 46, 3, 60);
    speak(
      x,
      y - 50,
      pets.current % 10 === 0 ? `That's ${pets.current} pets! We're best friends now. 🐾` : pick(CAT_LINES)
    );
  }

  return (
    <g>
      <g ref={container} className="sc-hit" onClick={pet} />

      {hearts.map((heart) => (
        <g key={heart.id} transform={`translate(${heart.x} ${heart.y}) scale(1.6)`}>
          <path
            d="M0 3 C0 -1 -6 -2 -6 2 C -6 6 0 9 0 11 C 0 9 6 6 6 2 C 6 -2 0 -1 0 3 Z"
            fill="var(--ember)"
            className="sc-float-up"
            style={floatStyle(heart.delay)}
          />
        </g>
      ))}
    </g>
  );
}
