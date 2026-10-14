"use client";

import { useEffect, useRef, useState } from "react";

import { playSfx } from "@/lib/sfx";
import { useDialogueStore } from "@/stores/dialogue-store";

import {
  CatDefs,
  type Eyes,
  HEAD_SPOT,
  LoafPose,
  type Look,
  SitPose,
  StretchPose,
  WalkPose,
} from "./cat-art";
import {
  floatStyle,
  OUTSIDE_EVENT,
  pick,
  pivot,
  useParticles,
  usePoke,
  useSpeak,
} from "./scene-shared";

/* ------------------------------------------------------------------ */
/* Where she can go                                                    */
/* ------------------------------------------------------------------ */

/** The floor line along the rug, and how big she is drawn there. */
const FLOOR_Y = 880;
const SCALE = 0.86;

/** She wanders the rug, mostly left of the tool card. */
const RANGE: [number, number] = [470, 1010];
const HOME_X = 820;
const SPEED = 62; // units per second

/** How far her paw reaches when batting, from her middle. */
const BAT_REACH = 104 * SCALE;

/* ------------------------------------------------------------------ */
/* Brain                                                               */
/* ------------------------------------------------------------------ */

type Activity =
  | "sleep"
  | "rest"
  | "yawn-rest"
  | "stretch"
  | "sit"
  | "groom"
  | "bat"
  | "yawn-sit"
  | "walk";

type Pose = "loaf" | "sit" | "stretch" | "walk";
type Facing = "left" | "right";

const POSE: Record<Activity, Pose> = {
  sleep: "loaf",
  rest: "loaf",
  "yawn-rest": "loaf",
  stretch: "stretch",
  sit: "sit",
  groom: "sit",
  bat: "sit",
  "yawn-sit": "sit",
  walk: "walk",
};

/** [min, max] seconds for each activity (walks last as long as they need). */
const DURATION: Record<Activity, [number, number]> = {
  sleep: [24, 60],
  rest: [8, 16],
  "yawn-rest": [1.8, 1.8],
  stretch: [2.6, 2.6],
  sit: [8, 16],
  groom: [4, 7],
  bat: [1.3, 1.3],
  "yawn-sit": [1.8, 1.8],
  walk: [0, 0],
};

const NEXT: Record<Activity, Array<[Activity, number]>> = {
  sleep: [["rest", 0.45], ["stretch", 0.3], ["sleep", 0.25]],
  rest: [["sleep", 0.4], ["sit", 0.4], ["yawn-rest", 0.2]],
  "yawn-rest": [["rest", 0.5], ["sleep", 0.5]],
  stretch: [["walk", 0.55], ["sit", 0.45]],
  sit: [["walk", 0.3], ["rest", 0.25], ["groom", 0.2], ["bat", 0.15], ["yawn-sit", 0.1]],
  groom: [["sit", 1]],
  bat: [["sit", 0.7], ["bat", 0.3]],
  "yawn-sit": [["sit", 1]],
  walk: [["sit", 0.55], ["rest", 0.3], ["groom", 0.15]],
};

const LOOKS: Array<[Look, number]> = [
  ["viewer", 0.35],
  ["window", 0.3],
  ["left", 0.15],
  ["right", 0.15],
  ["down", 0.05],
];

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

type Walk = { from: number; start: number; duration: number };

type CatState = {
  activity: Activity;
  x: number;
  facing: Facing;
  walk: Walk | null;
  /** What to do on arrival, when walking somewhere on purpose. */
  then: Activity | null;
};

function walkTo(state: CatState, target: number, then: Activity | null): CatState {
  const x = Math.min(RANGE[1], Math.max(RANGE[0], target));
  const distance = Math.abs(x - state.x);

  if (distance < 8) {
    return { ...state, activity: then ?? "sit", walk: null, then: null };
  }

  return {
    activity: "walk",
    x,
    facing: x < state.x ? "left" : "right",
    walk: { from: state.x, start: performance.now(), duration: (distance / SPEED) * 1000 },
    then,
  };
}

/** Where she is right now, even halfway through a walk. */
function currentX(state: CatState) {
  if (!state.walk) {
    return state.x;
  }

  const t = Math.min(1, (performance.now() - state.walk.start) / state.walk.duration);
  return state.walk.from + (state.x - state.walk.from) * t;
}

