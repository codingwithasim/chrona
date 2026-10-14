"use client";

import {
  type RefObject,
  useEffect,
  useRef,
} from "react";

import type {
  Season,
  TimeOfDay,
  Weather,
} from "@/lib/scene-time";

/*
 * Everything that moves outside the window: rain or snow, seasonal
 * petals/leaves/fireflies, fireworks, lightning, and the drops that
 * cling to and run down the glass.
 */

export const SKY_EVENT = "chrona:sky";

export type SkyEventKind = "lightning" | "firework" | "gust";

export function triggerSky(kind: SkyEventKind) {
  window.dispatchEvent(
    new CustomEvent<SkyEventKind>(SKY_EVENT, { detail: kind })
  );
}

type Props = {
  /** The glass rectangle inside the scene SVG. */
  targetRef: RefObject<SVGRectElement | null>;
  weather: Weather;
  season: Season;
  time: TimeOfDay;
};

type Streak = { x: number; y: number; len: number; speed: number; near: boolean };
type Bead = { x: number; y: number; r: number };
type Runner = { x: number; y: number; startY: number; r: number; speed: number; wobble: number };
type Flake = { x: number; y: number; r: number; speed: number; phase: number };
type Drifter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  size: number;
  phase: number;
  color: string;
};
type Firefly = { x: number; y: number; angle: number; speed: number; phase: number };
type Rocket = { x: number; y: number; vy: number; targetY: number; color: string };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string };

const RAIN = {
  drizzle: { density: 1 / 5200, slant: 0.12, runners: 4 },
  storm: { density: 1 / 2000, slant: 0.22, runners: 9 },
} as const;

const PETAL_COLORS = ["#ffc6da", "#ff9fc0", "#fff0f5"];
const LEAF_COLORS = ["#f39a45", "#df5d3e", "#f7c955", "#c9472f"];
const FIREWORK_COLORS = ["#ff8fb8", "#ffd27a", "#7fdcff", "#b6a3ff", "#7fe0bd", "#ffffff"];

