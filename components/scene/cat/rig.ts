/**
 * Draws Mochi from a pose. The SVG elements are created once; each
 * frame only their attributes change, so she can move at 60fps
 * without React re-rendering anything.
 */

import { LINE } from "../scene-shared";
import {
  add,
  capsule,
  clamp,
  closedPath,
  ellipsePoints,
  fromAngle,
  furPath,
  ik,
  len,
  lerpPt,
  mul,
  norm,
  openPath,
  type Pt,
  ptStr,
  rad,
  sampleClosed,
  sub,
} from "./geometry";
import type { Pose } from "./poses";

const SVG = "http://www.w3.org/2000/svg";

const FUR = "var(--sc-cat)";
const PATCH = "var(--sc-cat-patch)";
const PATCH_DARK = "var(--sc-cat-patch-2)";
const SHADE = "var(--sc-cat-shade)";
const PINK = "#f2a7b4";

/* Bone lengths */
const FRONT = { upper: 27, lower: 27 };
const HIND = { thigh: 26, shin: 24 };
export const TAIL_SEGMENTS = 12;
const TAIL_STEP = 8;
const HEAD_R = 19.5;

export type Frame = {
  pose: Pose;
  /** Scene x of her middle, the floor line, and any jump height. */
  x: number;
  floor: number;
  lift: number;
  scale: number;
  /** 1 faces left (as drawn), -1 faces right; in between while turning. */
  facing: number;
  /** Absolute angle of each tail segment, in degrees. */
  tail: number[];
  /** Where the pupils point (-1 to 1), and how wide they are (0 slit, 1 round). */
  look: Pt;
  pupil: number;
  happy: boolean;
  /** Extra eyelid closing for blinks (0 to 1). */
  blink: number;
  /** Extra rotation of one ear, for twitches (degrees). */
  twitch: number;
  sleeping: boolean;
};

type Attrs = Record<string, string | number>;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element) {
  const node = document.createElementNS(SVG, tag);
  setAttrs(node, attrs);
  parent?.appendChild(node);
  return node;
}

function setAttrs(node: Element, attrs: Attrs) {
  for (const key in attrs) {
    node.setAttribute(key, String(attrs[key]));
  }
}

const OUTLINE = { fill: LINE, stroke: LINE, "stroke-width": 3.2, "stroke-linejoin": "round" };

/** Several shapes drawn as one furry silhouette: outline under, fur on top. */
class Silhouette {
  outline: SVGGElement;
  fill: SVGGElement;
  outlines: SVGPathElement[] = [];
  fills: SVGPathElement[] = [];
  clip: SVGClipPathElement;
  clipPaths: SVGPathElement[] = [];
  inside: SVGGElement;

  constructor(parent: SVGElement, defs: SVGDefsElement, id: string, count: number, fill = FUR) {
    this.clip = el("clipPath", { id }, defs);
    this.outline = el("g", { opacity: 0.72, ...OUTLINE }, parent);
    this.fill = el("g", { fill }, parent);

    for (let i = 0; i < count; i++) {
      this.outlines.push(el("path", {}, this.outline));
      this.fills.push(el("path", {}, this.fill));
      this.clipPaths.push(el("path", {}, this.clip));
    }

    this.inside = el("g", { "clip-path": `url(#${id})` }, parent);
  }

  set(paths: string[]) {
    paths.forEach((d, i) => {
      this.outlines[i].setAttribute("d", d);
      this.fills[i].setAttribute("d", d);
      this.clipPaths[i].setAttribute("d", d);
    });
  }
}

class Leg {
  group: SVGGElement;
  outline: SVGGElement;
  segments: SVGPathElement[] = [];
  outlines: SVGPathElement[] = [];
  paw: SVGEllipseElement;
  pawOutline: SVGEllipseElement;
  toes: SVGPathElement;

