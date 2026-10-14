/**
 * Mochi's behaviour and motion. Every animation frame `update(dt)`
 * moves her on: what she is doing, where she is walking, how her legs
 * step, how her tail swings and where she is looking. `frame()` turns
 * that into something the rig can draw.
 */

import {
  clamp,
  easeInOut,
  lerp,
  lerpPt,
  type Pt,
  smoothstep,
} from "./geometry";
import { blendPose, clonePose, type Pose, type PoseName, POSES } from "./poses";
import { type Frame, TAIL_SEGMENTS } from "./rig";

export const FLOOR_Y = 880;
export const SCALE = 0.86;

/** Where she can wander along the rug (scene x). */
const RANGE: Pt = [470, 1060];
const WALK_SPEED = 52;
const CHASE_SPEED = 150;

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

const POSE_OF: Record<Activity, PoseName> = {
  sleep: "sleep",
  loaf: "loaf",
  sit: "sit",
  stand: "stand",
  walk: "walk",
  stretch: "stretch",
  groom: "sit",
  look: "sit",
  bat: "sit",
  yawn: "sit",
  crouch: "crouch",
  pounce: "pounce",
  chase: "trot",
};

/** [min, max] seconds; walking and chasing last until she arrives. */
const DURATION: Record<Activity, Pt> = {
  sleep: [30, 80],
  loaf: [10, 20],
  sit: [8, 16],
  stand: [0.8, 2],
  walk: [0, 0],
  stretch: [2.8, 2.8],
  groom: [5, 8],
  look: [4, 8],
  bat: [2.4, 2.4],
  yawn: [1.9, 1.9],
  crouch: [1.4, 2.4],
  pounce: [0.55, 0.55],
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

/* Gaits: stride length, share of the cycle each foot is down, and when each foot lifts. */
const GAITS = {
  walk: { stride: 62, duty: 0.62, lift: 7, offsets: { nearHind: 0, nearFront: 0.25, farHind: 0.5, farFront: 0.75 } },
  trot: { stride: 100, duty: 0.45, lift: 11, offsets: { nearHind: 0, farFront: 0, farHind: 0.5, nearFront: 0.5 } },
};

type Foot = "nearFront" | "farFront" | "nearHind" | "farHind";
const FEET: Foot[] = ["nearFront", "farFront", "nearHind", "farHind"];

export type Interest = { point: Pt; strength: number; viewer?: boolean };

export type CatEvents = {
  speak: (point: Pt, text: string) => void;
  bat: () => void;
  purr: () => void;
};

export class CatBrain {
  x = 820;
  facing = 1;
  facingTarget = 1;

  activity: Activity = "sleep";
  private timer = rand(20, 40);
  /** What to do next, with an optional place to walk to. */
  private queue: Array<{ activity: Activity; target?: number }> = [];

  private from: Pose = clonePose(POSES.sleep);
  private to: Pose = POSES.sleep;
  private blend = 1;
  private blendTime = 0.6;

  private targetX = this.x;
  private speed = 0;
  private phase = 0;
  private gaitWeight = 0;
  private gait: keyof typeof GAITS = "walk";

  private tail = Array.from({ length: TAIL_SEGMENTS }, (_, i) => 108 + i * 9.5);
  private tailSpeed = Array.from({ length: TAIL_SEGMENTS }, () => 0);

  private look: Pt = [0, 0];
  private headTurn = 0;
  private headTilt = 0;
  private interestWeight = 0;
  private pupil = 0.4;
  private blink = 0;
  private nextBlink = rand(2, 5);
  private twitch = 0;
  private nextTwitch = rand(5, 12);
  private happyUntil = 0;
  private lift = 0;
  private clock = 0;
  private activityClock = 0;
  private pounceFrom = 0;
  private pounceTo = 0;

  /** Something she is interested in this frame (pointer, prey, yarn…). */
  interest: Interest | null = null;
  /** Prey to hunt (the pointer or a mouse), in scene space. */
  prey: { point: Pt; kind: "pointer" | "mouse" } | null = null;

  private glanceAt: Pt | null = null;
  private glanceUntil = 0;

  constructor(
    readonly events: CatEvents,
    private yarnX: number
  ) {}

  /** Look at something for a moment (a train outside, a sound). */
  glance(point: Pt, seconds: number) {
    if (this.activity !== "sleep" && !this.prey) {
      this.glanceAt = point;
      this.glanceUntil = this.clock + seconds;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Decisions                                                        */
  /* ---------------------------------------------------------------- */

  private pose(name: PoseName, time = 0.6) {
    this.from = this.current();
    this.to = POSES[name];
    this.blend = 0;
    this.blendTime = time;
  }

  private current(): Pose {
    return blendPose(this.from, this.to, easeInOut(clamp(this.blend, 0, 1)));
  }

  /**
   * Start an activity, standing up first when she is lying or sitting.
   * Walks go to `target`, or somewhere random.
   */
  start(activity: Activity, target?: number) {
    const needsLegs = activity === "walk" || activity === "chase" || activity === "stretch";
    const down = LYING.includes(this.activity) || SITTING.includes(this.activity);

    if (needsLegs && down) {
      this.queue.unshift({ activity, target });
      activity = "stand";
    }

    const previous = this.activity;
    this.activity = activity;
    this.activityClock = 0;

    const [min, max] = DURATION[activity];
    this.timer = activity === "stand" && this.queue.length ? 0.55 : rand(min, max);

    let blend = 0.6;

    if (activity === "sleep" || previous === "sleep") blend = 1.3;
    if (activity === "pounce") blend = 0.12;
    if (previous === "pounce") blend = 0.3;
    if (activity === "walk" || activity === "chase") blend = 0.35;
    if (activity === "crouch") blend = 0.4;

    this.pose(POSE_OF[activity], blend);
    this.gait = activity === "chase" ? "trot" : "walk";

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
      const reach = clamp(aim - this.x, -130, 130);
      this.pounceTo = clamp(this.x + reach, RANGE[0], RANGE[1]);
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
      const spot = this.yarnX + side * 92;

      if (Math.abs(spot - this.x) > 14) {
        this.queue = [{ activity: "bat" }];
        this.start("walk", spot);
        return;
      }
    }

    if (next === "walk" && this.activity === "walk" && Math.random() < 0.5) {
      next = "stand";
    }

    this.start(next);
  }

  /* ---------------------------------------------------------------- */
  /* Things that happen to her                                        */
  /* ---------------------------------------------------------------- */

  pet(): Pt {
    this.happyUntil = this.clock + 2.6;
    this.events.purr();

    if (this.activity === "sleep") {
      this.start("loaf");
    } else if (this.activity === "walk" || this.activity === "chase" || this.activity === "crouch") {
      this.queue = [];
      this.targetX = this.x;
      this.start("sit");
    } else {
      // Stay put a little longer.
      this.timer = Math.max(this.timer, 4);
    }

    return this.headSpot();
  }

  /** The pointer is wiggling on the floor, or a mouse ran in: hunt it. */
  hunt(prey: { point: Pt; kind: "pointer" | "mouse" }) {
    this.prey = prey;

    if (this.activity === "sleep") {
      if (prey.kind === "mouse" && Math.random() < 0.55) {
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

    if (Math.abs(dx) > 170) {
      this.start("chase");
    } else {
      this.start("crouch");
    }
  }

  stopHunting() {
    this.prey = null;

    if (["crouch", "chase"].includes(this.activity)) {
      this.start("sit");
    }
  }

  headSpot(): Pt {
    const pose = this.current();
    return [this.x + pose.head[0] * SCALE * this.facing, FLOOR_Y - this.lift + pose.head[1] * SCALE];
  }

  /* ---------------------------------------------------------------- */
  /* Motion                                                           */
  /* ---------------------------------------------------------------- */

  update(dt: number) {
    this.clock += dt;
    this.activityClock += dt;
    this.blend += dt / this.blendTime;

    /* Turning around: a quick flip through facing you. */
    const turnRate = this.activity === "chase" || this.prey ? 7 : 4.5;
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
      const wanted = turning ? 0 : Math.min(top, Math.abs(remaining) * 2.2 + 6);
      this.speed += clamp(wanted - this.speed, -top * 2.5 * dt, top * 1.6 * dt);

      const step = Math.sign(remaining) * Math.min(Math.abs(remaining), this.speed * dt);
      this.x += step;
      this.phase += Math.abs(step) / GAITS[this.gait].stride;

      if (Math.abs(remaining) < 1.5 && !turning) {
        this.speed = 0;
        this.gait = "walk";
        this.next();
      }
    } else {
      this.speed = 0;

    }

    this.gaitWeight += clamp((moving && this.speed > 4 ? 1 : 0) - this.gaitWeight, -4 * dt, 4 * dt);

    /* Pounce: a leap in an arc */
    if (this.activity === "pounce") {
      const t = clamp(this.activityClock / DURATION.pounce[0], 0, 1);
      this.x = lerp(this.pounceFrom, this.pounceTo, smoothstep(t));
      this.lift = Math.sin(Math.PI * t) * 34;
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
          this.start("sit");
          this.timer = 1.2;
          this.queue = [];
        } else if (this.activity === "sit" && this.prey && this.activityClock > 1) {
          this.approachPrey();
        } else {
          this.next();
        }
      }
    }

    /* Blinks and ear twitches */
    this.nextBlink -= dt;

    if (this.nextBlink <= 0) {
      this.blink = 1;
      this.nextBlink = rand(2.5, 6);
    }

    this.blink = Math.max(0, this.blink - dt * 7);
    this.nextTwitch -= dt;

    if (this.nextTwitch <= 0) {
      this.twitch = 22;
      this.nextTwitch = rand(this.activity === "sleep" ? 6 : 8, 16);
    }

    this.twitch *= Math.exp(-dt * 9);

    /* Bat the yarn mid-swipe */
    if (this.activity === "bat") {
      const cycle = (this.activityClock % 1.2) / 1.2;
      const previous = ((this.activityClock - dt) % 1.2) / 1.2;

      if (previous < 0.45 && cycle >= 0.45) {
        this.events.bat();
      }
    }

    this.updateTail(dt);
  }

  private updateTail(dt: number) {
    const pose = this.current();
    const n = TAIL_SEGMENTS;
    const moving = this.gaitWeight;

    let sway = Math.sin(this.clock * 1.6) * 3;
    let tipFlick = 0;

    if (this.activity === "crouch") {
      // The hunter's twitching tail tip.
      tipFlick = Math.sin(this.clock * 13) * 14;
    } else if (moving > 0.1) {
      sway = Math.sin(this.phase * Math.PI * 2) * 7 * moving;
    } else if (this.activity === "sleep") {
      sway = Math.sin(this.clock * 0.7) * 1.2;
    }

    let angle = pose.tailBase;

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);

      // Bend along the length, curling more towards the tip.
      if (i > 0) {
        angle += pose.tailBend + (t > 0.6 ? pose.tailCurl : 0);
      }

      const target = angle + sway * t * 1.6 + tipFlick * Math.max(0, t - 0.7) * 3;

      // Each segment springs toward its target, lagging the one before.
      const stiffness = 60 - t * 34;
      const damping = 10;
      const force = (target - this.tail[i]) * stiffness - this.tailSpeed[i] * damping;
      this.tailSpeed[i] += force * dt;
      this.tail[i] += this.tailSpeed[i] * dt;
    }
  }

  /* ---------------------------------------------------------------- */
  /* What to draw                                                     */
  /* ---------------------------------------------------------------- */

  frame(dt: number): Frame {
    const pose = this.current();
    const breath = Math.sin(this.clock * (this.activity === "sleep" ? 1.5 : 2.4));
    const w = this.gaitWeight;
    const gait = GAITS[this.gait];

    /* Breathing */
    pose.chestR *= 1 + breath * 0.025;
    pose.back += breath * 1.1;

    /* Feet: planted while down, arcing forward while lifted */
    if (w > 0) {
      const travel = gait.stride * gait.duty;

      for (const foot of FEET) {
        const psi = (this.phase + gait.offsets[foot]) % 1;
        let dx: number;
        let dy = 0;

        if (psi < gait.duty) {
          dx = -travel / 2 + (psi / gait.duty) * travel;
        } else {
          const s = (psi - gait.duty) / (1 - gait.duty);
          dx = travel / 2 - smoothstep(s) * travel;
          dy = -Math.sin(Math.PI * s) * gait.lift;
        }

        pose[foot] = [pose[foot][0] + dx * w, pose[foot][1] + dy * w];
      }

      const bob = Math.sin(this.phase * Math.PI * 4);
      pose.chest = [pose.chest[0], pose.chest[1] + bob * 1.4 * w];
      pose.pelvis = [pose.pelvis[0], pose.pelvis[1] + Math.sin(this.phase * Math.PI * 4 + 1.6) * 1.4 * w];
      pose.head = [pose.head[0], pose.head[1] + bob * 0.6 * w];
    }

    /* Activity details */
    const t = this.activityClock;

    if (this.activity === "crouch") {
      // Bottom wiggle before the pounce.
      const wiggle = Math.sin(t * 26) * 2.4 * smoothstep(clamp(t / 1.2, 0, 1));
      pose.pelvis = [pose.pelvis[0] + wiggle, pose.pelvis[1]];
      pose.nearHind = [pose.nearHind[0] + wiggle * 0.3, 0];
      pose.farHind = [pose.farHind[0] - wiggle * 0.3, 0];
    }

    if (this.activity === "groom") {
      // Paw up to the mouth, licking.
      const lick = Math.sin(t * 9);
      pose.nearFront = [pose.head[0] + 5, pose.head[1] + 24 + lick * 2.5];
      pose.tilt += 10 + lick * 2;
      pose.eyes = 0.05;
      pose.yaw = -0.35;
    }

    if (this.activity === "bat") {
      const cycle = (t % 1.2) / 1.2;
      const swipe = cycle < 0.3 ? smoothstep(cycle / 0.3) : cycle < 0.55 ? 1 - smoothstep((cycle - 0.3) / 0.25) * 0.4 : 0.6 - smoothstep((cycle - 0.55) / 0.45) * 0.6;
      const raised: Pt = [-58, -26];
      const strike: Pt = [-74, -6];
      const reach = cycle < 0.3 ? lerpPt(pose.nearFront, raised, swipe) : lerpPt(strike, raised, 1 - swipe);
      pose.nearFront = cycle < 0.3 ? reach : lerpPt(pose.nearFront, reach, clamp(swipe * 1.6, 0, 1));
    }

    if (this.activity === "yawn") {
      const open = Math.sin(Math.PI * clamp(t / 1.7, 0, 1));
      pose.mouth = open;
      pose.eyes = 1 - open * 0.85;
      pose.tilt += open * 10;
    }

    if (this.activity === "look") {
      pose.tilt += 14;
      pose.yaw = -0.7;
    }

    /* Looking at things */
    const happy = this.clock < this.happyUntil;
    let interest = this.interest;

    if (happy) {
      interest = { point: [this.x, FLOOR_Y - 200], strength: 1, viewer: true };
    } else if (this.activity === "bat") {
      interest = { point: [this.yarnX, FLOOR_Y - 16], strength: 1 };
    } else if (this.glanceAt && this.clock < this.glanceUntil) {
      interest = { point: this.glanceAt, strength: 0.9 };
    }

    const awake = this.activity !== "sleep";
    const wanted = awake && interest ? interest.strength : 0;
    this.interestWeight += (wanted - this.interestWeight) * Math.min(1, dt * 5);

    let lookTarget: Pt = [0, 0];
    let turnTarget = 0;
    let tiltTarget = 0;

    if (interest && awake) {
      const head = this.headSpot();
      const dx = (interest.point[0] - head[0]) * this.facing;
      const dy = interest.point[1] - head[1];

      lookTarget = [clamp(dx / 70, -1, 1), clamp(dy / 70, -1, 1)];

      if (interest.viewer) {
        turnTarget = -pose.yaw;
        lookTarget = [0, 0];
      } else {
        // Turn the head towards it: ahead means profile, behind means over the shoulder.
        const yaw = clamp(-0.2 + dx / 160, -1, 0.3);
        turnTarget = yaw - pose.yaw;
        tiltTarget = clamp(-dy / 9, -12, 16);
      }
    }

    this.look = lerpPt(this.look, lookTarget, Math.min(1, dt * 8));
    this.headTurn += (turnTarget * this.interestWeight - this.headTurn) * Math.min(1, dt * 4);
    this.headTilt += (tiltTarget * this.interestWeight - this.headTilt) * Math.min(1, dt * 4);
    pose.yaw = clamp(pose.yaw + this.headTurn, -1, 0.35);
    pose.tilt += this.headTilt;

    // While turning around, she glances at you.
    const turningAmount = 1 - Math.abs(this.facing);
    pose.yaw = lerp(pose.yaw, 0, turningAmount);

    /* Pupils widen when hunting, or in the dark */
    const hunting = ["crouch", "chase", "pounce"].includes(this.activity);
    this.pupil += ((hunting ? 0.95 : 0.35) - this.pupil) * Math.min(1, dt * 3);

    return {
      pose,
      x: this.x,
      floor: FLOOR_Y,
      lift: this.lift,
      scale: SCALE,
      facing: Math.abs(this.facing) < 0.06 ? 0.06 * Math.sign(this.facing || 1) : this.facing,
      tail: this.tail,
      look: this.look,
      pupil: this.pupil,
      happy,
      blink: this.activity === "sleep" ? 0 : this.blink,
      twitch: this.twitch,
      sleeping: this.activity === "sleep",
    };
  }

  /** Whether anything is changing (so drawing can slow down while she sleeps). */
  get restful() {
    return (this.activity === "sleep" || this.activity === "loaf") && this.blend >= 1;
  }
}
