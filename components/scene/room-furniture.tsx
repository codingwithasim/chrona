"use client";

import { useRef, useState } from "react";

import { useNow } from "@/hooks/use-now";
import { playSfx } from "@/lib/sfx";

import {
  box,
  DESK,
  FOCAL,
  poly,
  project,
  ROOM,
  scaleAt,
  type Vec3,
  VP,
} from "./projection";
import { useNotesStore } from "@/stores/notes-store";

import { C } from "./room-palette";
import {
  mulberry32,
  pick,
  pivot,
  toScene,
  usePoke,
  useSpeak,
  useTween,
} from "./scene-shared";

const { floor: F, back: B } = ROOM;

function line(a: Vec3, b: Vec3) {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  return { x1, y1, x2, y2 };
}

/* ------------------------------------------------------------------ */
/* Desk                                                                */
/* ------------------------------------------------------------------ */

const DESK_GRAIN = (() => {
  const random = mulberry32(31);
  const lines: Array<{ a: Vec3; b: Vec3; opacity: number }> = [];

  for (let i = 0; i < 14; i++) {
    const z = DESK.front + 0.05 + random() * (DESK.back - DESK.front - 0.1);
    const x0 = DESK.left + random() * 1.5;
    const x1 = DESK.right - random() * 1.5;

    lines.push({ a: [x0, DESK.top, z], b: [x1, DESK.top, z], opacity: 0.08 + random() * 0.12 });
  }

  return lines;
})();