  constructor(parent: SVGElement, count: number, far: boolean) {
    this.group = el("g", {}, parent);
    this.outline = el("g", { opacity: 0.72, ...OUTLINE }, this.group);
    const fill = el("g", { fill: far ? SHADE : FUR }, this.group);

    for (let i = 0; i < count; i++) {
      this.outlines.push(el("path", {}, this.outline));
      this.segments.push(el("path", {}, fill));
    }

    this.pawOutline = el("ellipse", { fill: LINE, opacity: 0.72 }, this.group);
    this.paw = el("ellipse", { fill: far ? SHADE : FUR }, this.group);
    this.toes = el("path", { stroke: LINE, "stroke-opacity": 0.38, "stroke-width": 1, "stroke-linecap": "round", fill: "none" }, this.group);
  }

  set(bones: Array<[Pt, Pt, number, number]>, paw: Pt, rx: number) {
    bones.forEach(([a, b, ra, rb], i) => {
      const d = capsule(a, b, ra, rb);
      this.outlines[i].setAttribute("d", d);
      this.segments[i].setAttribute("d", d);
    });

    setAttrs(this.pawOutline, { cx: paw[0], cy: paw[1], rx: rx + 1.5, ry: 5.8 });
    setAttrs(this.paw, { cx: paw[0], cy: paw[1], rx, ry: 4.3 });
    this.toes.setAttribute(
      "d",
      `M${paw[0] - rx * 0.45} ${paw[1] + 1} v3 M${paw[0]} ${paw[1] + 1.4} v3 M${paw[0] + rx * 0.45} ${paw[1] + 1} v3`
    );
  }
}

class Tail {
  group: SVGGElement;
  shape: Silhouette;
  band: SVGPathElement;
  highlight: SVGPathElement;

  constructor(parent: SVGElement, defs: SVGDefsElement, id: string) {
    this.group = el("g", {}, parent);
    this.shape = new Silhouette(this.group, defs, id, 1, PATCH);
    this.band = el("path", { fill: PATCH_DARK, opacity: 0.9 }, this.shape.inside);
    this.highlight = el("path", { fill: "none", stroke: "#ffffff", "stroke-opacity": 0.35, "stroke-width": 2, "stroke-linecap": "round" }, this.shape.inside);
  }

  set(points: Pt[]) {
    const n = points.length;
    const radius = (i: number) => 6 - (i / (n - 1)) * 1.6;
    const left: Pt[] = [];
    const right: Pt[] = [];

    points.forEach((p, i) => {
      const dir = norm(sub(points[Math.min(i + 1, n - 1)], points[Math.max(i - 1, 0)]));
      const normal: Pt = [-dir[1], dir[0]];
      left.push(add(p, mul(normal, radius(i))));
      right.push(add(p, mul(normal, -radius(i))));
    });

    // A rounded tip.
    const end = points[n - 1];
    const dir = norm(sub(end, points[n - 2]));
    const tip = add(end, mul(dir, radius(n - 1) * 1.1));

    const outline = sampleClosed([...left, tip, ...right.reverse()], 2);
    this.shape.set([furPath(outline, { depth: 1.7, every: 2, seed: 77, weight: (t) => (t < 0.04 || t > 0.96 ? 0 : 1) })]);

    // A soft dark patch partway along, made of overlapping blobs.
    let band = "";
    for (let i = Math.floor(n * 0.45); i <= Math.floor(n * 0.68); i++) {
      const [x, y] = points[i];
      const r = radius(i) * 1.25;
      band += `M${(x - r).toFixed(1)} ${y.toFixed(1)} a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 `;
    }
    this.band.setAttribute("d", band);

    this.highlight.setAttribute("d", openPath(points.slice(1, -2).map((p) => add(p, [-1.5, -3]))));
  }
}

class Eye {
  group: SVGGElement;
  open: SVGGElement;
  almond: SVGPathElement;
  clip: SVGPathElement;
  iris: SVGEllipseElement;
  pupil: SVGEllipseElement;
  shine: SVGCircleElement;
  shine2: SVGCircleElement;
  lid: SVGPathElement;
  closed: SVGPathElement;