/** Rain picks up the color of the light outside. */
const RAIN_COLORS: Record<TimeOfDay, string> = {
  morning: "255,255,255",
  day: "255,255,255",
  evening: "235,210,235",
  night: "200,212,255",
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export function RainCanvas({ targetRef, weather, season, time }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    const rgb = RAIN_COLORS[time];
    const dark = time === "evening" || time === "night";

    const rain =
      weather === "drizzle" || weather === "storm" ? RAIN[weather] : null;
    const snowing = weather === "snow";

    let width = 0;
    let height = 0;

    let streaks: Streak[] = [];
    let beads: Bead[] = [];
    let runners: Runner[] = [];
    let flakes: Flake[] = [];
    let drifters: Drifter[] = [];
    let fireflies: Firefly[] = [];
    let rockets: Rocket[] = [];
    let sparks: Spark[] = [];

    let flash = 0;
    let gust = 0;

    let nextFlashAt = performance.now() + rand(15000, 35000);
    let nextFireworkAt = performance.now() + rand(2000, 5000);

    const autoFireworks = weather === "clear" && season === "summer" && dark;

    /* ---------------- spawners ---------------- */

    function newStreak(anywhere: boolean): Streak {
      const slant = rain?.slant ?? 0;
      const near = Math.random() < 0.35;

      return {
        x: Math.random() * (width + height * slant) - height * slant,
        y: anywhere ? Math.random() * height : -Math.random() * height * 0.3 - 20,
        len: near ? rand(18, 34) : rand(8, 18),
        speed: near ? rand(900, 1300) : rand(520, 780),
        near,
      };
    }

    function newRunner(): Runner {
      const y = Math.random() * height * 0.55;

      return { x: Math.random() * width, y, startY: y, r: rand(1.8, 3.6), speed: rand(18, 78), wobble: Math.random() * 6 };
    }

    function newFlake(anywhere: boolean): Flake {
      const r = rand(0.8, 3.2);

      return {
        x: rand(-20, width + 20),
        y: anywhere ? Math.random() * height : rand(-40, -5),
        r,
        speed: 18 + r * 16,
        phase: Math.random() * Math.PI * 2,
      };
    }

    function newDrifter(anywhere: boolean): Drifter {
      const leaf = season === "autumn";

      return {
        x: anywhere ? Math.random() * width : rand(-60, width * 0.6),
        y: anywhere ? Math.random() * height : rand(-60, -10),
        vx: leaf ? rand(10, 40) : rand(20, 55),
        vy: leaf ? rand(30, 60) : rand(22, 45),
        rot: Math.random() * Math.PI * 2,
        spin: rand(-2.5, 2.5),
        size: leaf ? rand(5, 9) : rand(3, 5.5),
        phase: Math.random() * Math.PI * 2,
        color: pick(leaf ? LEAF_COLORS : PETAL_COLORS),
      };
    }

    function newFirefly(): Firefly {
      return {
        x: Math.random() * width,
        y: rand(height * 0.45, height * 0.95),
        angle: Math.random() * Math.PI * 2,
        speed: rand(8, 22),
        phase: Math.random() * Math.PI * 2,
      };
    }

    function launch() {
      rockets.push({
        x: rand(width * 0.2, width * 0.8),
        y: height + 10,
        vy: -rand(380, 470),
        targetY: rand(height * 0.12, height * 0.4),
        color: pick(FIREWORK_COLORS),
      });
    }

    function explode(rocket: Rocket) {
      const count = Math.round(rand(55, 85));
      const second = pick(FIREWORK_COLORS);

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05);
        const speed = rand(70, 170);
        const max = rand(1.1, 1.8);

        sparks.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: max,
          max,
          color: i % 3 === 0 ? second : rocket.color,
        });
      }
    }

    /* ---------------- layout ---------------- */

    function layout() {
      const rect = target!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas!.style.left = `${rect.left}px`;
      canvas!.style.top = `${rect.top}px`;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;

      streaks = rain
        ? Array.from({ length: Math.min(420, Math.max(30, Math.round(area * rain.density))) }, () => newStreak(true))
        : [];

      beads = rain
        ? Array.from({ length: Math.round(area / (weather === "storm" ? 2600 : 4200)) }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            r: rand(0.8, 3),
          }))
        : [];

      runners = rain ? Array.from({ length: rain.runners }, newRunner) : [];

      flakes = snowing
        ? Array.from({ length: Math.min(260, Math.round(area / 2400)) }, () => newFlake(true))
        : [];

      const drifting = !snowing && (season === "spring" || season === "autumn");

      drifters = drifting
        ? Array.from({ length: season === "spring" ? 22 : 14 }, () => newDrifter(true))
        : [];

      fireflies =
        season === "summer" && dark && weather === "clear"
          ? Array.from({ length: 16 }, newFirefly)
          : [];
    }

    /* ---------------- drawing ---------------- */

    function drawLeaf(d: Drifter) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = d.color;
      ctx.beginPath();

      if (season === "autumn") {
        ctx.moveTo(0, -d.size);
        ctx.quadraticCurveTo(d.size * 0.9, -d.size * 0.2, 0, d.size);
        ctx.quadraticCurveTo(-d.size * 0.9, -d.size * 0.2, 0, -d.size);
      } else {
        // Sakura petal with a little notch.
        ctx.moveTo(0, d.size);
        ctx.quadraticCurveTo(d.size, 0, d.size * 0.35, -d.size);
        ctx.lineTo(0, -d.size * 0.6);
        ctx.lineTo(-d.size * 0.35, -d.size);
        ctx.quadraticCurveTo(-d.size, 0, 0, d.size);
      }

      ctx.fill();
      ctx.restore();
    }

    function draw(dt: number, now: number) {
      ctx.clearRect(0, 0, width, height);

      // Ambient lightning in night storms.
      if (dark && weather === "storm" && !reducedMotion && now > nextFlashAt) {
        flash = 1;
        nextFlashAt = now + rand(18000, 48000);
      }

      if (flash > 0) {
        const flicker = flash > 0.7 || (flash > 0.35 && flash < 0.5) ? flash : flash * 0.4;

        ctx.fillStyle = `rgba(225,232,255,${flicker * 0.4})`;
        ctx.fillRect(0, 0, width, height);
        flash = Math.max(0, flash - dt * 1.6);
      }

      gust = Math.max(0, gust - dt * 0.6);

      /* Fireworks */
      if (autoFireworks && !reducedMotion && now > nextFireworkAt) {
        launch();
        nextFireworkAt = now + rand(3500, 9000);
      }

      if (rockets.length || sparks.length) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        rockets = rockets.filter((rocket) => {
          rocket.y += rocket.vy * dt;
          rocket.vy *= 0.985;

          ctx.fillStyle = rocket.color;
          ctx.beginPath();
          ctx.arc(rocket.x, rocket.y, 1.8, 0, Math.PI * 2);
          ctx.fill();

          if (rocket.y <= rocket.targetY) {
            explode(rocket);
            return false;
          }

          return true;
        });

        sparks = sparks.filter((spark) => {
          spark.life -= dt;
          spark.vx *= 0.97;
          spark.vy = spark.vy * 0.97 + 60 * dt;
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;

          const alpha = Math.max(0, spark.life / spark.max);

          ctx.globalAlpha = alpha * (0.7 + Math.random() * 0.3);
          ctx.fillStyle = spark.color;
          ctx.beginPath();
          ctx.arc(spark.x, spark.y, 1.6, 0, Math.PI * 2);
          ctx.fill();

          return spark.life > 0;
        });

        ctx.restore();
      }

      /* Fireflies */
      for (const fly of fireflies) {
        fly.angle += rand(-1.5, 1.5) * dt;
        fly.x += Math.cos(fly.angle) * fly.speed * dt;
        fly.y += Math.sin(fly.angle) * fly.speed * dt * 0.6;
        fly.phase += dt * 2.2;

        if (fly.x < -10 || fly.x > width + 10 || fly.y < height * 0.3 || fly.y > height + 10) {
          Object.assign(fly, newFirefly());
        }

        const glow = 0.35 + 0.65 * Math.max(0, Math.sin(fly.phase));
        const gradient = ctx.createRadialGradient(fly.x, fly.y, 0, fly.x, fly.y, 9);
        gradient.addColorStop(0, `rgba(230,255,150,${glow})`);
        gradient.addColorStop(1, "rgba(230,255,150,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fly.x, fly.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Petals and leaves */
      for (const d of drifters) {
        d.phase += dt * 1.6;
        d.x += (d.vx + Math.sin(d.phase) * 18 + gust * 120) * dt;
        d.y += (d.vy + Math.cos(d.phase * 0.7) * 8) * dt;
        d.rot += d.spin * dt;

        if (d.y > height + 20 || d.x > width + 30) {
          Object.assign(d, newDrifter(false));
        }

        drawLeaf(d);
      }

      /* Snow */
      if (flakes.length) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();

        for (const flake of flakes) {
          flake.phase += dt * 1.2;
          flake.y += flake.speed * dt;
          flake.x += (Math.sin(flake.phase) * 14 + 6 + gust * 160) * dt;

          if (flake.y > height + 6 || flake.x > width + 30) {
            Object.assign(flake, newFlake(false));
          }

          ctx.moveTo(flake.x + flake.r, flake.y);
          ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        }

        ctx.fill();
      }

      if (!rain) {
        return;
      }

      /* Rain, batched into two strokes */
      for (const near of [false, true]) {
        ctx.beginPath();

        for (const streak of streaks) {
          if (streak.near !== near) {
            continue;
          }

          streak.y += streak.speed * dt;
          streak.x += streak.speed * dt * rain.slant;

          if (streak.y - streak.len > height) {
            Object.assign(streak, newStreak(false));
          }

          ctx.moveTo(streak.x, streak.y);
          ctx.lineTo(streak.x - streak.len * rain.slant, streak.y - streak.len);
        }

        ctx.strokeStyle = `rgba(${rgb},${near ? 0.42 : 0.2})`;
        ctx.lineWidth = near ? 1.4 : 0.9;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      /* Beads on the glass */
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

      /* Drops running down the glass */
      for (const runner of runners) {
        runner.wobble += dt * 3;
        runner.y += runner.speed * dt;
        runner.x += Math.sin(runner.wobble) * 0.15;

        const trail = ctx.createLinearGradient(0, runner.startY, 0, runner.y);
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
        ctx.arc(runner.x - runner.r * 0.35, runner.y - runner.r * 0.4, runner.r * 0.32, 0, Math.PI * 2);
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

      return () => window.removeEventListener("resize", onResize);
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

    function onSky(event: Event) {
      const kind = (event as CustomEvent<SkyEventKind>).detail;

      if (kind === "lightning") {
        flash = 1;
      } else if (kind === "firework") {
        launch();

        if (Math.random() > 0.4) {
          window.setTimeout(launch, 350);
        }
      } else if (kind === "gust") {
        gust = 1;
      }
    }

    frame = requestAnimationFrame(loop);

    window.addEventListener(SKY_EVENT, onSky);
    window.addEventListener("resize", layout);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(SKY_EVENT, onSky);
      window.removeEventListener("resize", layout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [targetRef, weather, season, time]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute"
    />
  );
}
