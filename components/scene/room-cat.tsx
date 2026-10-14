"use client";

import { useEffect, useRef, useState } from "react";

import { playSfx } from "@/lib/sfx";
import { useDialogueStore } from "@/stores/dialogue-store";

import {
  floatStyle,
  LINE,
  OUTSIDE_EVENT,
  pick,
  pivot,
  useParticles,
  usePoke,
  useSpeak,
} from "./scene-shared";

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
  | "yawn-sit";

type Pose = "loaf" | "sit" | "stretch";
type Look = "viewer" | "window" | "left" | "right" | "down";
type Eyes = "open" | "half" | "closed" | "happy" | "squint";

const POSE: Record<Activity, Pose> = {
  sleep: "loaf",
  rest: "loaf",
  "yawn-rest": "loaf",
  stretch: "stretch",
  sit: "sit",
  groom: "sit",
  bat: "sit",
  "yawn-sit": "sit",
};

/** [min, max] seconds for each activity. */
const DURATION: Record<Activity, [number, number]> = {
  sleep: [24, 60],
  rest: [8, 16],
  "yawn-rest": [1.8, 1.8],
  stretch: [2.6, 2.6],
  sit: [9, 18],
  groom: [4, 7],
  bat: [1.3, 1.3],
  "yawn-sit": [1.8, 1.8],
};

