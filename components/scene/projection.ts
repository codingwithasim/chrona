/**
 * A tiny one-point-perspective camera for drawing the room.
 *
 * World units: X to the right, Y up, Z away from the viewer.
 * The camera sits at the origin looking down +Z; the vanishing
 * point is (800, 440) in the 1600×1000 scene.
 */

export const VP = { x: 800, y: 440 };
export const FOCAL = 1120;

/** The room box. */
export const ROOM = {
  left: -5,
  right: 5,
  floor: -2.5,
  ceiling: 3.125,
  back: 10,
  near: 4,
};

/** Window opening in the back wall (the glass sits in a recess). */
export const WINDOW = {
  left: -3.1,
  right: 3.1,
  bottom: -0.85,
  top: 2.55,
  /** Frame plane, set back into the wall. */
  depth: 10.25,
  /** Glass edges inside the frame. */
  glass: { left: -3.0, right: 3.0, bottom: -0.75, top: 2.45 },
  mullion: 0.06,
  transom: { bottom: 1.55, top: 1.65 },
};

export const DESK = {
  left: -3.0,
  right: 3.0,
  front: 8.7,
  back: 10,
  top: -1.3,
  thickness: 0.08,
};

export type Vec3 = [number, number, number];
export type Point = [number, number];

const round = (value: number) => Math.round(value * 100) / 100;

export function project([x, y, z]: Vec3): Point {
  return [round(VP.x + (FOCAL * x) / z), round(VP.y - (FOCAL * y) / z)];
}

/** Screen-space path for a polygon given in world space. */
export function poly(...points: Vec3[]) {
  return pathOf(points.map(project));
}

export function pathOf(points: Point[]) {
  return (
    points
      .map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`)
      .join(" ") + " Z"
  );
}

/** Pixels per world unit at a given depth. */
export function scaleAt(z: number) {
  return FOCAL / z;
}

/** Faces of an axis-aligned box, as screen paths. */
export function box(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number
) {
  return {
    top: poly([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]),
    bottom: poly([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]),
    front: poly([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]),
    back: poly([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]),
    left: poly([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]),
    right: poly([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]),
  };
}

/* ------------------------------------------------------------------ */
/* Light through the window                                            */
/* ------------------------------------------------------------------ */

export type Plane =
  | { axis: "y"; value: number }
  | { axis: "x"; value: number };

/** Where a ray from `origin` along `dir` meets the plane, if ahead. */
export function hit(origin: Vec3, dir: Vec3, plane: Plane): Vec3 | null {
  const index = plane.axis === "x" ? 0 : 1;
  const d = dir[index];

  if (Math.abs(d) < 1e-6) {
    return null;
  }

  const t = (plane.value - origin[index]) / d;

  if (t <= 0) {
    return null;
  }

  return [origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t];
}

/** The four panes of glass, as world-space rectangles. */
export function panes(): Vec3[][] {
  const { glass, mullion, transom, depth } = WINDOW;
  const columns = [
    [glass.left, -mullion],
    [mullion, glass.right],
  ];
  const rows = [
    [glass.bottom, transom.bottom],
    [transom.top, glass.top],
  ];

  return columns.flatMap(([x0, x1]) =>
    rows.map(([y0, y1]) => [
      [x0, y0, depth],
      [x1, y0, depth],
      [x1, y1, depth],
      [x0, y1, depth],
    ] as Vec3[])
  );
}

/** Each pane cast along the light onto a plane, as screen polygons. */
export function castPanes(light: Vec3, plane: Plane) {
  return panes()
    .map((pane) => pane.map((corner) => hit(corner, light, plane)))
    .filter((corners): corners is Vec3[] => corners.every(Boolean))
    .map((corners) => corners.map(project));
}

/** Convex hull (screen space), for drawing shafts of light. */
export function hull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: Point[] = [];

  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }

    lower.push(point);
  }

  const upper: Point[] = [];

  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }

    upper.push(point);
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Direction the light travels, for each time of day. */
export const LIGHT_DIRECTION = {
  morning: [0.55, -0.5, -1] as Vec3,
  day: [-0.22, -0.78, -1] as Vec3,
  evening: [-0.42, -0.5, -1] as Vec3,
  night: [0.1, -0.74, -1] as Vec3,
};

/** The window glass rectangle on screen (for the landscape and rain). */
export const GLASS_RECT = (() => {
  const [x0, y0] = project([WINDOW.glass.left, WINDOW.glass.top, WINDOW.depth]);
  const [x1, y1] = project([WINDOW.glass.right, WINDOW.glass.bottom, WINDOW.depth]);

  return { x: x0, y: y0, w: round(x1 - x0), h: round(y1 - y0) };
})();