  constructor(parent: SVGElement, defs: SVGDefsElement, id: string) {
    this.group = el("g", {}, parent);
    const clipPath = el("clipPath", { id }, defs);
    this.clip = el("path", {}, clipPath);

    this.open = el("g", {}, this.group);
    this.almond = el("path", { fill: "#2a1d1f" }, this.open);
    const inside = el("g", { "clip-path": `url(#${id})` }, this.open);
    this.iris = el("ellipse", { fill: "url(#mochi-iris)" }, inside);
    this.pupil = el("ellipse", { fill: "#140d0e" }, inside);
    this.shine = el("circle", { fill: "#ffffff" }, inside);
    this.shine2 = el("circle", { fill: "#ffffff", opacity: 0.7 }, inside);
    this.lid = el("path", { fill: "none", stroke: LINE, "stroke-width": 1.6, "stroke-linecap": "round", "stroke-opacity": 0.9 }, this.open);

    this.closed = el("path", { fill: "none", stroke: LINE, "stroke-width": 1.8, "stroke-linecap": "round", "stroke-opacity": 0.85 }, this.group);
  }

  set(
    c: Pt,
    k: number,
    outerSide: number,
    { open, look, pupil, happy }: { open: number; look: Pt; pupil: number; happy: boolean }
  ) {
    if (k < 0.12) {
      this.group.setAttribute("display", "none");
      return;
    }

    this.group.removeAttribute("display");

    const a = 5.4 * k;
    const b = 4.4;
    const outer: Pt = [c[0] + outerSide * a, c[1] - 0.8];
    const inner: Pt = [c[0] - outerSide * a, c[1] + 0.6];

    if (happy || open < 0.1) {
      this.open.setAttribute("display", "none");
      this.closed.removeAttribute("display");
      const bow = happy ? -3.2 : 2.4;
      this.closed.setAttribute("d", `M${ptStr(inner)} Q${c[0]} ${c[1] + bow} ${ptStr(outer)}`);
      return;
    }

    this.closed.setAttribute("display", "none");
    this.open.removeAttribute("display");

    const up: Pt = [c[0] + outerSide * a * 0.1, c[1] - 2 * b * open];
    const down: Pt = [c[0], c[1] + 1.5 * b * Math.min(1, open * 1.4)];
    const almond = `M${ptStr(inner)} Q${ptStr(up)} ${ptStr(outer)} Q${ptStr(down)} ${ptStr(inner)} Z`;

    this.almond.setAttribute("d", almond);
    this.clip.setAttribute("d", almond);

    const iris: Pt = [c[0] + look[0] * a * 0.32, c[1] + look[1] * 1.3];
    setAttrs(this.iris, { cx: iris[0], cy: iris[1], rx: 4.7 * k, ry: 4.7 });
    setAttrs(this.pupil, { cx: iris[0], cy: iris[1], rx: (0.75 + 2.7 * pupil) * k, ry: 4.1 });
    setAttrs(this.shine, { cx: iris[0] - 1.5 * k, cy: iris[1] - 1.7, r: 1.35 });
    setAttrs(this.shine2, { cx: iris[0] + 1.6 * k, cy: iris[1] + 1.8, r: 0.6 });
    this.lid.setAttribute("d", `M${ptStr(inner)} Q${ptStr(up)} ${ptStr(outer)}`);
  }
}

class Ear {
  group: SVGGElement;
  outline: SVGPathElement;
  shape: SVGPathElement;
  inner: SVGPathElement;
  tufts: SVGPathElement;

  constructor(parent: SVGElement, color: string) {
    this.group = el("g", {}, parent);
    this.outline = el("path", { ...OUTLINE, opacity: 0.72 }, this.group);
    this.shape = el("path", { fill: color }, this.group);
    this.inner = el("path", { fill: PINK }, this.group);
    this.tufts = el("path", { fill: "none", stroke: "#ffffff", "stroke-width": 1.1, "stroke-linecap": "round", opacity: 0.85 }, this.group);
  }