const NEXT: Record<Activity, Array<[Activity, number]>> = {
  sleep: [["rest", 0.45], ["stretch", 0.3], ["sleep", 0.25]],
  rest: [["sleep", 0.45], ["sit", 0.35], ["yawn-rest", 0.2]],
  "yawn-rest": [["rest", 0.5], ["sleep", 0.5]],
  stretch: [["sit", 1]],
  sit: [["groom", 0.25], ["bat", 0.2], ["yawn-sit", 0.15], ["rest", 0.4]],
  groom: [["sit", 1]],
  bat: [["sit", 1]],
  "yawn-sit": [["sit", 1]],
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

function useCatBrain(onBat: () => void) {
  const [activity, setActivity] = useState<Activity>("sleep");
  const [look, setLook] = useState<Look>("viewer");
  const [blink, setBlink] = useState(false);
  const [happy, setHappy] = useState(false);
  const [earPoke, twitchEar] = usePoke();

  // Bump to restart the current activity's timer after an interaction.
  const [epoch, setEpoch] = useState(0);

  const latest = useRef({ activity, onBat });

  useEffect(() => {
    latest.current = { activity, onBat };
  });

  const awake = activity !== "sleep";
  const eyesOpenActivity =
    activity === "rest" || activity === "sit" || activity === "bat";

  // Move from one activity to the next.
  useEffect(() => {
    const [min, max] = DURATION[activity];
    const id = window.setTimeout(
      () => setActivity(weighted(NEXT[activity])),
      rand(min, max) * 1000
    );

    return () => window.clearTimeout(id);
  }, [activity, epoch]);

  // Batting the yarn kicks it.
  useEffect(() => {
    if (activity === "bat") {
      const id = window.setTimeout(() => latest.current.onBat(), 350);
      return () => window.clearTimeout(id);
    }
  }, [activity]);

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
      const current = latest.current.activity;

      if (current === "sleep") {
        twitchEar();

        if (Math.random() < 0.3) {
          setActivity("rest");
          setLook("window");
        }

        return;
      }

      setLook("window");

      if (current === "rest" && Math.random() < 0.4) {
        setActivity("sit");
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
      if (latest.current.activity === "sleep") {
        setActivity("rest");
      }

      setLook("viewer");
    }, 0);

    return () => window.clearTimeout(id);
  }, [dialogueOpen]);

  function pet() {
    const current = latest.current.activity;

    if (current === "sleep") {
      setActivity("rest");
    } else if (current === "rest") {
      setActivity("sit");
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

  return {
    activity,
    pose,
    look: activity === "groom" ? "down" : activity === "bat" ? "right" : look,
    eyes,
    yawning: activity.startsWith("yawn") || activity === "stretch",
    earPoke,
    pet,
  };
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const LOOK_OFFSET: Record<Look, { dx: number; dy: number; tilt: number }> = {
  viewer: { dx: 0, dy: 0, tilt: 0 },
  window: { dx: -1.8, dy: -2.8, tilt: -8 },
  left: { dx: -2.6, dy: 0, tilt: -3 },
  right: { dx: 2.6, dy: 0.4, tilt: 5 },
  down: { dx: 0, dy: 2.2, tilt: 7 },
};

const FUR = "var(--sc-cat)";
const OUTLINE = { stroke: LINE, strokeWidth: 2, strokeOpacity: 0.75, strokeLinejoin: "round" as const };

function Eye({ cx, cy, eyes, look, mirror }: { cx: number; cy: number; eyes: Eyes; look: Look; mirror?: boolean }) {
  const { dx, dy } = LOOK_OFFSET[look];
  const line = { stroke: LINE, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const, strokeOpacity: 0.85 };

  if (eyes === "closed") {
    return <path d={`M${cx - 7} ${cy} Q ${cx} ${cy + 5} ${cx + 7} ${cy}`} {...line} />;
  }

  if (eyes === "happy") {
    return <path d={`M${cx - 7} ${cy + 2} Q ${cx} ${cy - 5} ${cx + 7} ${cy + 2}`} {...line} />;
  }

  if (eyes === "squint") {
    const s = mirror ? -1 : 1;
    return <path d={`M${cx - 6 * s} ${cy - 3.5} L ${cx + 5 * s} ${cy} L ${cx - 6 * s} ${cy + 3.5}`} {...line} />;
  }

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="6.6" ry="8" fill="#2a1e22" />
      <ellipse cx={cx} cy={cy + 0.6} rx="5.4" ry="6.8" fill="#e3a93f" />
      <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 450ms ease" }}>
        <ellipse cx={cx} cy={cy} rx="2.8" ry="6" fill="#1a1214" />
        <circle cx={cx - 1.9} cy={cy - 2.8} r="1.9" fill="#ffffff" />
        <circle cx={cx + 1.7} cy={cy + 2.6} r="0.9" fill="#ffffff" opacity="0.8" />
      </g>
      {eyes === "half" && (
        <path
          d={`M${cx - 8} ${cy - 9} H${cx + 8} V${cy - 1} Q ${cx} ${cy + 1.5} ${cx - 8} ${cy - 1} Z`}
          fill={FUR}
          stroke={LINE}
          strokeOpacity="0.6"
          strokeWidth="1.4"
        />
      )}
    </g>
  );
}

/** The head, drawn around (0, 0). */
function Head({
  eyes,
  look,
  yawning,
  licking,
  earPoke,
}: {
  eyes: Eyes;
  look: Look;
  yawning: boolean;
  licking?: boolean;
  earPoke: number;
}) {
  return (
    <g>
      {/* Ears */}
      <g key={earPoke} className={earPoke ? "sc-ear" : undefined} style={pivot("50% 100%")}>
        <path d="M-37 -10 L-31 -50 L-5 -27 Z" fill="var(--sc-cat-patch)" {...OUTLINE} />
        <path d="M-31 -18 L-28 -40 L-14 -26 Z" fill="#f5a3b5" />
      </g>
      <path d="M7 -28 L34 -52 L39 -10 Z" fill={FUR} {...OUTLINE} />
      <path d="M14 -26 L31 -44 L33 -17 Z" fill="#f5a3b5" />

      <ellipse cx="0" cy="0" rx="44" ry="38" fill={FUR} {...OUTLINE} />
      <path d="M-43 -6 Q -31 -36 -5 -35 Q -21 -22 -29 6 Z" fill="var(--sc-cat-patch)" />
      <ellipse cx="0" cy="0" rx="44" ry="38" fill="url(#sc-fur)" />
      <ellipse cx="0" cy="22" rx="24" ry="12" fill="#ffffff" opacity="0.35" />

      <Eye cx={-16} cy={2} eyes={eyes} look={look} />
      <Eye cx={16} cy={2} eyes={eyes} look={look} mirror />

      <ellipse cx="-28" cy="15" rx="7" ry="4" fill="#f5a3b5" opacity="0.75" />
      <ellipse cx="28" cy="15" rx="7" ry="4" fill="#f5a3b5" opacity="0.75" />

      <path d="M-3.2 12 L3.2 12 L0 15.8 Z" fill="#f08aa3" />
      <circle cx="-1" cy="12.6" r="0.9" fill="#ffffff" opacity="0.8" />

      {yawning ? (
        <g>
          <ellipse cx="0" cy="23" rx="7" ry="9" fill="#7a3a4a" stroke={LINE} strokeOpacity="0.7" strokeWidth="1.4" />
          <ellipse cx="0" cy="28" rx="4.5" ry="3" fill="#f08aa3" />
          <path d="M-5 16 L-4 19.5 L-3 16 Z M3 16 L4 19.5 L5 16 Z" fill="#ffffff" />
        </g>
      ) : (
        <path d="M-6 18 Q -3 21.5 0 18 Q 3 21.5 6 18" fill="none" stroke={LINE} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {licking && <ellipse cx="0" cy="21.5" rx="3" ry="2.4" fill="#f08aa3" className="sc-lick" />}

      <g stroke={LINE} strokeOpacity="0.35" strokeWidth="0.9" strokeLinecap="round">
        <line x1="-22" y1="14" x2="-54" y2="8" />
        <line x1="-22" y1="18" x2="-52" y2="21" />
        <line x1="22" y1="14" x2="54" y2="8" />
        <line x1="22" y1="18" x2="52" y2="21" />
      </g>
    </g>
  );
}

function HeadAt({
  x,
  y,
  scale,
  look,
  ...head
}: {
  x: number;
  y: number;
  scale: number;
  look: Look;
  eyes: Eyes;
  yawning: boolean;
  licking?: boolean;
  earPoke: number;
}) {
  const tilt = LOOK_OFFSET[look].tilt;

  return (
    <g
      style={{
        transform: `rotate(${tilt}deg)`,
        transformOrigin: `${x}px ${y + 34 * scale}px`,
        transition: "transform 500ms ease",
      }}
    >
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <Head look={look} {...head} />
      </g>
    </g>
  );
}

function LoafPose({ eyes, look, yawning, earPoke, sleeping }: { eyes: Eyes; look: Look; yawning: boolean; earPoke: number; sleeping: boolean }) {
  return (
    <g>
      <defs>
        <clipPath id="sc-cat-loaf">
          <ellipse cx="968" cy="830" rx="112" ry="48" />
        </clipPath>
      </defs>

      <ellipse cx="958" cy="880" rx="134" ry="11" fill="url(#sc-drop-shadow)" />

      <g className="sc-tail" style={{ ...pivot("100% 0%"), animationDuration: sleeping ? "3.4s" : "1.6s" }}>
        <path d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866" fill="none" stroke={LINE} strokeOpacity="0.75" strokeWidth="21" strokeLinecap="round" />
        <path d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866" fill="none" stroke={FUR} strokeWidth="16.5" strokeLinecap="round" />
        <path d="M890 872 C 882 870 876 868 872 866" fill="none" stroke="var(--sc-cat-patch-2)" strokeWidth="14" strokeLinecap="round" />
      </g>

      <g className="sc-breathe" style={{ ...pivot("50% 100%"), animationDuration: sleeping ? "4s" : "3s" }}>
        <ellipse cx="968" cy="830" rx="112" ry="48" fill={FUR} {...OUTLINE} />
        <g clipPath="url(#sc-cat-loaf)">
          <ellipse cx="1012" cy="796" rx="56" ry="32" fill="var(--sc-cat-patch)" />
          <ellipse cx="935" cy="806" rx="26" ry="16" fill="var(--sc-cat-patch-2)" />
          <ellipse cx="968" cy="870" rx="122" ry="18" fill="var(--sc-cat-shade)" opacity="0.7" />
          <ellipse cx="968" cy="830" rx="112" ry="48" fill="url(#sc-fur)" />
          <path d="M920 800 Q 960 790 1010 794" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.35" />
        </g>
        <path d="M1040 838 Q 1052 852 1046 866" fill="none" stroke={LINE} strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <HeadAt x={868} y={832} scale={1.07} eyes={eyes} look={look} yawning={yawning} earPoke={earPoke} />

      <ellipse cx="846" cy="870" rx="17" ry="9" fill={FUR} {...OUTLINE} />
      <ellipse cx="884" cy="872" rx="17" ry="9" fill={FUR} {...OUTLINE} />

      {sleeping && (
        <g fill="var(--lavender)" fontWeight="500" style={{ fontFamily: "var(--font-kiwi)" }}>
          {[
            { x: 910, y: 790, size: 16, char: "z" },
            { x: 914, y: 786, size: 22, char: "z" },
            { x: 918, y: 782, size: 28, char: "Z" },
          ].map((z, index) => (
            <text
              key={index}
              x={z.x}
              y={z.y}
              fontSize={z.size}
              className="sc-zzz"
              style={{ ...pivot("50% 50%"), animationDelay: `${index * 1.1}s`, opacity: 0 }}
            >
              {z.char}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

function SitPose({ eyes, look, yawning, earPoke, activity }: { eyes: Eyes; look: Look; yawning: boolean; earPoke: number; activity: Activity }) {
  const grooming = activity === "groom";
  const batting = activity === "bat";

  return (
    <g>
      <defs>
        <clipPath id="sc-cat-sit">
          <path d="M908 880 C 900 850 902 812 918 790 C 930 772 948 766 962 768 C 984 772 1000 790 1006 816 C 1012 842 1014 866 1006 880 Z" />
          <ellipse cx="992" cy="848" rx="34" ry="32" />
        </clipPath>
      </defs>

      <ellipse cx="962" cy="882" rx="90" ry="9" fill="url(#sc-drop-shadow)" />

      {/* Tail curled around the paws */}
      <g className="sc-tail" style={{ ...pivot("100% 0%"), animationDuration: batting ? "0.5s" : "1.8s" }}>
        <path d="M1010 864 C 1036 878 1012 893 962 891 C 932 890 912 886 898 878" fill="none" stroke={LINE} strokeOpacity="0.75" strokeWidth="19" strokeLinecap="round" />
        <path d="M1010 864 C 1036 878 1012 893 962 891 C 932 890 912 886 898 878" fill="none" stroke={FUR} strokeWidth="14.5" strokeLinecap="round" />
        <path d="M914 885 C 906 882 900 880 898 878" fill="none" stroke="var(--sc-cat-patch-2)" strokeWidth="12" strokeLinecap="round" />
      </g>

      <g className="sc-breathe" style={{ ...pivot("50% 100%"), animationDuration: "3.2s" }}>
        <ellipse cx="992" cy="848" rx="34" ry="32" fill={FUR} {...OUTLINE} />
        <path d="M908 880 C 900 850 902 812 918 790 C 930 772 948 766 962 768 C 984 772 1000 790 1006 816 C 1012 842 1014 866 1006 880 Z" fill={FUR} {...OUTLINE} />
        <g clipPath="url(#sc-cat-sit)">
          <ellipse cx="1004" cy="822" rx="32" ry="28" fill="var(--sc-cat-patch)" />
          <ellipse cx="978" cy="790" rx="14" ry="10" fill="var(--sc-cat-patch-2)" />
          <ellipse cx="958" cy="876" rx="70" ry="12" fill="var(--sc-cat-shade)" opacity="0.6" />
          <rect x="890" y="760" width="140" height="130" fill="url(#sc-fur)" />
        </g>
        <ellipse cx="944" cy="808" rx="17" ry="24" fill="#fffaf4" opacity="0.85" />
      </g>

      {/* Front legs */}
      <rect x="921" y="816" width="17" height="60" rx="8.5" fill={FUR} {...OUTLINE} />
      <ellipse cx="930" cy="876" rx="11.5" ry="6" fill={FUR} {...OUTLINE} />

      {!grooming && !batting && (
        <>
          <rect x="946" y="818" width="17" height="58" rx="8.5" fill={FUR} {...OUTLINE} />
          <ellipse cx="955" cy="877" rx="11.5" ry="6" fill={FUR} {...OUTLINE} />
        </>
      )}

      <g stroke={LINE} strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round">
        <line x1="927" y1="874" x2="927" y2="879" />
        <line x1="933" y1="874" x2="933" y2="879" />
      </g>

      {batting && (
        <g>
          <path d="M962 812 Q 1022 818 1082 862" fill="none" stroke={LINE} strokeOpacity="0.75" strokeWidth="19" strokeLinecap="round" />
          <path d="M962 812 Q 1022 818 1082 862" fill="none" stroke={FUR} strokeWidth="14.5" strokeLinecap="round" />
          <circle cx="1086" cy="864" r="9" fill={FUR} {...OUTLINE} />
        </g>
      )}

      <HeadAt
        x={950}
        y={736}
        scale={0.95}
        eyes={eyes}
        look={look}
        yawning={yawning}
        licking={grooming}
        earPoke={earPoke}
      />

      {grooming && (
        <g className="sc-lick">
          <path d="M962 812 Q 972 784 952 762" fill="none" stroke={LINE} strokeOpacity="0.75" strokeWidth="19" strokeLinecap="round" />
          <path d="M962 812 Q 972 784 952 762" fill="none" stroke={FUR} strokeWidth="14.5" strokeLinecap="round" />
          <circle cx="950" cy="760" r="9" fill={FUR} {...OUTLINE} />
          <ellipse cx="947" cy="757" rx="3" ry="2" fill="#f5a3b5" />
        </g>
      )}
    </g>
  );
}

function StretchPose({ earPoke }: { earPoke: number }) {
  return (
    <g>
      <defs>
        <clipPath id="sc-cat-stretch">
          <path d="M1048 880 C 1056 846 1050 808 1024 798 C 996 790 966 812 940 836 C 920 852 900 862 880 868 L 878 880 Z" />
        </clipPath>
      </defs>

      <ellipse cx="950" cy="882" rx="150" ry="9" fill="url(#sc-drop-shadow)" />

      <g className="sc-tail" style={{ ...pivot("0% 100%"), animationDuration: "1.2s" }}>
        <path d="M1040 808 C 1066 772 1060 738 1076 716" fill="none" stroke={LINE} strokeOpacity="0.75" strokeWidth="19" strokeLinecap="round" />
        <path d="M1040 808 C 1066 772 1060 738 1076 716" fill="none" stroke={FUR} strokeWidth="14.5" strokeLinecap="round" />
        <path d="M1070 728 C 1072 722 1074 718 1076 716" fill="none" stroke="var(--sc-cat-patch-2)" strokeWidth="12" strokeLinecap="round" />
      </g>

      <path d="M1048 880 C 1056 846 1050 808 1024 798 C 996 790 966 812 940 836 C 920 852 900 862 880 868 L 878 880 Z" fill={FUR} {...OUTLINE} />
      <g clipPath="url(#sc-cat-stretch)">
        <ellipse cx="1020" cy="812" rx="40" ry="24" fill="var(--sc-cat-patch)" />
        <ellipse cx="960" cy="880" rx="100" ry="14" fill="var(--sc-cat-shade)" opacity="0.6" />
        <rect x="870" y="790" width="190" height="95" fill="url(#sc-fur)" />
      </g>

      <ellipse cx="1030" cy="878" rx="12" ry="6" fill={FUR} {...OUTLINE} />
      <ellipse cx="1052" cy="879" rx="12" ry="6" fill={FUR} {...OUTLINE} />

      <path d="M908 860 L 830 860 Q 818 864 830 870 L 908 872 Z" fill={FUR} {...OUTLINE} />
      <path d="M914 866 L 818 870 Q 806 875 818 880 L 914 880 Z" fill={FUR} {...OUTLINE} />

      <HeadAt x={888} y={846} scale={0.9} eyes="squint" look="viewer" yawning earPoke={earPoke} />
    </g>
  );
}

/* ------------------------------------------------------------------ */

export function Cat({ onBat }: { onBat: () => void }) {
  const speak = useSpeak();
  const brain = useCatBrain(onBat);
  const [pets, setPets] = useState(0);
  const [hearts, burst] = useParticles();

  function pet() {
    const count = pets + 1;

    setPets(count);
    brain.pet();
    burst(brain.pose === "sit" ? 950 : 868, brain.pose === "sit" ? 690 : 770, 3, 70);
    playSfx("purr");

    speak(
      brain.pose === "sit" ? 950 : 868,
      brain.pose === "sit" ? 684 : 764,
      count % 10 === 0 ? `That's ${count} pets! We're best friends now. 🐾` : pick(CAT_LINES)
    );
  }

  return (
    <g>
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
        </g>
      </g>

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
