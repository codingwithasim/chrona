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
const CHASE_SPEED = 210;
/** Creeping up on something, belly low. */
const STALK_SPEED = 34;
/** Zoomies, and running for cover. */
const DASH_SPEED = 250;

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
  | "chase"
  /** Creeping up on prey, low to the ground. */
  | "stalk"
  /** Making biscuits: front paws pressing in turn, purring. */
  | "knead"
  /** Zoomies, or running off to hide. */
  | "dash"
  /** Sitting up, watching something outside the window. */
  | "watch"
  /** Thunder! A hop, every hair on end. */
  | "startle";

/** Which drawing each activity uses. */
export type ArtPose = "loaf" | "sit" | "stretch" | "walk" | "crouch";

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
  crouch: "crouch",
  stalk: "crouch",
  pounce: "walk",
  stretch: "stretch",
  knead: "loaf",
  dash: "walk",
  watch: "sit",
  startle: "walk",
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
  crouch: [0.9, 1.7],
  stalk: [0, 0],
  pounce: [0.42, 0.42],
  chase: [0, 0],
  knead: [4, 7],
  dash: [0, 0],
  watch: [5, 9],
  startle: [0.7, 0.7],
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
  stalk: [["crouch", 1]],
  pounce: [["sit", 1]],
  chase: [["crouch", 1]],
  knead: [["sleep", 0.6], ["loaf", 0.4]],
  dash: [["sit", 1]],
  watch: [["sit", 0.7], ["loaf", 0.3]],
  startle: [["sit", 1]],
};

const LYING: Activity[] = ["sleep", "loaf", "knead"];
const SITTING: Activity[] = ["sit", "groom", "look", "bat", "yawn", "watch"];

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
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export type Interest = { point: Pt; strength: number };

/** Something to hunt: the pointer wiggling on the floor, or a mouse. */
export type Prey = { point: Pt; kind: "pointer" | "mouse"; fleeing?: boolean };

/** What's ahead of her when she lands a pounce, and whether she got it. */
const PAW_REACH = 72;