  set(base: Pt, width: number, angle: number, facing: number) {
    const dir = fromAngle(angle - 90);
    const side: Pt = [-dir[1], dir[0]];
    const tip = add(base, mul(dir, 19));
    const left = add(base, mul(side, -width / 2));
    const right = add(base, mul(side, width / 2));
    const bulge = (p: Pt, q: Pt, out: number): Pt => add(lerpPt(p, q, 0.5), mul(side, out));

    const d = `M${ptStr(left)} Q${ptStr(bulge(left, tip, -2.2))} ${ptStr(tip)} Q${ptStr(bulge(tip, right, 2.2))} ${ptStr(right)} Z`;
    this.outline.setAttribute("d", d);
    this.shape.setAttribute("d", d);

    if (facing < 0.08) {
      this.inner.setAttribute("display", "none");
      this.tufts.setAttribute("display", "none");
      return;
    }

    this.inner.removeAttribute("display");
    this.tufts.removeAttribute("display");

    const iw = width * 0.62 * facing;
    const ib = add(base, mul(dir, 3));
    const it = add(base, mul(dir, 15));
    const il = add(ib, mul(side, -iw / 2));
    const ir = add(ib, mul(side, iw / 2));
    this.inner.setAttribute("d", `M${ptStr(il)} Q${ptStr(add(lerpPt(il, it, 0.5), mul(side, -1.2)))} ${ptStr(it)} Q${ptStr(add(lerpPt(it, ir, 0.5), mul(side, 1.2)))} ${ptStr(ir)} Z`);

    const tuft = (offset: number, length: number) => {
      const from = add(ib, mul(side, offset * iw * 0.5));
      return `M${ptStr(from)} L${ptStr(add(from, add(mul(dir, length), mul(side, -offset * 1.5))))}`;
    };
    this.tufts.setAttribute("d", `${tuft(-0.5, 9)} ${tuft(0, 11)} ${tuft(0.5, 8)}`);
  }
}

/* ------------------------------------------------------------------ */

export class CatRig {
  root: SVGGElement;
  body: SVGGElement;
  shadow: SVGEllipseElement;

  tailBack: Tail;
  tailFront: Tail;
  legs: { farFront: Leg; farHind: Leg; nearFront: Leg; nearHind: Leg };
  torso: Silhouette;
  saddle: SVGEllipseElement;
  rump: SVGEllipseElement;
  shoulder: SVGEllipseElement;
  belly: SVGEllipseElement;
  light: SVGEllipseElement;

  head: SVGGElement;
  earBack: Ear;
  earFront: Ear;
  skull: Silhouette;
  headPatch: SVGEllipseElement;
  headPatch2: SVGEllipseElement;
  headLight: SVGEllipseElement;
  muzzle: SVGEllipseElement;
  eyes: [Eye, Eye];
  blush: [SVGEllipseElement, SVGEllipseElement];
  nose: SVGPathElement;
  mouth: SVGPathElement;
  yawn: SVGEllipseElement;
  whiskers: SVGPathElement;

  zzz: SVGGElement;