function plan(state: CatState, yarnX: number): CatState {
  if (state.then) {
    const activity = state.then;
    const facing: Facing = activity === "bat" ? (yarnX > state.x ? "right" : "left") : state.facing;
    return { ...state, activity, facing, walk: null, then: null };
  }

  const next = weighted(NEXT[state.activity]);

  if (next === "bat") {
    // Go over to the yarn first, approaching from whichever side is closer.
    const side = state.x < yarnX ? -1 : 1;
    const spot = yarnX + side * BAT_REACH;

    if (Math.abs(spot - state.x) > 12) {
      return walkTo(state, spot, "bat");
    }

    return { ...state, activity: "bat", facing: yarnX > state.x ? "right" : "left", walk: null };
  }

  if (next === "walk") {
    let target = rand(RANGE[0], RANGE[1]);

    // Make it a real stroll, not a shuffle.
    if (Math.abs(target - state.x) < 120) {
      target = state.x + (state.x > (RANGE[0] + RANGE[1]) / 2 ? -1 : 1) * rand(140, 300);
    }

    return walkTo(state, target, null);
  }

  return { ...state, activity: next, walk: null };
}

function useCatBrain(onBat: () => void, yarnX: number) {
  const [state, setState] = useState<CatState>({
    activity: "sleep",
    x: HOME_X,
    facing: "left",
    walk: null,
    then: null,
  });
  const [look, setLook] = useState<Look>("viewer");
  const [blink, setBlink] = useState(false);
  const [happy, setHappy] = useState(false);
  const [earPoke, twitchEar] = usePoke();

  // Bump to restart the current activity's timer after an interaction.
  const [epoch, setEpoch] = useState(0);

  const latest = useRef({ state, onBat, yarnX });

  useEffect(() => {
    latest.current = { state, onBat, yarnX };
  });

  const { activity } = state;
  const awake = activity !== "sleep";
  const eyesOpenActivity =
    activity === "rest" || activity === "sit" || activity === "bat" || activity === "walk";

  // Move from one activity to the next.
  useEffect(() => {
    const [min, max] = DURATION[activity];
    const delay = state.walk ? state.walk.duration : rand(min, max) * 1000;

    const id = window.setTimeout(() => {
      const { state: current, yarnX: yarn } = latest.current;
      setState(plan(current, yarn));
    }, delay);

    return () => window.clearTimeout(id);
  }, [activity, state.walk, epoch]);

  // Batting the yarn kicks it.
  useEffect(() => {
    if (activity === "bat") {
      const id = window.setTimeout(() => latest.current.onBat(), 350);
      return () => window.clearTimeout(id);
    }
  }, [activity, epoch]);

  // Glance around while awake.
  useEffect(() => {
    if (!eyesOpenActivity) {
      return;
    }

    let id = 0;

    const glance = () => {
      setLook(weighted(LOOKS));
      id = window.setTimeout(glance, rand(2500, 6000));
    };

    id = window.setTimeout(glance, rand(1500, 4000));
    return () => window.clearTimeout(id);
  }, [eyesOpenActivity]);

  // Blink now and then.
  useEffect(() => {
    if (!eyesOpenActivity) {
      return;
    }

    let id = 0;

    const loop = () => {
      setBlink(true);
      id = window.setTimeout(() => {
        setBlink(false);
        id = window.setTimeout(loop, rand(2500, 6000));
      }, 160);
    };

    id = window.setTimeout(loop, rand(1500, 4000));
    return () => window.clearTimeout(id);
  }, [eyesOpenActivity]);

  // Ears twitch in her sleep.
  useEffect(() => {
    if (awake) {
      return;
    }

    let id = 0;

    const loop = () => {
      twitchEar();
      id = window.setTimeout(loop, rand(6000, 15000));
    };

    id = window.setTimeout(loop, rand(4000, 9000));
    return () => window.clearTimeout(id);
    // twitchEar only bumps a counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awake]);

  // Something interesting outside? Look at the window.
  useEffect(() => {
    function onOutside() {
      const current = latest.current.state;

      if (current.activity === "sleep") {
        twitchEar();

        if (Math.random() < 0.3) {
          setState({ ...current, activity: "rest" });
          setLook("window");
        }

        return;
      }

      setLook("window");

      if (current.activity === "rest" && Math.random() < 0.4) {
        setState({ ...current, activity: "sit" });
      }
    }

    window.addEventListener(OUTSIDE_EVENT, onOutside);
    return () => window.removeEventListener(OUTSIDE_EVENT, onOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A message box popped up: wake up and look at you.
  const dialogueOpen = useDialogueStore((state) => state.current !== null);

  useEffect(() => {
    if (!dialogueOpen) {
      return;
    }

    const id = window.setTimeout(() => {
      const current = latest.current.state;

      if (current.activity === "sleep") {
        setState({ ...current, activity: "rest" });
      }

      setLook("viewer");
    }, 0);

    return () => window.clearTimeout(id);
  }, [dialogueOpen]);

  function pet() {
    const current = latest.current.state;

    if (current.activity === "sleep") {
      setState({ ...current, activity: "rest" });
    } else if (current.activity === "rest") {
      setState({ ...current, activity: "sit" });
    } else if (current.activity === "walk") {
      // Stop right where she is for a scratch.
      setState({ ...current, activity: "sit", x: currentX(current), walk: null, then: null });
    }

    setLook("viewer");
    setHappy(true);
    setEpoch((value) => value + 1);
    window.setTimeout(() => setHappy(false), 2600);
  }

  const pose = POSE[activity];

  let eyes: Eyes = "open";

  if (happy) {
    eyes = "happy";
  } else if (activity === "sleep" || activity === "groom") {
    eyes = "closed";
  } else if (activity === "stretch" || activity.startsWith("yawn")) {
    eyes = "squint";
  } else if (blink) {
    eyes = "closed";
  } else if (activity === "rest") {
    eyes = "half";
  }

  let gaze = look;

  if (activity === "groom") {
    gaze = "down";
  } else if (activity === "bat") {
    // The art faces left; mirrored, "left" points at the yarn either way.
    gaze = "left";
  } else if (activity === "walk") {
    gaze = look === "window" ? "window" : "left";
  }

  return {
    activity,
    pose,
    x: state.x,
    facing: state.facing,
    walk: state.walk,
    look: gaze,
    eyes,
    yawning: activity.startsWith("yawn") || activity === "stretch",
    earPoke,
    pet,
    now: () => currentX(latest.current.state),
  };
}

/* ------------------------------------------------------------------ */

const ZZZ = [
  { dx: 4, dy: -36, size: 16, char: "z" },
  { dx: 8, dy: -40, size: 22, char: "z" },
  { dx: 12, dy: -44, size: 28, char: "Z" },
];

/** Mochi, the calico who lives on the rug. */
export function Cat({ onBat, yarnX }: { onBat: () => void; yarnX: number }) {
  const speak = useSpeak();
  const brain = useCatBrain(onBat, yarnX);
  const [pets, setPets] = useState(0);
  const [hearts, burst] = useParticles();

  const sign = brain.facing === "left" ? 1 : -1;
  const head = HEAD_SPOT[brain.pose];

  /** Her head, in scene coordinates, at a given x. */
  const headAt = (x: number) => ({
    x: x + head.x * SCALE * sign,
    y: FLOOR_Y + head.y * SCALE,
  });

  function pet() {
    const count = pets + 1;
    const spot = headAt(brain.now());

    setPets(count);
    brain.pet();
    burst(spot.x, spot.y - 50, 3, 70);
    playSfx("purr");

    speak(
      spot.x,
      spot.y - 56,
      count % 10 === 0 ? `That's ${count} pets! We're best friends now. 🐾` : pick(CAT_LINES)
    );
  }

  const zzz = headAt(brain.x);

  return (
    <g>
      <CatDefs />

      <g
        style={{
          transform: `translate(${brain.x}px, ${FLOOR_Y}px)`,
          transition: brain.walk ? `transform ${Math.round(brain.walk.duration)}ms linear` : "none",
        }}
      >
        <g transform={`scale(${sign * SCALE} ${SCALE})`}>
          <g className="sc-hit" onClick={pet}>
            <g key={brain.pose} className="sc-pose-in">
              {brain.pose === "loaf" && (
                <LoafPose
                  eyes={brain.eyes}
                  look={brain.look}
                  yawning={brain.yawning}
                  earPoke={brain.earPoke}
                  sleeping={brain.activity === "sleep"}
                />
              )}
              {brain.pose === "sit" && (
                <SitPose
                  eyes={brain.eyes}
                  look={brain.look}
                  yawning={brain.yawning}
                  earPoke={brain.earPoke}
                  activity={brain.activity}
                />
              )}
              {brain.pose === "stretch" && <StretchPose earPoke={brain.earPoke} />}
              {brain.pose === "walk" && (
                <WalkPose
                  eyes={brain.eyes}
                  look={brain.look}
                  yawning={false}
                  earPoke={brain.earPoke}
                />
              )}
            </g>
          </g>
        </g>
      </g>

      {brain.activity === "sleep" && (
        <g fill="var(--lavender)" fontWeight="500" style={{ fontFamily: "var(--font-kiwi)", pointerEvents: "none" }}>
          {ZZZ.map((z, index) => (
            <text
              key={index}
              x={Math.round(zzz.x + z.dx * sign)}
              y={Math.round(zzz.y + z.dy)}
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
  );
}