export type CatEvents = {
  speak: (point: Pt, text: string) => void;
  bat: () => void;
  purr: () => void;
  /** She landed a pounce with her paws here: did she get it? */
  landed: (pawX: number) => boolean;
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

  /** Little expressions, each until a moment on her clock. */
  private talkUntil = 0;
  private slowBlinkUntil = 0;
  private puffedUntil = 0;
  private mlemUntil = 0;
  private nextMlem = rand(25, 60);
  private chattering = false;

  /** After a pounce or giving up, she takes a breath before hunting again. */
  private huntRestUntil = 0;
  private misses = 0;
  private noticed = false;

  /** Dusk is when cats get the zoomies; the room tells her the time. */
  evening = false;

  /** Something she is interested in this frame (the pointer, mostly). */
  interest: Interest | null = null;
  /** Prey to hunt (the pointer or a mouse), in scene space. */
  prey: Prey | null = null;

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
    const needsLegs = activity === "walk" || activity === "chase" || activity === "dash" || activity === "stalk";
    const down = LYING.includes(this.activity) || SITTING.includes(this.activity);

    if (needsLegs && down) {
      this.queue.unshift({ activity, target });
      activity = "stand";
    }

    this.activity = activity;
    this.activityClock = 0;

    const [min, max] = DURATION[activity];
    this.timer = activity === "stand" && this.queue.length ? 0.45 : rand(min, max);

    if (activity === "walk" || activity === "dash") {
      this.walkTo(target ?? this.pickSpot());
    }

    if (activity === "watch") {
      // Up at the window.
      this.glanceAt = [800, 380];
      this.glanceUntil = this.clock + this.timer;
    } else {
      this.chattering = false;
    }

    if (activity === "chase" && this.prey) {
      this.walkTo(this.prey.point[0]);
    }

    if (activity === "bat") {
      this.facingTarget = this.yarnX < this.x ? 1 : -1;
    }

    if (activity === "pounce") {
      this.pounceFrom = this.x;
      // Land with her front paws on it, leading a running mouse a little.
      const lead = this.prey?.fleeing ? -this.facing * 24 : 0;
      const aim = this.prey ? this.prey.point[0] + lead + this.facing * PAW_REACH * SCALE : this.x - 90 * this.facing;
      this.pounceTo = clamp(this.x + clamp(aim - this.x, -170, 170), RANGE[0], RANGE[1]);
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

    // Now and then, out of nowhere: zoomies. More likely at dusk.
    const awake = this.activity === "sit" || this.activity === "stand" || this.activity === "stretch";
    if (awake && !this.prey && Math.random() < (this.evening ? 0.09 : 0.035)) {
      this.zoomies();
      return;
    }

    let next = weighted(NEXT[this.activity]);

    // Settling into her bed, she kneads it first sometimes.
    if (next === "sleep" && this.inBed && this.activity === "loaf" && Math.random() < 0.3) {
      next = "knead";
    }

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
    return (this.activity === "sleep" || this.activity === "loaf" || this.activity === "knead") && Math.abs(this.x - BED_SPOT) < 16;
  }

  /* ---------------------------------------------------------------- */
  /* Things that happen to her                                        */
  /* ---------------------------------------------------------------- */

  pet(): Pt {
    this.happyUntil = this.clock + 2.6;
    this.events.purr();

    if (this.inBed && this.activity !== "knead" && Math.random() < 0.45) {
      // Petted in her bed: biscuits.
      this.start("knead");
      this.happyUntil = this.clock + this.timer;
    } else if (this.activity === "knead") {
      this.timer = Math.max(this.timer, 3);
      this.happyUntil = this.clock + this.timer;
    } else if (this.activity === "sleep") {
      this.start("loaf");
    } else if (this.activity === "loaf") {
      this.start("sit");
    } else if (["walk", "chase", "crouch", "stalk", "stand", "dash"].includes(this.activity)) {
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

  /** Something outside: sit up and watch it, chattering at birds. */
  watchWindow(kind: string) {
    if (this.prey || ["sleep", "dash", "startle", "walk", "chase", "pounce", "crouch", "stalk"].includes(this.activity)) {
      this.glance([800, 380], 3.5);
      return;
    }

    if (Math.random() < 0.65) {
      this.queue = [];
      this.start("watch");
      this.chattering = kind === "birds" || kind === "butterfly";

      if (this.chattering) {
        this.events.speak(this.headSpot(), pick(["ek-ek-ek…", "*chatters at the birds*", "Mrrrk! Birb!"]));
      }
    } else {
      this.glance([800, 380], 4);
    }
  }

  /** Thunder: a hop with every hair on end, then off to hide in her bed. */
  startle() {
    this.puffedUntil = this.clock + 1.6;
    this.twitches++;

    if (this.activity === "sleep") {
      // Woken with a start, but she stays put.
      this.start("loaf");
      return;
    }

    if (this.inBed) {
      return;
    }

    this.prey = null;
    this.queue = [{ activity: "dash", target: BED_SPOT }, { activity: "loaf" }];
    this.start("startle");
  }

  /** Zoomies: tear across the rug and back, then sit as if nothing happened. */
  zoomies() {
    const far = this.x < (RANGE[0] + RANGE[1]) / 2 ? RANGE[1] - rand(0, 60) : RANGE[0] + rand(0, 60);
    const back = clamp(this.x + rand(-80, 80), RANGE[0], RANGE[1]);
    this.queue = [{ activity: "dash", target: back }, { activity: "sit" }];
    this.start("dash", far);
  }

  /** You came back after a while: she trots over to say hello. */
  greet(): boolean {
    if (this.prey || this.activity === "dash" || this.activity === "startle") {
      return false;
    }

    const spot = clamp(800 + rand(-60, 60), RANGE[0], RANGE[1]);
    this.queue = [{ activity: "walk", target: spot }, { activity: "sit" }];
    this.happyUntil = this.clock + 6;
    this.start("stretch");
    return true;
  }

  /** You held still near her face: she slow-blinks back, a cat's "I love you". */
  slowBlink() {
    if (this.activity === "sleep" || this.slowBlinkUntil > this.clock) {
      return false;
    }

    this.slowBlinkUntil = this.clock + 1.6;
    this.timer = Math.max(this.timer, 2.5);
    return true;
  }

  /** She's saying something: open her mouth for a moment. */
  talk(seconds = 0.7) {
    this.talkUntil = this.clock + seconds;
  }

  /** The pointer is wiggling on the floor, or a mouse ran in: hunt it. */
  hunt(prey: Prey) {
    this.prey = prey;

    if (this.clock < this.huntRestUntil) {
      return;
    }

    if (this.activity === "sleep") {
      // A mouse may wake her (once); the pointer doesn't.
      if (prey.kind === "mouse" && !this.noticed) {
        this.noticed = true;
        this.twitches++;

        if (Math.random() < 0.75) {
          this.start("loaf");
          this.huntRestUntil = this.clock + 0.8;
        }
      }
      return;
    }

    if (["stalk", "crouch", "pounce", "chase", "startle", "dash"].includes(this.activity)) {
      return;
    }

    this.queue = [];
    this.approachPrey();
  }

  /** Turn towards the prey, but don't flip-flop when it's right below her. */
  private face(x: number) {
    const dx = x - this.x;

    if (Math.abs(dx) > 24) {
      this.facingTarget = dx < 0 ? 1 : -1;
    }
  }

  private approachPrey() {
    if (!this.prey) {
      return;
    }

    const distance = Math.abs(this.prey.point[0] - this.x);
    this.face(this.prey.point[0]);

    if (this.prey.fleeing) {
      this.start("chase");
    } else if (distance > 170) {
      this.start("stalk");
    } else {
      this.start("crouch");
    }
  }

  /** Where her front paws come down, in front of her. */
  private get pawX() {
    return this.x - this.facing * PAW_REACH * SCALE;
  }

  /** The pounce came down: a catch, or a miss (and after two, she gives up). */
  private land() {
    this.queue = [];

    if (!this.prey) {
      this.start("sit");
      return;
    }

    const caught = this.events.landed(this.pawX);

    if (caught) {
      this.misses = 0;
      this.prey = null;
      this.happyUntil = this.clock + 3;
      this.huntRestUntil = this.clock + 6;
      this.start("sit");
      return;
    }

    this.misses += 1;

    if (this.misses >= 2) {
      // Fine. She didn't want it anyway.
      this.misses = 0;
      this.huntRestUntil = this.clock + 9;
      this.start("sit");
      this.events.speak(this.headSpot(), pick(["Hmph. I wasn't even trying.", "*pretends to groom*", "I let it go. On purpose."]));
      return;
    }

    this.huntRestUntil = this.clock + 0.9;
    this.start("sit");
  }

  stopHunting() {
    this.prey = null;
    this.noticed = false;
    this.misses = 0;

    if (["crouch", "chase", "stalk"].includes(this.activity)) {
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

  /** Slow blink: eyes closed for most of it, then a soft opening. */
  get slowBlinking() {
    return this.slowBlinkUntil - this.clock > 0.5;
  }

  get puffed() {
    return this.clock < this.puffedUntil;
  }

  get kneading() {
    return this.activity === "knead";
  }

  get mouth(): "smile" | "meow" | "mlem" | "chatter" {
    if (this.activity === "watch" && this.chattering) return "chatter";
    if (this.clock < this.talkUntil) return "meow";
    if (this.activity === "sleep" && this.clock < this.mlemUntil) return "mlem";
    return "smile";
  }

  /** Pupils: wide for the hunt and the dark, slim in bright daylight. */
  pupil(daylight: boolean): "slit" | "normal" | "wide" {
    if (this.prey || ["crouch", "stalk", "chase", "pounce", "dash", "startle", "watch", "bat"].includes(this.activity) || this.puffed) {
      return "wide";
    }

    return daylight ? "slit" : this.evening ? "wide" : "normal";
  }

  headSpot(): Pt {
    const head = HEAD_SPOT[this.pose];
    return [this.x + head.x * SCALE * this.facing, FLOOR_Y - this.lift + head.y * SCALE];
  }

  /** Where she is looking, relative to her head (-1 to 1), or null for "at you". */
  gaze(): Pt | null {
    if ((this.happy && this.activity !== "watch") || this.activity === "sleep" || this.activity === "knead") {
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
    const turnRate = this.activity === "chase" || this.activity === "dash" || this.prey ? 9 : 5;
    this.facing += clamp(this.facingTarget - this.facing, -turnRate * dt, turnRate * dt);
    const turning = Math.abs(this.facing - this.facingTarget) > 0.05;

    /* Walking and chasing */
    const moving = this.activity === "walk" || this.activity === "chase" || this.activity === "dash" || this.activity === "stalk";

    if (moving) {
      if ((this.activity === "chase" || this.activity === "stalk") && this.prey) {
        const side = Math.sign(this.prey.point[0] - this.x || 1);
        this.walkTo(this.prey.point[0] - side * (this.activity === "stalk" ? 130 : 110));

        // Close enough: drop into a crouch.
        if (this.activity === "stalk" && Math.abs(this.prey.point[0] - this.x) < 150) {
          this.start("crouch");
        }

        // Running it down: leap when it's in reach.
        if (this.activity === "chase" && this.prey.fleeing && Math.abs(this.prey.point[0] - this.x) < 165 && Math.random() < 0.5) {
          this.start("pounce");
        }
      }

      const top =
        this.activity === "dash"
          ? DASH_SPEED
          : this.activity === "chase"
            ? CHASE_SPEED
            : this.activity === "stalk"
              ? // Quick and quiet from afar, slow and careful up close.
                this.prey && Math.abs(this.prey.point[0] - this.x) > 270
                ? STALK_SPEED * 2.1
                : STALK_SPEED
              : WALK_SPEED;
      const remaining = this.targetX - this.x;
      // Ease in, and slow down on arrival.
      const wanted = turning ? 0 : Math.min(top, Math.abs(remaining) * 2.2 + 8);
      const accel = this.activity === "dash" ? 4 : 1.8;
      this.speed += clamp(wanted - this.speed, -top * 2.5 * dt, top * accel * dt);
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

      // Mid-leap she can still twist a little towards it.
      if (this.prey && t < 0.6) {
        const want = this.prey.point[0] + this.facing * PAW_REACH * SCALE;
        this.pounceTo += clamp(want - this.pounceTo, -220 * dt, 220 * dt);
      }

      this.x = lerp(this.pounceFrom, this.pounceTo, smoothstep(t));
      this.lift = Math.sin(Math.PI * t) * 30;
    } else if (this.activity === "startle" && this.activityClock < 0.42) {
      // Straight up in the air, all four paws.
      this.lift = Math.sin((Math.PI * this.activityClock) / 0.42) * 28;
    } else {
      // Kneading in her bed, she rises onto the rim so her paws show.
      const rest = this.activity === "knead" && Math.abs(this.x - BED_SPOT) < 16 ? 17 : 0;
      this.lift += (rest - this.lift) * Math.min(1, dt * (rest ? 4 : 12));
    }

    /* Activity timer */
    if (!moving) {
      this.timer -= dt;

      if (this.activity === "crouch" && this.prey) {
        this.face(this.prey.point[0]);

        const distance = Math.abs(this.prey.point[0] - this.x);

        // It wandered right up to her, or it's bolting: now!
        if ((distance < 105 || this.prey.fleeing) && this.activityClock > 0.25 && distance < 175) {
          this.start("pounce");
        } else if (distance > 230 && this.activityClock > 0.5) {
          // Slipped away: after it again.
          this.approachPrey();
        }
      }

      if (this.timer <= 0) {
        if (this.activity === "pounce") {
          this.land();
        } else if (this.activity === "sit" && this.prey && this.clock > this.huntRestUntil) {
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

    /* A forgotten tongue tip in her sleep, now and then */
    if (this.activity === "sleep") {
      this.nextMlem -= dt;

      if (this.nextMlem <= 0) {
        this.mlemUntil = this.clock + rand(2.5, 5);
        this.nextMlem = rand(30, 70);
      }
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
  get legs(): "still" | "walk" | "run" | "stalk" {
    if (this.activity === "chase" || this.activity === "pounce" || (this.activity === "dash" && this.speed > 4)) {
      return "run";
    }

    if (this.activity === "stalk" && this.speed > 2) {
      return "stalk";
    }

    return this.activity === "walk" && this.speed > 4 ? "walk" : "still";
  }
}