  constructor(container: SVGGElement) {
    const defs = el("defs", {}, container);
    defs.innerHTML = `
      <radialGradient id="mochi-iris" cx="0.5" cy="0.62" r="0.62">
        <stop offset="0" stop-color="#f6e39a" />
        <stop offset="0.55" stop-color="#d9a441" />
        <stop offset="1" stop-color="#8d5c25" />
      </radialGradient>
      <radialGradient id="mochi-light" cx="0.38" cy="0.2" r="0.85">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.5" />
        <stop offset="0.55" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="1" stop-color="#3e2c2c" stop-opacity="0.22" />
      </radialGradient>`;

    this.root = el("g", {}, container);
    this.shadow = el("ellipse", { fill: "url(#sc-drop-shadow)" }, this.root);
    this.body = el("g", {}, this.root);

    this.tailBack = new Tail(this.body, defs, "mochi-tail-back");
    this.legs = {
      farHind: new Leg(this.body, 3, true),
      farFront: new Leg(this.body, 2, true),
      nearHind: new Leg(this.body, 3, false),
      nearFront: new Leg(this.body, 2, false),
    };

    this.torso = new Silhouette(this.body, defs, "mochi-torso", 2);
    this.saddle = el("ellipse", { fill: PATCH }, this.torso.inside);
    this.rump = el("ellipse", { fill: PATCH }, this.torso.inside);
    this.shoulder = el("ellipse", { fill: PATCH_DARK }, this.torso.inside);
    this.belly = el("ellipse", { fill: SHADE, opacity: 0.75 }, this.torso.inside);
    this.light = el("ellipse", { fill: "url(#mochi-light)" }, this.torso.inside);

    this.tailFront = new Tail(this.body, defs, "mochi-tail-front");

    this.head = el("g", {}, this.body);
    this.earBack = new Ear(this.head, PATCH_DARK);
    this.earFront = new Ear(this.head, PATCH);
    this.skull = new Silhouette(this.head, defs, "mochi-skull", 4);
    this.headPatch = el("ellipse", { fill: PATCH }, this.skull.inside);
    this.headPatch2 = el("ellipse", { fill: PATCH_DARK }, this.skull.inside);
    this.headLight = el("ellipse", { fill: "url(#mochi-light)" }, this.skull.inside);
    this.muzzle = el("ellipse", { fill: "#fffaf6", opacity: 0.85 }, this.head);
    this.blush = [
      el("ellipse", { fill: PINK, opacity: 0 }, this.head),
      el("ellipse", { fill: PINK, opacity: 0 }, this.head),
    ];
    this.eyes = [new Eye(this.head, defs, "mochi-eye-a"), new Eye(this.head, defs, "mochi-eye-b")];
    this.nose = el("path", { fill: "#e48d9c" }, this.head);
    this.yawn = el("ellipse", { fill: "#7a3a4a", stroke: LINE, "stroke-opacity": 0.6, "stroke-width": 1.2 }, this.head);
    this.mouth = el("path", { fill: "none", stroke: LINE, "stroke-opacity": 0.75, "stroke-width": 1.3, "stroke-linecap": "round" }, this.head);
    this.whiskers = el("path", { fill: "none", stroke: LINE, "stroke-opacity": 0.28, "stroke-width": 0.8, "stroke-linecap": "round" }, this.head);

    // Zzz floats in scene space, so the text never mirrors.
    this.zzz = el("g", { fill: "var(--lavender)", "font-weight": 500, style: "font-family: var(--font-kiwi); pointer-events: none" }, container);
    [
      [0, 0, 13, "z"],
      [5, -4, 18, "z"],
      [10, -8, 24, "Z"],
    ].forEach(([dx, dy, size, char], index) => {
      const text = el("text", { x: dx, y: dy, "font-size": size, class: "sc-zzz", style: `transform-box: fill-box; transform-origin: 50% 50%; animation-delay: ${Number(index) * 1.1}s; opacity: 0` }, this.zzz);
      text.textContent = String(char);
    });
  }

  /** Where her head is in scene space (for bubbles and hearts). */
  static headSpot(frame: Frame): Pt {
    return [
      frame.x + frame.pose.head[0] * frame.scale * frame.facing,
      frame.floor - frame.lift + frame.pose.head[1] * frame.scale,
    ];
  }

