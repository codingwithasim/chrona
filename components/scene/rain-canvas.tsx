"use client";

import {
  type RefObject,
  useEffect,
  useRef,
} from "react";

import type { RainLevel } from "@/stores/scene-store";

type Props = {
  /** The glass rectangle inside the scene SVG. */
  targetRef: RefObject<SVGRectElement | null>;
  level: RainLevel;
  night: boolean;
};

type Streak = {
  x: number;
  y: number;
  len: number;
  speed: number;
  near: boolean;
};

type Bead = {
  x: number;
  y: number;
  r: number;
};

type Runner = {
  x: number;
  y: number;
  startY: number;
  r: number;
  speed: number;
  wobble: number;
};

const SETTINGS = {
  light: { density: 1 / 5200, slant: 0.12, runners: 4 },
  heavy: { density: 1 / 2000, slant: 0.22, runners: 9 },
} as const;

function readRainColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--sc-rain")
      .trim() || "220 230 255"
  );
}

export function RainCanvas({
  targetRef,
  level,
  night,
}: Props) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const target = targetRef.current;

    if (!canvas || !target) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const ctx = context;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const rgb = readRainColor().replaceAll(" ", ",");

    let width = 0;
    let height = 0;

    let streaks: Streak[] = [];
    let beads: Bead[] = [];
    let runners: Runner[] = [];

    let flash = 0;
    let nextFlashAt =
      performance.now() + 15000 + Math.random() * 20000;

    const settings =
      level === "off" ? null : SETTINGS[level];

    function newStreak(anywhere: boolean): Streak {
      const slant = settings?.slant ?? 0;
      const near = Math.random() < 0.35;

      return {
        x:
          Math.random() * (width + height * slant) -
          height * slant,
        y: anywhere
          ? Math.random() * height
          : -Math.random() * height * 0.3 - 20,
        len: near
          ? 18 + Math.random() * 16
          : 8 + Math.random() * 10,
        speed: near
          ? 900 + Math.random() * 400
          : 520 + Math.random() * 260,
        near,
      };
    }

    function newRunner(): Runner {
      const y = Math.random() * height * 0.55;

      return {
        x: Math.random() * width,
        y,
        startY: y,
        r: 1.8 + Math.random() * 1.8,
        speed: 18 + Math.random() * 60,
        wobble: Math.random() * Math.PI * 2,
      };
    }

    function layout() {
      const rect = target!.getBoundingClientRect();
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      width = rect.width;
      height = rect.height;

      canvas!.style.left = `${rect.left}px`;
      canvas!.style.top = `${rect.top}px`;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!settings) {
        streaks = [];
        beads = [];
        runners = [];
        return;
      }

      const count = Math.min(
        420,
        Math.max(30, Math.round(width * height * settings.density))
      );

      streaks = Array.from({ length: count }, () =>
        newStreak(true)
      );

      beads = Array.from(
        {
          length: Math.round(
            (width * height) / (level === "heavy" ? 2600 : 4200)
          ),
        },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.8 + Math.random() * 2.2,
        })
      );

      runners = Array.from(
        { length: settings.runners },
        newRunner
      );
    }

    function draw(dt: number, now: number) {
      ctx.clearRect(0, 0, width, height);

      if (!settings) {
        return;
      }

      // Lightning: a soft double flicker, night storms only.
      if (night && level === "heavy" && !reducedMotion) {
        if (now > nextFlashAt) {
          flash = 1;
          nextFlashAt =
            now + 18000 + Math.random() * 30000;
        }

        if (flash > 0) {
          const flicker =
            flash > 0.7 || (flash > 0.35 && flash < 0.5)
              ? flash
              : flash * 0.4;

          ctx.fillStyle = `rgba(225,232,255,${flicker * 0.32})`;
          ctx.fillRect(0, 0, width, height);
          flash = Math.max(0, flash - dt * 1.6);
        }
      }

      const slant = settings.slant;

      // Falling rain, batched into two strokes.
      for (const near of [false, true]) {
        ctx.beginPath();

        for (const streak of streaks) {
          if (streak.near !== near) {
            continue;
          }

          streak.y += streak.speed * dt;
          streak.x += streak.speed * dt * slant;

          if (streak.y - streak.len > height) {
            Object.assign(streak, newStreak(false));
          }

          ctx.moveTo(streak.x, streak.y);
          ctx.lineTo(
            streak.x - streak.len * slant,
            streak.y - streak.len
          );
        }

        ctx.strokeStyle = `rgba(${rgb},${near ? 0.42 : 0.2})`;
        ctx.lineWidth = near ? 1.4 : 0.9;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Beads stuck to the glass.
      ctx.fillStyle = `rgba(${rgb},0.16)`;
      ctx.beginPath();

      for (const bead of beads) {
        ctx.moveTo(bead.x + bead.r, bead.y);
        ctx.arc(bead.x, bead.y, bead.r, 0, Math.PI * 2);
      }

      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();

      for (const bead of beads) {
        if (bead.r < 1.6) {
          continue;
        }

        const hx = bead.x - bead.r * 0.35;
        const hy = bead.y - bead.r * 0.35;

        ctx.moveTo(hx + 0.6, hy);
        ctx.arc(hx, hy, 0.6, 0, Math.PI * 2);
      }

      ctx.fill();

      // Drops running down the glass, leaving a trail.
      for (const runner of runners) {
        runner.wobble += dt * 3;
        runner.y += runner.speed * dt;
        runner.x += Math.sin(runner.wobble) * 0.15;

        const trail = ctx.createLinearGradient(
          0,
          runner.startY,
          0,
          runner.y
        );

        trail.addColorStop(0, `rgba(${rgb},0)`);
        trail.addColorStop(1, `rgba(${rgb},0.22)`);

        ctx.strokeStyle = trail;
        ctx.lineWidth = runner.r * 0.7;
        ctx.beginPath();
        ctx.moveTo(runner.x, runner.startY);
        ctx.lineTo(runner.x, runner.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(${rgb},0.35)`;
        ctx.beginPath();
        ctx.arc(runner.x, runner.y, runner.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.beginPath();
        ctx.arc(
          runner.x - runner.r * 0.35,
          runner.y - runner.r * 0.4,
          runner.r * 0.32,
          0,
          Math.PI * 2
        );
        ctx.fill();

        if (runner.y > height + runner.r) {
          Object.assign(runner, newRunner());
        }
      }
    }

    layout();

    if (reducedMotion) {
      draw(0, performance.now());

      const onResize = () => {
        layout();
        draw(0, performance.now());
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }

    let frame = 0;
    let last = performance.now();

    function loop(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      draw(dt, now);
      frame = requestAnimationFrame(loop);
    }

    function onVisibility() {
      cancelAnimationFrame(frame);

      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    }

    frame = requestAnimationFrame(loop);

    window.addEventListener("resize", layout);
    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", layout);
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, [targetRef, level, night]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute"
    />
  );
}
