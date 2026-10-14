/**
 * Mochi's behaviour. Every animation frame `update(dt)` moves her on:
 * what she is doing, where she is walking, which way she faces, and
 * what she is looking at. The drawing lives in `art.tsx`.
 */

import { HEAD_SPOT } from "./art";

export type Pt = [number, number];

export const FLOOR_Y = 880;
export const SCALE = 0.86;

/** Where she can wander along the rug (scene x). */
const RANGE: Pt = [470, 1060];

/** Her bed on the rug; she curls up a little right of her middle. */
export const BED_X = 600;
export const BED_SPOT = BED_X + 8;
const WALK_SPEED = 56;
const CHASE_SPEED = 160;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

export type Activity =
  | "sleep"
  | "loaf"
  | "sit"
  | "stand"
  | "walk"
  | "stretch"
  | "groom"
  | "look"
  | "bat"
  | "yawn"
  | "crouch"
  | "pounce"
  | "chase";

/** Which drawing each activity uses. */
export type ArtPose = "loaf" | "sit" | "stretch" | "walk";

export const ART_POSE: Record<Activity, ArtPose> = {
  sleep: "loaf",
  loaf: "loaf",
  sit: "sit",
  groom: "sit",
  look: "sit",
  bat: "sit",
  yawn: "sit",
  stand: "walk",
  walk: "walk",
  chase: "walk",
  crouch: "walk",
  pounce: "walk",
  stretch: "stretch",
};

/** [min, max] seconds; walking and chasing last until she arrives. */
const DURATION: Record<Activity, Pt> = {
  sleep: [30, 80],
  loaf: [10, 20],
  sit: [8, 16],
  stand: [0.8, 2],
  walk: [0, 0],
  stretch: [2.6, 2.6],
  groom: [5, 8],
  look: [4, 8],
  bat: [1.3, 1.3],
  yawn: [1.8, 1.8],
  crouch: [1.4, 2.4],
  pounce: [0.5, 0.5],
  chase: [0, 0],
};

const NEXT: Record<Activity, Array<[Activity, number]>> = {
  sleep: [["loaf", 0.6], ["stretch", 0.25], ["sleep", 0.15]],
  loaf: [["sleep", 0.45], ["sit", 0.3], ["walk", 0.25]],
  sit: [["walk", 0.3], ["loaf", 0.2], ["groom", 0.15], ["look", 0.15], ["bat", 0.1], ["yawn", 0.1]],
  stand: [["walk", 0.7], ["sit", 0.3]],
  walk: [["sit", 0.5], ["loaf", 0.25], ["walk", 0.25]],
  stretch: [["walk", 0.6], ["sit", 0.4]],
  groom: [["sit", 1]],
  look: [["sit", 1]],
  bat: [["sit", 0.6], ["bat", 0.4]],
  yawn: [["sit", 1]],
  crouch: [["pounce", 1]],
  pounce: [["sit", 1]],
  chase: [["crouch", 1]],
};

const LYING: Activity[] = ["sleep", "loaf"];
const SITTING: Activity[] = ["sit", "groom", "look", "bat", "yawn"];