  draw(frame: Frame) {
    const { pose } = frame;

    this.root.setAttribute(
      "transform",
      `translate(${frame.x.toFixed(1)} ${(frame.floor - frame.lift).toFixed(1)}) scale(${(frame.facing * frame.scale).toFixed(3)} ${frame.scale})`
    );

    /* Spine frame: u runs from the hips to the shoulders, v is "up" from the back. */
    const S = pose.chest;
    const P = pose.pelvis;
    const u = norm(sub(S, P));
    const v: Pt = [-u[1], u[0]];
    const at = (o: Pt, du: number, dv: number) => add(o, add(mul(u, du), mul(v, dv)));
    const M = lerpPt(S, P, 0.5);
    const cR = pose.chestR;
    const hR = pose.hipR;
    const mid = (cR + hR) / 2;
    const spine = (Math.atan2(u[1], u[0]) * 180) / Math.PI + 180;
    const length = len(sub(S, P));

    /* Shadow */
    const shadowW = length / 2 + 44 - frame.lift * 0.4;
    setAttrs(this.shadow, { cx: M[0].toFixed(1), cy: (frame.lift + 1).toFixed(1), rx: Math.max(30, shadowW).toFixed(1), ry: 8 });

    /* Tail */
    const tailRoot = at(P, -hR * 0.92, hR * 0.32);
    const tailPoints: Pt[] = [tailRoot];
    // The floor, in local units (it is lower when she jumps).
    const floor = frame.lift / frame.scale - 4.5;

    frame.tail.forEach((angle) => {
      const from = tailPoints[tailPoints.length - 1];
      let next = add(from, fromAngle(angle, TAIL_STEP));

      // A tail can't go through the floor: it lies along it instead.
      if (next[1] > floor) {
        const along = Math.cos(rad(angle)) < 0 ? 180 : 0;
        next = add([from[0], Math.min(from[1], floor)], fromAngle(along, TAIL_STEP));
      }

      tailPoints.push(next);
    });
    const tailInFront = frame.tail[0] > 55;
    const tail = tailInFront ? this.tailFront : this.tailBack;
    (tailInFront ? this.tailBack : this.tailFront).group.setAttribute("display", "none");
    tail.group.removeAttribute("display");
    tail.set(tailPoints);

    /* Legs */
    const frontLeg = (leg: Leg, paw: Pt, offset: number) => {
      const shoulder = at(S, cR * 0.12 + offset, -cR * 0.35);
      const wrist: Pt = [paw[0] + 1, paw[1] - 5];
      const elbow = ik(shoulder, wrist, FRONT.upper, FRONT.lower, -1);
      leg.set(
        [
          [shoulder, elbow, 9.5, 7],
          [elbow, wrist, 6.8, 5.4],
        ],
        [paw[0] - 2.4, paw[1] - 3.6],
        6.8
      );
    };

    const hindLeg = (leg: Leg, paw: Pt, offset: number) => {
      const hip = at(P, -hR * 0.18 + offset, -hR * 0.22);
      const fold = clamp(pose.fold, 0, 1);
      const hock: Pt = [paw[0] + 10 + fold * 14, paw[1] - 17 + fold * 13];
      const knee = ik(hip, hock, HIND.thigh, HIND.shin, 1);
      const foot: Pt = [paw[0] + 1, paw[1] - 4];
      leg.set(
        [
          [hip, knee, 13, 8.5],
          [knee, hock, 7.6, 5.4],
          [hock, foot, 5.4, 4.8],
        ],
        [paw[0] - 2.4, paw[1] - 3.6],
        7.2
      );
    };

    // A paw raised to groom or bat comes in front of the chest.
    const raised = pose.nearFront[1] < -14;
    const nearFront = this.legs.nearFront.group;
    const inFront = nearFront.nextSibling === this.head;

    if (raised !== inFront) {
      this.body.insertBefore(nearFront, raised ? this.head : this.torso.outline);
    }

    frontLeg(this.legs.farFront, pose.farFront, -3);
    hindLeg(this.legs.farHind, pose.farHind, -3);
    frontLeg(this.legs.nearFront, pose.nearFront, 2);
    hindLeg(this.legs.nearHind, pose.nearHind, 2);

    /* Torso and neck */
    const outline = [
      at(S, cR * 1.0, -cR * 0.05),
      at(S, cR * 0.55, cR * 0.86),
      at(S, -cR * 0.2, cR * 0.98),
      at(M, 0, mid * 0.92 + pose.back),
      at(P, hR * 0.05, hR * 0.98),
      at(P, -hR * 1.0, hR * 0.25),
      at(P, -hR * 0.55, -hR * 0.82),
      at(P, hR * 0.55, -hR * 0.76 - pose.belly * 0.3),
      at(M, 0, -mid * 0.6 - pose.belly),
      at(S, cR * 0.35, -cR * 0.92),
    ];
    const fluff = [0.7, 0.3, 0.18, 0.18, 0.3, 0.5, 0.6, 0.9, 1, 0.9];
    const torso = furPath(sampleClosed(outline, 6), {
      depth: 3.2,
      seed: 11,
      weight: (t) => fluff[Math.floor(t * fluff.length)],
    });

    const neckC = lerpPt(at(S, cR * 0.45, cR * 0.35), pose.head, 0.42);
    const neck = furPath(ellipsePoints(neckC, 14, 15, 22), { depth: 3, seed: 13, every: 1 });
    this.torso.set([torso, neck]);

    const ell = (node: SVGEllipseElement, c: Pt, rx: number, ry: number) =>
      setAttrs(node, { cx: c[0].toFixed(1), cy: c[1].toFixed(1), rx: rx.toFixed(1), ry: ry.toFixed(1), transform: `rotate(${spine.toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)})` });

    ell(this.saddle, at(M, -6, mid * 0.82 + pose.back * 0.8), length * 0.46, 15);
    ell(this.rump, at(P, -hR * 0.3, hR * 0.38), hR * 0.85, hR * 0.72);
    ell(this.shoulder, at(S, -cR * 0.1, cR * 0.68), cR * 0.55, cR * 0.38);
    ell(this.belly, at(M, 0, -mid * 0.72 - pose.belly * 0.6), length / 2 + cR, 10);
    ell(this.light, M, length / 2 + cR + 12, mid + 14);


    /* Head */
    this.drawHead(frame);

    /* Zzz */
    if (frame.sleeping) {
      const [hx, hy] = CatRig.headSpot(frame);
      this.zzz.removeAttribute("display");
      this.zzz.setAttribute("transform", `translate(${(hx - 6).toFixed(1)} ${(hy - 32).toFixed(1)})`);
    } else {
      this.zzz.setAttribute("display", "none");
    }
  }