export function Desk() {
  const top = box(DESK.left, DESK.right, DESK.top - DESK.thickness, DESK.top, DESK.front, DESK.back);
  const drawers = box(1.65, 2.95, F + 0.12, DESK.top - DESK.thickness, DESK.front + 0.03, DESK.back - 0.05);
  const drawerFront = (y0: number, y1: number) =>
    poly([1.72, y0, DESK.front + 0.02], [2.88, y0, DESK.front + 0.02], [2.88, y1, DESK.front + 0.02], [1.72, y1, DESK.front + 0.02]);

  const legs: Array<[number, number]> = [
    [DESK.left + 0.08, DESK.left + 0.18],
    [1.55, 1.65],
  ];

  return (
    <g>
      {/* Shadow under the desk, on the wall and floor */}
      <path d={poly([DESK.left, F, B], [DESK.right, F, B], [DESK.right, DESK.top, B], [DESK.left, DESK.top, B])} fill="#1d2433" opacity="0.28" />
      <path d={poly([DESK.left - 0.1, F, DESK.front - 0.2], [DESK.right + 0.1, F, DESK.front - 0.2], [DESK.right, F, B], [DESK.left, F, B])} fill="#1d2433" opacity="0.3" />

      {/* Legs */}
      {legs.map(([x0, x1]) => {
        const leg = box(x0, x1, F, DESK.top - DESK.thickness, DESK.front + 0.05, DESK.front + 0.15);
        return (
          <g key={x0}>
            <path d={leg.front} fill={C.woodFront} />
            <path d={x0 < 0 ? leg.right : leg.left} fill={C.woodSide} />
          </g>
        );
      })}

      {/* Drawer unit */}
      <path d={drawers.left} fill={C.woodSide} />
      <path d={drawers.front} fill={C.woodFront} />
      {[
        [-1.5, -1.95],
        [-1.98, -2.36],
      ].map(([y1, y0]) => {
        const [hx, hy] = project([2.3, (y0 + y1) / 2, DESK.front]);
        return (
          <g key={y0}>
            <path d={drawerFront(y0, y1)} fill="#d2a970" />
            <path d={drawerFront(y0, y1)} fill="none" stroke={C.woodDark} strokeWidth="1" opacity="0.4" />
            <rect x={hx - 9} y={hy - 2} width="18" height="4" rx="2" fill="#8a6a44" />
            <rect x={hx - 9} y={hy - 2} width="18" height="1.4" rx="0.7" fill="#ffffff" opacity="0.4" />
          </g>
        );
      })}

      {/* Top */}
      <path d={top.top} fill={C.woodTop} />
      <path d={top.top} fill="url(#rm-desk-top)" />
      <g stroke={C.woodDark} strokeLinecap="round">
        {DESK_GRAIN.map((grain, index) => (
          <line key={index} {...line(grain.a, grain.b)} strokeWidth="0.8" opacity={grain.opacity} />
        ))}
      </g>
      <path d={top.front} fill={C.woodFront} />
      <line {...line([DESK.left, DESK.top, DESK.front], [DESK.right, DESK.top, DESK.front])} stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
      <path d={top.left} fill={C.woodSide} />
      <path d={top.right} fill={C.woodSide} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Chair                                                               */
/* ------------------------------------------------------------------ */

/** Pulled out from the desk: nearer the viewer and a little to the side. */
const CHAIR_OUT = { z: 6.85, dx: 0.18 };

export function Chair() {
  const [out, setOut] = useState(false);
  // How far the seat has turned on its post, in radians (it keeps turning
  // the same way: a half turn out to face the room, a half turn back).
  const [angle, turnTo] = useTween(1200, 0);
  const turns = useRef(0);

  const z = 7.5;
  const s = scaleAt(z);
  const [cx] = project([-1.9, 0, z]);
  const [, topY] = project([0, 0.15, z]);
  const [, bottomY] = project([0, -1.12, z]);
  const [, seatY] = project([0, -1.28, z]);
  const [, baseY] = project([0, -2.32, z]);

  const half = 0.48 * s;

  // Rolling along the floor is a change of depth: scale about the
  // vanishing point, plus a small sideways shift.
  const k = z / CHAIR_OUT.z;
  const tx = (FOCAL * CHAIR_OUT.dx) / CHAIR_OUT.z;

  /*
   * The seat, back and arms turn about the gas lift. Seen from the room,
   * the back slides sideways and narrows as it turns edge-on, then shows
   * its cushioned front; the arms swap sides, passing behind it.
   * Local frame: x to the right, d towards you.
   */
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const backReach = half * 0.42;
  const backX = cx + sin * backReach;
  const backD = cos * backReach;
  const backHalf = Math.max(half * Math.abs(cos), 5);
  const showingFront = cos < 0;
  const edgeOn = 1 - Math.abs(cos);
  const armReach = half + 6;
  const arms = [-1, 1].map((side) => ({
    side,
    x: cx + side * armReach * cos,
    d: -side * armReach * sin,
    pad: 8 + 20 * Math.abs(sin),
  }));

  const back = (
    <g key="back">
      <rect x={backX - backHalf} y={topY} width={backHalf * 2} height={bottomY - topY} rx={Math.min(backHalf, half * 0.45)} fill="#454c59" />
      {showingFront ? (
        // The cushioned front, with its stitched panels.
        <g>
          <rect
            x={backX - backHalf + 5 * Math.abs(cos)}
            y={topY + 6}
            width={Math.max(0, backHalf * 2 - 10 * Math.abs(cos))}
            height={bottomY - topY - 12}
            rx={Math.min(backHalf, half * 0.4)}
            fill="#6b778a"
          />
          <g stroke="#55606f" strokeWidth="1.4" opacity="0.7" fill="none">
            <path d={`M${backX - backHalf * 0.75} ${topY + (bottomY - topY) * 0.38} Q ${backX} ${topY + (bottomY - topY) * 0.45} ${backX + backHalf * 0.75} ${topY + (bottomY - topY) * 0.38}`} />
            <path d={`M${backX - backHalf * 0.75} ${topY + (bottomY - topY) * 0.66} Q ${backX} ${topY + (bottomY - topY) * 0.73} ${backX + backHalf * 0.75} ${topY + (bottomY - topY) * 0.66}`} />
          </g>
        </g>
      ) : (
        // The back, with its mesh.
        <g>
          <rect
            x={backX - backHalf + 7 * Math.abs(cos)}
            y={topY + 7}
            width={Math.max(0, backHalf * 2 - 14 * Math.abs(cos))}
            height={bottomY - topY - 14}
            rx={Math.min(backHalf, half * 0.38)}
            fill="#566070"
          />
          <g stroke="#3d4450" strokeWidth="1" opacity="0.5">
            {Array.from({ length: 9 }, (_, index) => (
              <line
                key={index}
                x1={backX - backHalf + 12 * Math.abs(cos)}
                y1={topY + 18 + index * ((bottomY - topY - 30) / 8)}
                x2={backX + backHalf - 12 * Math.abs(cos)}
                y2={topY + 18 + index * ((bottomY - topY - 30) / 8)}
              />
            ))}
          </g>
        </g>
      )}
      {/* Turning away from the light, it darkens a little edge-on */}
      <rect x={backX - backHalf} y={topY} width={backHalf * 2} height={bottomY - topY} rx={Math.min(backHalf, half * 0.45)} fill="#000000" opacity={edgeOn * 0.28} />
      <path
        d={`M${backX - backHalf + 10 * Math.abs(cos)} ${topY + 20} Q ${backX - backHalf + 4 * Math.abs(cos)} ${(topY + bottomY) / 2} ${backX - backHalf + 12 * Math.abs(cos)} ${bottomY - 20}`}
        stroke="#ffffff"
        strokeWidth="3"
        fill="none"
        opacity={0.15 * Math.abs(cos)}
      />
    </g>
  );

  const arm = (item: (typeof arms)[number]) => (
    <g key={`arm${item.side}`}>
      <rect x={item.x - 4} y={seatY - 48} width="8" height="46" rx="3" fill="#30353f" />
      <rect x={item.x - item.pad / 2 - 2} y={seatY - 52} width={item.pad + 4} height="8" rx="4" fill="#3a404c" />
    </g>
  );

  // Paint from the far side to the near side.
  const seat = <ellipse key="seat" cx={cx} cy={seatY} rx={half * 1.05} ry="13" fill="#3a404c" />;
  const parts = [
    { d: backD, node: back },
    { d: 0, node: seat },
    ...arms.map((item) => ({ d: item.d, node: arm(item) })),
  ].sort((a, b) => a.d - b.d);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        setOut(!out);
        turns.current += 1;
        turnTo(turns.current * Math.PI);
      }}
      style={{
        transform: out ? `translate(${tx.toFixed(1)}px, 0px) scale(${k.toFixed(4)})` : "none",
        transformOrigin: `${VP.x}px ${VP.y}px`,
        transition: "transform 1.1s cubic-bezier(0.3, 0.7, 0.3, 1)",
      }}
    >
      <ellipse cx={cx} cy={baseY + 20} rx={half * 1.25} ry="12" fill="url(#rm-drop-shadow)" />

      <g>
        {/* Star base and casters */}
        <g stroke="#30353f" strokeWidth="7" strokeLinecap="round">
          {[-1, -0.45, 0.45, 1].map((t) => (
            <line key={t} x1={cx} y1={baseY} x2={cx + t * half * 1.05} y2={baseY + 14 + Math.abs(t) * -4} />
          ))}
          <line x1={cx} y1={baseY} x2={cx} y2={baseY + 18} />
        </g>
        {[-1, -0.45, 0.45, 1, 0].map((t) => (
          <circle key={t} cx={cx + t * half * 1.05} cy={baseY + 16 + (t === 0 ? 4 : Math.abs(t) * -4)} r="4.5" fill="#1f232b" />
        ))}

        {/* Gas lift */}
        <rect x={cx - 5} y={seatY} width="10" height={baseY - seatY} fill="#7e8794" />
        <rect x={cx - 5} y={seatY} width="3" height={baseY - seatY} fill="#ffffff" opacity="0.3" />

        {/* Seat, back and arms, turning on the post */}
        {parts.map((part) => part.node)}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Rug                                                                 */
/* ------------------------------------------------------------------ */

export function Rug() {
  const x0 = -2.5;
  const x1 = 2.5;
  const z0 = 5.3;
  const z1 = 8.25;
  const y = F + 0.005;
  const inset = (d: number) => poly([x0 + d, y, z1 - d], [x1 - d, y, z1 - d], [x1 - d, y, z0 + d], [x0 + d, y, z0 + d]);

  return (
    <g>
      <path d={inset(-0.02)} fill="#000000" opacity="0.12" />
      <path d={inset(0)} fill={C.rugBorder} />
      <path d={inset(0.16)} fill={C.rug} />
      <path d={inset(0.16)} fill="url(#rm-rug-shade)" />
      <path d={inset(0.34)} fill="none" stroke={C.rugBorder} strokeWidth="2" opacity="0.6" />
      <path d={inset(0.42)} fill="none" stroke={C.rugBorder} strokeWidth="1" opacity="0.45" />

      {/* A simple diamond motif */}
      <path
        d={poly([0, y, 7.7], [1.2, y, 6.8], [0, y, 5.9], [-1.2, y, 6.8])}
        fill="none"
        stroke={C.rugBorder}
        strokeWidth="1.5"
        opacity="0.4"
      />

      {/* Fringe along the far edge */}
      <g stroke={C.rug} strokeWidth="1.2" opacity="0.9">
        {Array.from({ length: 30 }, (_, index) => {
          const x = x0 + 0.1 + (index * (x1 - x0 - 0.2)) / 29;
          return <line key={index} {...line([x, y, z1], [x, y, z1 + 0.12])} />;
        })}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Bed                                                                 */
/* ------------------------------------------------------------------ */

export function Bed() {
  const [poke, bump] = usePoke();

  const frame = box(2.75, 5, F, -1.95, 6.2, 9.75);
  const mattress = box(2.8, 5, -1.95, -1.62, 6.25, 9.7);
  const headboard = box(2.75, 5, F, -0.55, 9.75, 9.92);

  const blanketTop = poly([2.78, -1.6, 6.22], [5, -1.6, 6.22], [5, -1.58, 8.4], [2.78, -1.58, 8.4]);
  const blanketSide = poly([2.78, -1.6, 6.22], [2.78, -1.58, 8.4], [2.76, -2.08, 8.2], [2.76, -2.12, 6.2]);
  const blanketFront = poly([2.78, -1.6, 6.22], [5, -1.6, 6.22], [5, -2.1, 6.18], [2.76, -2.12, 6.18]);
  const fold = poly([2.78, -1.57, 8.4], [5, -1.57, 8.4], [5, -1.57, 8.75], [2.78, -1.57, 8.75]);

  const pillow = (x0: number, x1: number) => {
    const [ax, ay] = project([x0, -1.3, 9.45]);
    const [bx, by] = project([x1, -1.62, 9.15]);
    return { x: ax, y: ay, w: bx - ax, h: by - ay };
  };

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <path d={poly([2.7, F, 6.1], [5, F, 6.1], [5, F, 6.6], [2.7, F, 6.6])} fill="#000000" opacity="0.15" />
      <path d={poly([2.45, F, 6.15], [2.76, F, 6.15], [2.76, F, 9.75], [2.55, F, 9.75])} fill="#1e2633" opacity="0.12" />

      <path d={headboard.front} fill={C.woodFront} />
      <path d={headboard.left} fill={C.woodSide} />
      <path d={frame.left} fill={C.woodSide} />
      <path d={frame.front} fill={C.woodFront} />

      <path d={mattress.top} fill={C.sheet} />
      <path d={mattress.left} fill={C.sheetShade} />
      <path d={mattress.front} fill="#dde3e9" />

      <g>
        {[[3.05, 3.95], [4.05, 4.95]].map(([x0, x1], index) => {
          const p = pillow(x0, x1);
          return (
            <g
              key={`${x0}-${poke}`}
              className={poke ? "sc-fluff" : undefined}
              style={{ ...pivot("50% 100%"), animationDelay: `${index * 0.12}s` }}
            >
              <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.h * 0.45} fill="#f4f6f8" />
              <rect x={p.x} y={p.y + p.h * 0.55} width={p.w} height={p.h * 0.45} rx={p.h * 0.3} fill="#d9e0e7" />
              <path d={`M${p.x + p.w * 0.2} ${p.y + p.h * 0.3} Q ${p.x + p.w * 0.5} ${p.y + p.h * 0.45} ${p.x + p.w * 0.8} ${p.y + p.h * 0.3}`} stroke="#c6ced8" strokeWidth="1.2" fill="none" />
            </g>
          );
        })}
      </g>

      {/* Blanket, draped over the side */}
      <path d={fold} fill="#f2f4f6" />
      <path d={blanketTop} fill={C.fabric} />
      <path d={blanketSide} fill={C.fabricDark} />
      <path d={blanketFront} fill="#5672a0" />
      <g stroke="#3f5880" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round">
        {[
          [[3.4, -1.59, 6.6], [3.9, -1.59, 7.6]],
          [[4.2, -1.59, 6.5], [4.6, -1.59, 7.9]],
          [[2.77, -1.75, 6.8], [2.77, -2.0, 7.2]],
        ].map(([a, b], index) => (
          <line key={index} {...line(a as Vec3, b as Vec3)} />
        ))}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Bookcase                                                            */
/* ------------------------------------------------------------------ */

const SHELF_LEVELS = [-2.38, -1.45, -0.52, 0.41, 1.34];
const CASE = { x0: -5, x1: -4.35, z0: 7.1, z1: 9.7, top: 1.98 };

type Book = {
  y0: number;
  height: number;
  z: number;
  width: number;
  color: string;
  /** Spine centre on screen, to find the book that was clicked. */
  cx: number;
  cy: number;
};

/** The spine sits at this x; a pulled book slides out towards the room. */
const SPINE_X = CASE.x1 - 0.06;
const PULL = 0.2;
const BOOK_DEPTH = 0.26;

const BOOKS = (() => {
  const random = mulberry32(53);
  const books: Book[] = [];

  SHELF_LEVELS.forEach((level, shelfIndex) => {
    let z = CASE.z0 + 0.12;

    while (z < CASE.z1 - 0.2) {
      // Leave a gap now and then.
      if (random() < 0.08) {
        z += 0.25 + random() * 0.3;
        continue;
      }

      const width = 0.08 + random() * 0.1;
      const height = 0.48 + random() * 0.32 - (shelfIndex === 0 ? 0 : 0.05);
      const y0 = level + 0.04;
      const [cx, cy] = project([SPINE_X, y0 + height / 2, z + width / 2]);

      books.push({
        y0,
        height,
        z,
        width,
        color: C.books[Math.floor(random() * C.books.length)],
        cx,
        cy,
      });

      z += width + 0.005;
    }
  });

  return books;
})();

/** A book's visible faces, slid out of the shelf by `out` (0–1). */
function bookFaces(book: Book, out: number) {
  const x = SPINE_X + PULL * out;
  const { y0, height, z, width } = book;
  const top = y0 + height;
  // Only the part that sticks out of the row can be seen.
  const inner = Math.max(x - BOOK_DEPTH, SPINE_X);

  return {
    spine: poly([x, y0, z], [x, top, z], [x, top, z + width], [x, y0, z + width]),
    band: poly([x, y0 + height * 0.78, z], [x, y0 + height * 0.84, z], [x, y0 + height * 0.84, z + width], [x, y0 + height * 0.78, z + width]),
    // The cover nearest the camera shows once the book is out.
    cover: out > 0 ? poly([inner, y0, z], [x, y0, z], [x, top, z], [inner, top, z]) : null,
    // And its top or bottom edge, depending on eye level.
    edge:
      out > 0
        ? top < 0
          ? poly([inner, top, z], [x, top, z], [x, top, z + width], [inner, top, z + width])
          : poly([inner, y0, z], [x, y0, z], [x, y0, z + width], [inner, y0, z + width])
        : null,
  };
}

function BookSpine({ book, out = 0 }: { book: Book; out?: number }) {
  const faces = bookFaces(book, out);

  return (
    <g>
      {faces.cover && <path d={faces.cover} fill={book.color} />}
      {faces.cover && <path d={faces.cover} fill="#000000" opacity="0.28" />}
      {faces.edge && <path d={faces.edge} fill="#efe6d2" />}
      <path d={faces.spine} fill={book.color} />
      <path d={faces.band} fill="#f3e7c8" opacity="0.55" />
    </g>
  );
}

const BOOK_LINES = [
  "“All that is gold does not glitter.”",
  "A book about clouds. You've read it three times.",
  "“The sea has no end.” Bookmarked on page 42.",
  "A recipe book. Mostly onigiri.",
  "Poems for rainy days. Very fitting.",
];

export function Bookcase() {
  const speak = useSpeak();
  const [pulled, setPulled] = useState<number | null>(null);
  const [out, slide, jump] = useTween(450);
  const putBack = useRef(0);

  const back = poly([CASE.x0 + 0.02, F + 0.02, CASE.z0], [CASE.x0 + 0.02, CASE.top, CASE.z0], [CASE.x0 + 0.02, CASE.top, CASE.z1], [CASE.x0 + 0.02, F + 0.02, CASE.z1]);
  const side = box(CASE.x0, CASE.x1, F, CASE.top, CASE.z0 - 0.06, CASE.z0);
  const farSide = box(CASE.x0, CASE.x1, F, CASE.top, CASE.z1, CASE.z1 + 0.06);

  function pullOut(event: React.MouseEvent<SVGGElement>) {
    const point = toScene(event);

    if (!point) {
      return;
    }

    // The book nearest to where you clicked.
    let index = 0;
    let best = Infinity;

    BOOKS.forEach((book, i) => {
      const distance = Math.hypot(book.cx - point.x, (book.cy - point.y) * 0.5);

      if (distance < best) {
        best = distance;
        index = i;
      }
    });

    window.clearTimeout(putBack.current);
    playSfx("rustle");
    jump(0);
    setPulled(index);
    slide(1);

    const book = BOOKS[index];
    speak(book.cx + 70, book.cy - 30, `📖 ${pick(BOOK_LINES)}`);

    // Slide it back after a little read.
    putBack.current = window.setTimeout(() => slide(0, () => setPulled(null)), 4200);
  }

  return (
    <g className="sc-hit" onClick={pullOut}>
      {/* Contact shadow on the floor along the front of the case */}
      <path d={poly([CASE.x1, F, CASE.z0 - 0.1], [CASE.x1 + 0.3, F, CASE.z0 - 0.1], [CASE.x1 + 0.2, F, CASE.z1], [CASE.x1, F, CASE.z1])} fill="#1e2633" opacity="0.13" />
      <path d={back} fill={C.woodDark} />
      <path d={farSide.front} fill={C.woodSide} />

      {BOOKS.map((book, index) => (index === pulled ? null : <BookSpine key={index} book={book} />))}
      <g fill="#000000" opacity="0.18">
        {BOOKS.map((book, index) =>
          index % 3 === 0 && index !== pulled ? <path key={index} d={bookFaces(book, 0).spine} /> : null
        )}
      </g>

      {SHELF_LEVELS.map((level) => {
        const board = box(CASE.x0, CASE.x1, level - 0.05, level, CASE.z0, CASE.z1);
        return (
          <g key={level}>
            {level < 0 ? <path d={board.top} fill={C.woodTop} /> : null}
            <path d={board.right} fill={C.woodFront} />
          </g>
        );
      })}
      <path d={box(CASE.x0, CASE.x1, CASE.top - 0.06, CASE.top, CASE.z0, CASE.z1).right} fill={C.woodFront} />
      <path d={box(CASE.x0, CASE.x1, CASE.top - 0.06, CASE.top, CASE.z0, CASE.z1).bottom} fill={C.woodSide} />

      {/* The pulled book sticks out past the shelf edge */}
      {pulled !== null && <BookSpine book={BOOKS[pulled]} out={out} />}

      <path d={side.front} fill={C.woodFront} />
      <path d={side.right} fill={C.woodSide} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Dresser with flowers                                                */
/* ------------------------------------------------------------------ */

export function Dresser() {
  const body = box(-5, -4.15, F, -1.15, 5.4, 6.9);
  const drawer = (y0: number, y1: number) =>
    poly([-4.14, y0, 5.5], [-4.14, y1, 5.5], [-4.14, y1, 6.8], [-4.14, y0, 6.8]);

  const [vx, vy] = project([-4.6, -1.15, 6.4]);
  const s = scaleAt(6.4);

  return (
    <g>
      <path d={body.top} fill={C.woodTop} />
      <path d={body.right} fill={C.woodFront} />
      <path d={body.front} fill={C.woodSide} />
      {[[-1.55, -1.25], [-1.95, -1.6], [-2.35, -2.0]].map(([y0, y1]) => {
        const [hx, hy] = project([-4.14, (y0 + y1) / 2, 6.15]);
        return (
          <g key={y0}>
            <path d={drawer(y0, y1)} fill="#cfa46c" stroke={C.woodDark} strokeWidth="1" strokeOpacity="0.35" />
            <ellipse cx={hx} cy={hy} rx="3" ry="5" fill="#8a6a44" />
          </g>
        );
      })}

      {/* A vase of white flowers */}
      <g>
        <path
          d={`M${vx - 0.09 * s} ${vy} C ${vx - 0.14 * s} ${vy - 0.12 * s} ${vx - 0.1 * s} ${vy - 0.28 * s} ${vx - 0.05 * s} ${vy - 0.32 * s} L ${vx + 0.05 * s} ${vy - 0.32 * s} C ${vx + 0.1 * s} ${vy - 0.28 * s} ${vx + 0.14 * s} ${vy - 0.12 * s} ${vx + 0.09 * s} ${vy} Z`}
          fill="#6e88b8"
        />
        <path d={`M${vx - 0.08 * s} ${vy - 0.04 * s} C ${vx - 0.12 * s} ${vy - 0.14 * s} ${vx - 0.08 * s} ${vy - 0.26 * s} ${vx - 0.04 * s} ${vy - 0.3 * s}`} stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" />
        {[[-0.16, -0.5], [-0.04, -0.62], [0.1, -0.54], [0.2, -0.44], [-0.24, -0.4], [0.02, -0.46]].map(([dx, dy], index) => (
          <g key={index}>
            <line x1={vx} y1={vy - 0.3 * s} x2={vx + dx * s} y2={vy + dy * s} stroke={C.plantDark} strokeWidth="1.5" />
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse
                key={angle}
                cx={vx + dx * s}
                cy={vy + dy * s - 4}
                rx="3"
                ry="4.5"
                fill="#fbfaf6"
                transform={`rotate(${angle} ${vx + dx * s} ${vy + dy * s})`}
              />
            ))}
            <circle cx={vx + dx * s} cy={vy + dy * s} r="2" fill="#e7c95a" />
          </g>
        ))}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Wall shelf above the bed                                            */
/* ------------------------------------------------------------------ */

const WALL_SHELF_BOOKS = (() => {
  const random = mulberry32(61);
  const books: Array<{ d: string; color: string }> = [];
  let z = 6.75;

  while (z < 8.45) {
    const width = 0.08 + random() * 0.09;
    const height = 0.4 + random() * 0.25;

    books.push({
      d: poly([4.66, 0.46, z], [4.66, 0.46 + height, z], [4.66, 0.46 + height, z + width], [4.66, 0.46, z + width]),
      color: C.books[Math.floor(random() * C.books.length)],
    });

    z += width + 0.01;
  }

  return books;
})();

export function WallShelf() {
  const board = box(4.6, 5, 0.4, 0.46, 6.6, 8.6);

  return (
    <g>
      {WALL_SHELF_BOOKS.map((book, index) => (
        <path key={index} d={book.d} fill={book.color} />
      ))}
      <path d={board.bottom} fill={C.woodSide} />
      <path d={board.left} fill={C.woodFront} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Things on the back wall                                             */
/* ------------------------------------------------------------------ */

export function Painting() {
  const z = B - 0.02;
  const [x0, y0] = project([-4.25, 1.6, z]);
  const [x1, y1] = project([-3.45, 0.4, z]);
  const w = x1 - x0;
  const h = y1 - y0;

  return (
    <g>
      <rect x={x0 + 4} y={y0 + 6} width={w} height={h} fill={C.shadow} />
      <rect x={x0} y={y0} width={w} height={h} fill="#a27a52" />
      <rect x={x0 + 5} y={y0 + 5} width={w - 10} height={h - 10} fill={C.paper} />
      <rect x={x0 + 10} y={y0 + 10} width={w - 20} height={h - 20} fill="#9fc6e6" />
      <rect x={x0 + 10} y={y0 + 10 + (h - 20) * 0.55} width={w - 20} height={(h - 20) * 0.45} fill="#d7e8ef" />
      <g fill="#ffffff">
        <circle cx={x0 + w * 0.42} cy={y0 + h * 0.36} r={w * 0.11} />
        <circle cx={x0 + w * 0.56} cy={y0 + h * 0.31} r={w * 0.14} />
        <circle cx={x0 + w * 0.68} cy={y0 + h * 0.37} r={w * 0.1} />
        <rect x={x0 + w * 0.32} y={y0 + h * 0.36} width={w * 0.44} height={w * 0.08} />
      </g>
      <path
        d={`M${x0 + 10} ${y0 + h * 0.72} C ${x0 + w * 0.3} ${y0 + h * 0.62} ${x0 + w * 0.6} ${y0 + h * 0.66} ${x1 - 10} ${y0 + h * 0.6} V${y1 - 10} H${x0 + 10} Z`}
        fill="#6f9f63"
      />
      <path d={`M${x0 + 10} ${y0 + h * 0.82} C ${x0 + w * 0.4} ${y0 + h * 0.74} ${x0 + w * 0.7} ${y0 + h * 0.8} ${x1 - 10} ${y0 + h * 0.74} V${y1 - 10} H${x0 + 10} Z`} fill="#5a8a50" />
    </g>
  );
}

export function WallClock() {
  const now = useNow();
  const speak = useSpeak();

  const [cx, cy] = project([4.05, 1.55, B - 0.02]);
  const r = 0.32 * scaleAt(B);

  const hours = now ? now.getHours() % 12 : 10;
  const minutes = now ? now.getMinutes() : 10;
  const seconds = now ? now.getSeconds() : 0;

  function tellTime() {
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const english = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    playSfx("chime");
    speak(cx, cy - r - 6, `It's ${english} · ${h < 12 ? "午前" : "午後"}${h % 12 || 12}時${m}分`);
  }

  return (
    <g className="sc-hit" onClick={tellTime}>
      <g>
        <circle cx={cx + 3} cy={cy + 4} r={r} fill={C.shadow} />
        <circle cx={cx} cy={cy} r={r} fill="#8a6a4a" />
        <circle cx={cx} cy={cy} r={r * 0.84} fill="#fbfaf6" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * Math.PI) / 6;
          const inner = index % 3 === 0 ? r * 0.62 : r * 0.7;
          return (
            <line
              key={index}
              x1={(cx + Math.sin(angle) * inner).toFixed(2)}
              y1={(cy - Math.cos(angle) * inner).toFixed(2)}
              x2={(cx + Math.sin(angle) * r * 0.76).toFixed(2)}
              y2={(cy - Math.cos(angle) * r * 0.76).toFixed(2)}
              stroke="#4a4540"
              strokeWidth={index % 3 === 0 ? 1.8 : 0.9}
            />
          );
        })}
        <g strokeLinecap="round">
          <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.42} stroke="#33302c" strokeWidth="2.6" transform={`rotate(${(hours + minutes / 60) * 30} ${cx} ${cy})`} />
          <line x1={cx} y1={cy} x2={cx} y2={cy - r * 0.62} stroke="#33302c" strokeWidth="1.8" transform={`rotate(${(minutes + seconds / 60) * 6} ${cx} ${cy})`} />
          <line x1={cx} y1={cy + r * 0.12} x2={cx} y2={cy - r * 0.68} stroke="#c45a3a" strokeWidth="0.9" transform={`rotate(${seconds * 6} ${cx} ${cy})`} />
        </g>
        <circle cx={cx} cy={cy} r="2.2" fill="#c45a3a" />
        <path d={`M${cx - r * 0.6} ${cy - r * 0.2} A ${r * 0.66} ${r * 0.66} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.64}`} stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function Corkboard() {
  const [poke, bump] = usePoke();
  const [fluttering, setFluttering] = useState(0);

  const z = B - 0.02;
  const [x0, y0] = project([3.45, 0.75, z]);
  const [x1, y1] = project([4.75, -0.35, z]);
  const w = x1 - x0;
  const h = y1 - y0;

  const notes = [
    { x: 0.08, y: 0.12, w: 0.26, h: 0.3, color: "#f4e7a8", rotate: -4 },
    { x: 0.4, y: 0.1, w: 0.22, h: 0.36, color: "#fbfaf6", rotate: 3 },
    { x: 0.68, y: 0.16, w: 0.24, h: 0.28, color: "#cfe3f0", rotate: -2 },
    { x: 0.14, y: 0.56, w: 0.3, h: 0.3, color: "#d9ead3", rotate: 2 },
    { x: 0.56, y: 0.56, w: 0.32, h: 0.32, color: "#f6dcc6", rotate: -3 },
  ];

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        setFluttering(Math.floor(Math.random() * 5));
        bump();
        // The corkboard holds your notes.
        useNotesStore.getState().setOpen(true);
      }}
    >
      <rect x={x0 + 3} y={y0 + 5} width={w} height={h} fill={C.shadow} />
      <rect x={x0} y={y0} width={w} height={h} rx="2" fill="#a27a52" />
      <rect x={x0 + 4} y={y0 + 4} width={w - 8} height={h - 8} fill="#c8a072" />
      <g>
        {notes.map((note, index) => {
          const nx = x0 + 4 + note.x * (w - 8);
          const ny = y0 + 4 + note.y * (h - 8);
          const nw = note.w * (w - 8);
          const nh = note.h * (h - 8);
          return (
            <g key={index} transform={`rotate(${note.rotate} ${nx + nw / 2} ${ny + nh / 2})`}>
              <g
                key={index === fluttering ? poke : 0}
                className={poke && index === fluttering ? "sc-flutter" : undefined}
                style={pivot("50% 0%")}
              >
              <rect x={nx} y={ny} width={nw} height={nh} fill={note.color} />
              <g stroke="#7a7066" strokeWidth="0.7" opacity="0.5">
                <line x1={nx + 3} y1={ny + nh * 0.35} x2={nx + nw - 3} y2={ny + nh * 0.35} />
                <line x1={nx + 3} y1={ny + nh * 0.55} x2={nx + nw - 6} y2={ny + nh * 0.55} />
              </g>
              </g>
              <circle cx={nx + nw / 2} cy={ny + 3} r="2" fill="#c45a3a" />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Little things that make the room feel lived in                      */
/* ------------------------------------------------------------------ */

function AtPoint({ at, children }: { at: Vec3; children: React.ReactNode }) {
  const [x, y] = project(at);
  const s = scaleAt(at[2]) / 100;

  return <g transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}>{children}</g>;
}

export function FloorClutter() {
  return (
    <g>
      {/* A stack of books by the bookcase */}
      <AtPoint at={[-3.55, F, 6.5]}>
        <ellipse cx="0" cy="2" rx="34" ry="6" fill="#000000" opacity="0.18" />
        {[
          { y: -9, w: 58, color: C.books[0], rotate: -2 },
          { y: -18, w: 52, color: C.books[7], rotate: 3 },
          { y: -26, w: 48, color: C.books[3], rotate: -4 },
        ].map((book) => (
          <g key={book.y} transform={`rotate(${book.rotate} 0 ${book.y})`}>
            <rect x={-book.w / 2} y={book.y} width={book.w} height="9" rx="1.5" fill={book.color} />
            <rect x={book.w / 2 - 6} y={book.y + 1.5} width="5" height="6" fill="#f3eee4" />
          </g>
        ))}
      </AtPoint>

      {/* Floor cushion */}
      <AtPoint at={[-2.75, F, 6.05]}>
        <ellipse cx="0" cy="3" rx="52" ry="10" fill="#000000" opacity="0.15" />
        <path d="M-50 -2 Q -52 -16 -30 -18 L 30 -18 Q 52 -16 50 -2 Q 48 8 30 8 L -30 8 Q -48 8 -50 -2 Z" fill="#c9a25f" />
        <path d="M-44 -12 Q 0 -20 44 -12" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.3" />
        <circle cx="0" cy="-6" r="3" fill="#a07d44" />
      </AtPoint>

      {/* Slippers by the bed */}
      <AtPoint at={[2.25, F, 6.0]}>
        {[-14, 14].map((x) => (
          <g key={x} transform={`rotate(${x > 0 ? 8 : -6} ${x} 0)`}>
            <ellipse cx={x} cy="0" rx="11" ry="20" fill="#7e93b3" />
            <ellipse cx={x} cy="-8" rx="10" ry="9" fill="#5f7599" />
            <ellipse cx={x - 3} cy="6" rx="4" ry="7" fill="#ffffff" opacity="0.2" />
          </g>
        ))}
      </AtPoint>

      {/* Little bin under the desk */}
      <AtPoint at={[1.15, F, 9.3]}>
        <path d="M-15 -32 H15 L12 0 H-12 Z" fill="#9aa6b2" />
        <path d="M-15 -32 H-7 L-6 0 H-12 Z" fill="#ffffff" opacity="0.2" />
        <ellipse cx="0" cy="-32" rx="15" ry="3.5" fill="#7d8996" />
        <path d="M-6 -34 l 4 -6 l 6 3 l -2 5 Z" fill="#f3eee4" />
      </AtPoint>
    </g>
  );
}

/** A plush seal on the bed. Squeaks. */
export function Plush() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <AtPoint at={[3.45, -1.6, 8.55]}>
        <ellipse cx="0" cy="-2" rx="30" ry="6" fill="#000000" opacity="0.12" />
        <g key={poke} className={poke ? "sc-squish" : undefined} style={pivot("50% 100%")}>
          <path d="M-28 -2 C -30 -22 -12 -34 4 -32 C 22 -30 32 -18 30 -4 C 28 2 -24 4 -28 -2 Z" fill="#f4f6f8" />
          <path d="M-28 -2 C -30 -12 -24 -20 -14 -24 C -22 -14 -22 -6 -20 0 Z" fill="#d9e0e6" />
          <ellipse cx="18" cy="-1" rx="9" ry="4" fill="#e6ebef" />
          <circle cx="-6" cy="-20" r="1.8" fill="#2e3440" />
          <circle cx="6" cy="-20" r="1.8" fill="#2e3440" />
          <ellipse cx="0" cy="-15" rx="2.6" ry="1.8" fill="#2e3440" />
          <ellipse cx="-11" cy="-15" rx="3" ry="1.8" fill="#f0b3a8" opacity="0.7" />
          <ellipse cx="11" cy="-15" rx="3" ry="1.8" fill="#f0b3a8" opacity="0.7" />
        </g>
      </AtPoint>
    </g>
  );
}