function weighted<T>(options: Array<[T, number]>) {
  let roll = Math.random();

  for (const [value, weight] of options) {
    roll -= weight;

    if (roll <= 0) {
      return value;
    }
  }

  return options[options.length - 1][0];
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export type Interest = { point: Pt; strength: number };

export type CatEvents = {
  speak: (point: Pt, text: string) => void;
  bat: () => void;
  purr: () => void;
};

export class CatBrain {
  x = BED_SPOT;
  /** 1 faces left (as drawn), -1 faces right; in between while turning. */
  facing = 1;
  lift = 0;

  activity: Activity = "sleep";
  private facingTarget = 1;
  private timer = rand(20, 40);
  /** What to do next, with an optional place to walk to. */
  private queue: Array<{ activity: Activity; target?: number }> = [];

  private targetX = this.x;
  private speed = 0;
  private clock = 0;
  private activityClock = 0;
  private pounceFrom = 0;
  private pounceTo = 0;

  private blink = 0;
  private nextBlink = rand(2, 5);
  private nextTwitch = rand(5, 12);
  /** Counts ear twitches, so the drawing can replay its animation. */
  twitches = 0;
  private happyUntil = 0;

  private glanceAt: Pt | null = null;
  private glanceUntil = 0;

  /** Something she is interested in this frame (the pointer, mostly). */
  interest: Interest | null = null;
  /** Prey to hunt (the pointer or a mouse), in scene space. */
  prey: { point: Pt; kind: "pointer" | "mouse" } | null = null;

  constructor(
    readonly events: CatEvents,
    private yarnX: number
  ) {}

  /* ---------------------------------------------------------------- */
  /* Decisions                                                        */
  /* ---------------------------------------------------------------- */

  /**
   * Start an activity, standing up first when she is lying or sitting.
   * Walks go to `target`, or somewhere random.
   */
  start(activity: Activity, target?: number) {
    const needsLegs = activity === "walk" || activity === "chase";
    const down = LYING.includes(this.activity) || SITTING.includes(this.activity);

    if (needsLegs && down) {
      this.queue.unshift({ activity, target });
      activity = "stand";
    }

    this.activity = activity;
    this.activityClock = 0;

    const [min, max] = DURATION[activity];
    this.timer = activity === "stand" && this.queue.length ? 0.45 : rand(min, max);

    if (activity === "walk") {
      this.walkTo(target ?? this.pickSpot());
    }

    if (activity === "chase" && this.prey) {
      this.walkTo(this.prey.point[0]);
    }

    if (activity === "bat") {
      this.facingTarget = this.yarnX < this.x ? 1 : -1;
    }

    if (activity === "pounce") {
      this.pounceFrom = this.x;
      const aim = this.prey ? this.prey.point[0] : this.x - 90 * this.facing;
      this.pounceTo = clamp(this.x + clamp(aim - this.x, -130, 130), RANGE[0], RANGE[1]);
    }
  }

  private pickSpot() {
    let target = rand(RANGE[0], RANGE[1]);

    if (Math.abs(target - this.x) < 130) {
      target = this.x + (this.x > (RANGE[0] + RANGE[1]) / 2 ? -1 : 1) * rand(150, 320);
    }

    return clamp(target, RANGE[0], RANGE[1]);
  }

  private walkTo(target: number) {
    this.targetX = clamp(target, RANGE[0], RANGE[1]);

    if (Math.abs(this.targetX - this.x) > 4) {
      this.facingTarget = this.targetX < this.x ? 1 : -1;
    }
  }

  private next() {
    const queued = this.queue.shift();

    if (queued) {
      this.start(queued.activity, queued.target);
      return;
    }

    let next = weighted(NEXT[this.activity]);

    // Batting needs the yarn in reach: walk over first.
    if (next === "bat") {
      const side = this.x < this.yarnX ? -1 : 1;
      const spot = this.yarnX + side * 89;

      if (Math.abs(spot - this.x) > 14) {
        this.queue = [{ activity: "bat" }];
        this.start("walk", spot);
        return;
      }
    }

    if (next === "walk" && this.activity === "walk" && Math.random() < 0.5) {
      next = "stand";
    }

    // Naps happen in her bed: wander over to it first.
    if (next === "sleep" && !this.inBed) {
      this.queue = [{ activity: "loaf" }, { activity: "sleep" }];
      this.start("walk", BED_SPOT);
      return;
    }

    this.start(next);
  }

  /** Curled up in her bed. */
  get inBed() {
    return (this.activity === "sleep" || this.activity === "loaf") && Math.abs(this.x - BED_SPOT) < 16;
  }

  /* ---------------------------------------------------------------- */
  /* Things that happen to her                                        */
  /* ---------------------------------------------------------------- */

  pet(): Pt {
    this.happyUntil = this.clock + 2.6;
    this.events.purr();

    if (this.activity === "sleep") {
      this.start("loaf");
    } else if (this.activity === "loaf") {
      this.start("sit");
    } else if (this.activity === "walk" || this.activity === "chase" || this.activity === "crouch" || this.activity === "stand") {
      this.queue = [];
      this.targetX = this.x;
      this.start("sit");
    } else {
      // Stay put a little longer.
      this.timer = Math.max(this.timer, 4);
    }

    return this.headSpot();
  }

  /** A session just ended: wake up, stretch, and look pleased with you. */
  celebrate() {
    this.prey = null;
    this.queue = [{ activity: "sit" }];
    this.happyUntil = this.clock + 4;
    this.start("stretch");
  }

  /** Back to work: she pads off to her bed for a nap while you focus. */
  settle() {
    if (this.activity === "sleep") {
      return;
    }

    this.prey = null;

    if (this.inBed) {
      this.start("sleep");
      return;
    }

    this.queue = [{ activity: "loaf" }, { activity: "sleep" }];
    this.start("walk", BED_SPOT);
  }

  /** Look at something for a moment (a train outside, a sound). */
  glance(point: Pt, seconds: number) {
    if (this.activity !== "sleep" && !this.prey) {
      this.glanceAt = point;
      this.glanceUntil = this.clock + seconds;
    }
  }

  /** The pointer is wiggling on the floor, or a mouse ran in: hunt it. */
  hunt(prey: { point: Pt; kind: "pointer" | "mouse" }) {
    this.prey = prey;

    if (this.activity === "sleep") {
      if (prey.kind === "mouse" && Math.random() < 0.55) {
        this.twitches++;
        this.start("loaf");
      }
      return;
    }

    if (["crouch", "pounce", "chase"].includes(this.activity)) {
      return;
    }

    this.queue = [];
    this.approachPrey();
  }

  private approachPrey() {
    if (!this.prey) {
      return;
    }

    const dx = this.prey.point[0] - this.x;
    this.facingTarget = dx < 0 ? 1 : -1;
    this.start(Math.abs(dx) > 170 ? "chase" : "crouch");
  }

  stopHunting() {
    this.prey = null;

    if (["crouch", "chase"].includes(this.activity)) {
      this.start("sit");
    }
  }

  get pose(): ArtPose {
    return ART_POSE[this.activity];
  }

  get happy() {
    return this.clock < this.happyUntil;
  }

  get blinking() {
    return this.activity !== "sleep" && this.blink > 0.4;
  }

  headSpot(): Pt {
    const head = HEAD_SPOT[this.pose];
    return [this.x + head.x * SCALE * this.facing, FLOOR_Y - this.lift + head.y * SCALE];
  }

  /** Where she is looking, relative to her head (-1 to 1), or null for "at you". */
  gaze(): Pt | null {
    if (this.happy || this.activity === "sleep") {
      return null;
    }

    let point: Pt | null = this.interest?.point ?? null;

    if (this.activity === "bat") {
      point = [this.yarnX, FLOOR_Y - 16];
    } else if (this.glanceAt && this.clock < this.glanceUntil) {
      point = this.glanceAt;
    }

    if (!point) {
      return null;
    }

    const head = this.headSpot();
    // In her own frame: positive x is behind her.
    return [clamp(((point[0] - head[0]) * this.facing) / 90, -1, 1), clamp((point[1] - head[1]) / 90, -1, 1)];
  }

  /* ---------------------------------------------------------------- */
  /* Motion                                                           */
  /* ---------------------------------------------------------------- */

  update(dt: number) {
    this.clock += dt;
    this.activityClock += dt;

    /* Turning around: a quick flip through facing you. */
    const turnRate = this.activity === "chase" || this.prey ? 8 : 5;
    this.facing += clamp(this.facingTarget - this.facing, -turnRate * dt, turnRate * dt);
    const turning = Math.abs(this.facing - this.facingTarget) > 0.05;

    /* Walking and chasing */
    const moving = this.activity === "walk" || this.activity === "chase";

    if (moving) {
      if (this.activity === "chase" && this.prey) {
        this.walkTo(this.prey.point[0] - Math.sign(this.prey.point[0] - this.x || 1) * 100);
      }

      const top = this.activity === "chase" ? CHASE_SPEED : WALK_SPEED;
      const remaining = this.targetX - this.x;
      // Ease in, and slow down on arrival.
      const wanted = turning ? 0 : Math.min(top, Math.abs(remaining) * 2.2 + 8);
      this.speed += clamp(wanted - this.speed, -top * 2.5 * dt, top * 1.8 * dt);
      this.x += Math.sign(remaining) * Math.min(Math.abs(remaining), this.speed * dt);

      if (Math.abs(remaining) < 1.5 && !turning) {
        this.speed = 0;
        this.next();
      }
    } else {
      this.speed = 0;
    }

    /* Pounce: a leap in an arc */
    if (this.activity === "pounce") {
      const t = clamp(this.activityClock / DURATION.pounce[0], 0, 1);
      this.x = lerp(this.pounceFrom, this.pounceTo, smoothstep(t));
      this.lift = Math.sin(Math.PI * t) * 30;
    } else {
      this.lift += (0 - this.lift) * Math.min(1, dt * 12);
    }

    /* Activity timer */
    if (!moving) {
      this.timer -= dt;

      if (this.activity === "crouch" && this.prey) {
        this.facingTarget = this.prey.point[0] < this.x ? 1 : -1;

        // Prey slipped away: give chase again.
        if (Math.abs(this.prey.point[0] - this.x) > 220 && this.activityClock > 0.6) {
          this.approachPrey();
        }
      }

      if (this.timer <= 0) {
        if (this.activity === "pounce" && this.prey) {
          this.queue = [];
          this.start("sit");
          this.timer = 1.2;
        } else if (this.activity === "sit" && this.prey && this.activityClock > 1) {
          this.approachPrey();
        } else {
          this.next();
        }
      }
    }

    /* Batting kicks the yarn */
    if (this.activity === "bat" && this.activityClock - dt < 0.35 && this.activityClock >= 0.35) {
      this.events.bat();
    }

    /* Blinks and ear twitches */
    this.nextBlink -= dt;

    if (this.nextBlink <= 0) {
      this.blink = 1;
      this.nextBlink = rand(2.5, 6);
    }

    this.blink = Math.max(0, this.blink - dt * 6);
    this.nextTwitch -= dt;

    if (this.nextTwitch <= 0) {
      this.twitches++;
      this.nextTwitch = rand(this.activity === "sleep" ? 6 : 8, 16);
    }
  }

  /** Legs: still, walking, or running. */
  get legs(): "still" | "walk" | "run" {
    if (this.activity === "chase" || this.activity === "pounce") {
      return "run";
    }

    return this.activity === "walk" && this.speed > 4 ? "walk" : "still";
  }
}