  private drawHead(frame: Frame) {
    const { pose } = frame;
    const R = HEAD_R;
    const theta = pose.yaw * 90;

    this.head.setAttribute(
      "transform",
      `translate(${pose.head[0].toFixed(1)} ${pose.head[1].toFixed(1)}) rotate(${pose.tilt.toFixed(1)})`
    );

    /** A point on the head's sphere: longitude (0 faces you) and latitude (down is +). */
    const sphere = (lon: number, lat: number, r = R): { p: Pt; k: number } => {
      const a = rad(lon + theta);
      return {
        p: [r * Math.sin(a) * Math.cos(rad(lat)), r * Math.sin(rad(lat))],
        k: Math.cos(a),
      };
    };

    /* Ears, behind the skull. The nearer ear is drawn last. */
    const earAngle = (side: number) => side * (14 - pose.ears * 7 + Math.max(0, -pose.ears) * 28);
    const ears = [-1, 1].map((side) => {
      const { p, k } = sphere(side * 40, -50);
      return { side, p, k };
    });
    ears.sort((a, b) => a.k - b.k);
    ears.forEach(({ side, p, k }, index) => {
      const ear = index === 0 ? this.earBack : this.earFront;
      const twitch = side === 1 ? frame.twitch : 0;
      ear.shape.setAttribute("fill", side === -1 ? PATCH : PATCH_DARK);
      ear.set(p, 13 * (0.45 + 0.55 * Math.abs(k)), earAngle(side) + twitch + Math.sin(rad(theta)) * 6, Math.max(0, k));
    });

    /* Skull: cranium, cheeks and muzzle as one furry shape */
    const cranium = furPath(ellipsePoints([0, -1], R * 1.06, R * 0.94, 28), {
      depth: 2.4,
      seed: 21,
      every: 1,
      weight: (t) => (t > 0.02 && t < 0.48 ? 1 : 0.15),
    });
    const cheeks = [-1, 1].map((side) => {
      const { p } = sphere(side * 62, 22);
      return furPath(ellipsePoints(p, 10, 8.5, 16), { depth: 3, seed: 30 + side, every: 1 });
    });
    const muzzleC = sphere(0, 24, R * 0.88).p;
    const muzzle = closedPath(ellipsePoints([muzzleC[0], muzzleC[1] + 1], 8.6, 7, 16));
    this.skull.set([cranium, cheeks[0], cheeks[1], muzzle]);

    const patch = sphere(-36, -36);
    setAttrs(this.headPatch, { cx: patch.p[0].toFixed(1), cy: patch.p[1].toFixed(1), rx: (12 * Math.max(0.35, patch.k) + 5).toFixed(1), ry: 11 });
    const patch2 = sphere(46, -46);
    setAttrs(this.headPatch2, { cx: patch2.p[0].toFixed(1), cy: patch2.p[1].toFixed(1), rx: (8 * Math.max(0.35, patch2.k) + 3).toFixed(1), ry: 6 });
    setAttrs(this.headLight, { cx: 0, cy: 0, rx: R * 1.4, ry: R * 1.3 });

    setAttrs(this.muzzle, { cx: (muzzleC[0] * 1.02).toFixed(1), cy: (muzzleC[1] + 1.5).toFixed(1), rx: (7.5 * (0.55 + 0.45 * Math.abs(Math.cos(rad(theta))))).toFixed(1), ry: 5.5 });

    /* Eyes */
    const open = clamp(pose.eyes * (1 - frame.blink), 0, 1);
    [-1, 1].forEach((side, index) => {
      const { p, k } = sphere(side * 33, 3, R * 0.96);
      this.eyes[index].set(p, k, side, { open, look: frame.look, pupil: frame.pupil, happy: frame.happy });
    });

    /* Blush */
    [-1, 1].forEach((side, index) => {
      const { p, k } = sphere(side * 52, 26);
      setAttrs(this.blush[index], { cx: p[0].toFixed(1), cy: p[1].toFixed(1), rx: (4.5 * Math.max(0, k)).toFixed(1), ry: 2.4, opacity: (0.4 * Math.max(0, k)).toFixed(2) });
    });

    /* Nose, mouth, whiskers */
    const facingK = Math.abs(Math.cos(rad(theta)));
    const forward = Math.sin(rad(theta));
    const nose: Pt = [muzzleC[0] + forward * 6.8, muzzleC[1] - 3.6];
    const nw = 2.6 * (0.45 + 0.55 * facingK);
    this.nose.setAttribute("d", `M${nose[0] - nw} ${nose[1] - 1} Q${nose[0]} ${nose[1] - 2.2} ${nose[0] + nw} ${nose[1] - 1} Q${nose[0] + nw * 0.4} ${nose[1] + 2} ${nose[0]} ${nose[1] + 2.2} Q${nose[0] - nw * 0.4} ${nose[1] + 2} ${nose[0] - nw} ${nose[1] - 1} Z`);

    const mouthTop: Pt = [nose[0], nose[1] + 2.2];
    const spread = 3.4 * facingK + 1.2;
    const back = -forward * 2.5;
    this.mouth.setAttribute(
      "d",
      `M${ptStr(mouthTop)} q0 2 ${(-spread + back).toFixed(1)} 2.8 M${ptStr(mouthTop)} q0 2 ${(spread + back).toFixed(1)} 2.8`
    );

    if (pose.mouth > 0.05) {
      this.yawn.removeAttribute("display");
      setAttrs(this.yawn, { cx: (mouthTop[0] + back * 0.4).toFixed(1), cy: (mouthTop[1] + 4 * pose.mouth).toFixed(1), rx: (3.6 * (0.5 + 0.5 * facingK)).toFixed(1), ry: (4.8 * pose.mouth).toFixed(1) });
    } else {
      this.yawn.setAttribute("display", "none");
    }

    let whiskers = "";
    [-1, 1].forEach((side) => {
      const { p, k } = sphere(side * 30, 27, R * 0.86);

      if (k < -0.35) {
        return;
      }

      const out = Math.sign(p[0] || side) || side;
      [-10, 0, 10].forEach((droop) => {
        const end: Pt = add(p, fromAngle(out > 0 ? droop : 180 - droop, 22));
        const ctrl: Pt = add(p, fromAngle(out > 0 ? droop - 6 : 186 - droop, 12));
        whiskers += `M${ptStr(p)} Q${ptStr(ctrl)} ${ptStr(end)} `;
      });
    });
    this.whiskers.setAttribute("d", whiskers);
  }
}
