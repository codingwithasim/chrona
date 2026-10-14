/**
 * A little field mouse that sometimes scurries across the floor,
 * stopping to sniff, and bolting when Mochi gets close.
 */

import { BED_X, FLOOR_Y } from "./brain";

/** Her bed sits on the floor; the mouse runs round its front, not through it. */
const BED_HALF = 150;
const BED_FRONT = 24;

const SVG = "http://www.w3.org/2000/svg";

/** Holes it comes from and escapes into: under the bookcase and the bed. */
export const MOUSE_HOLES: [number, number] = [300, 1290];

export class FieldMouse {
  x: number;
  dir: 1 | -1;
  done = false;
  scared = false;
  /** Pinned under her paws for a moment (she always lets go). */
  caught = false;
  /** Let go: it only wants its hole now, and she leaves it be. */
  free = false;

  private speed = 120;
  private pause = 0;
  private nextPause = 0.8 + Math.random();
  private phase = 0;
  private sniff = 0;

  private group: SVGGElement;
  private body: SVGGElement;
  private tail: SVGPathElement;
  private feet: SVGEllipseElement[] = [];
  private head: SVGGElement;

  constructor(container: SVGElement, fromLeft: boolean) {
    this.dir = fromLeft ? 1 : -1;
    this.x = fromLeft ? MOUSE_HOLES[0] : MOUSE_HOLES[1];

    this.group = document.createElementNS(SVG, "g");
    this.group.setAttribute("style", "pointer-events: none");
    this.group.innerHTML = `
      <ellipse cx="0" cy="1" rx="14" ry="2.6" fill="url(#sc-drop-shadow)" />
      <path data-tail fill="none" stroke="#b9928f" stroke-width="1.5" stroke-linecap="round" />
      <ellipse data-foot cx="-5" cy="-1" rx="2.6" ry="1.3" fill="#d9a6a6" />
      <ellipse data-foot cx="5" cy="-1" rx="2.6" ry="1.3" fill="#d9a6a6" />
      <g data-body>
        <ellipse cx="0" cy="-6.5" rx="11.5" ry="6.6" fill="#8e8a97" />
        <ellipse cx="1" cy="-3.6" rx="8" ry="3" fill="#bdb8c4" />
        <ellipse cx="-3" cy="-9.4" rx="6" ry="2.2" fill="#ffffff" opacity="0.18" />
        <g data-head>
          <path d="M6 -11 Q 14 -12 18.5 -6.5 Q 14 -3 6 -3.5 Z" fill="#8e8a97" />
          <circle cx="8" cy="-12.2" r="3.9" fill="#8e8a97" />
          <circle cx="8.3" cy="-12" r="2.4" fill="#e7a9b1" />
          <circle cx="12.6" cy="-8.4" r="1.15" fill="#141018" />
          <circle cx="12.9" cy="-8.8" r="0.35" fill="#ffffff" />
          <circle cx="18.6" cy="-6.6" r="1" fill="#e48d9c" />
          <path d="M17 -6 l6 -1.5 M17 -5.6 l6 0.6 M16.6 -5.2 l5 2" stroke="#3a3540" stroke-width="0.4" opacity="0.6" />
        </g>
      </g>`;
    container.appendChild(this.group);

    this.tail = this.group.querySelector("[data-tail]")!;
    this.body = this.group.querySelector("[data-body]")!;
    this.head = this.group.querySelector("[data-head]")!;
    this.feet = Array.from(this.group.querySelectorAll("[data-foot]"));
  }

  /** Caught! Held a moment, then let go to run for its hole. */
  catchIt(catX: number) {
    this.caught = true;
    this.pause = 1.3;
    this.sniff = 0;
    window.setTimeout(() => {
      this.caught = false;
      this.free = true;
      this.scared = true;
      this.pause = 0;
      // Away from her, to the nearer hole on that side.
      this.dir = catX < this.x ? 1 : -1;
    }, 1300);
  }

  /**
   * `cat` is how she's moving: a running or leaping cat is noticed from a
   * way off; a stalking one only when she's almost on top of it.
   */
  update(dt: number, catX: number, cat: "calm" | "sneaky" | "loud") {
    if (this.caught) {
      this.sniff += dt;
      return;
    }

    const distance = Math.abs(catX - this.x);
    const noticed = (cat === "loud" && distance < 230) || (cat === "sneaky" && distance < 60);

    if (noticed && !this.scared) {
      this.scared = true;
      // A split second frozen in surprise, then it bolts.
      this.pause = 0.2 + Math.random() * 0.18;
      // Run away from the cat, to the nearest hole on the far side.
      this.dir = catX < this.x ? 1 : -1;
    }

    if (this.pause > 0) {
      this.pause -= dt;
      this.sniff += dt;
    } else {
      const speed = this.scared ? 290 : this.speed;
      this.x += this.dir * speed * dt;
      this.phase += dt * speed * 0.12;
      this.nextPause -= dt;

      if (!this.scared && this.nextPause <= 0) {
        this.pause = 0.4 + Math.random() * 1.1;
        this.nextPause = 0.7 + Math.random() * 1.4;
      }
    }

    if (this.x < MOUSE_HOLES[0] - 30 || this.x > MOUSE_HOLES[1] + 30) {
      this.done = true;
    }
  }

  draw() {
    const running = this.pause <= 0;
    const step = Math.sin(this.phase);

    // Round the front of her bed rather than through it.
    const nearBed = Math.max(0, 1 - Math.abs(this.x - BED_X) / BED_HALF);
    const y = FLOOR_Y + 8 + BED_FRONT * Math.sin((nearBed * Math.PI) / 2);
    // Caught: squashed flat under her paws, wriggling.
    const squash = this.caught ? `scale(1.15 0.7)` : "";

    this.group.setAttribute("transform", `translate(${this.x.toFixed(1)} ${y.toFixed(1)}) scale(${this.dir * 0.95} 0.95) ${squash}`);
    this.body.setAttribute("transform", `translate(0 ${running ? (Math.abs(step) * -1.4).toFixed(2) : 0})`);
    this.head.setAttribute(
      "transform",
      running ? "" : `rotate(${(Math.sin(this.sniff * (this.caught ? 30 : 18)) * (this.caught ? 6 : 3)).toFixed(1)} 8 -8)`
    );
    this.feet[0].setAttribute("cx", (-5 + (running ? step * 3 : 0)).toFixed(1));
    this.feet[1].setAttribute("cx", (5 - (running ? step * 3 : 0)).toFixed(1));

    const wave = Math.sin(this.phase * 0.7) * 3;
    this.tail.setAttribute("d", `M-10 -5 C -20 ${(-3 + wave).toFixed(1)} -26 ${(-11 - wave).toFixed(1)} -36 ${(-6 + wave).toFixed(1)}`);
  }

  remove() {
    this.group.remove();
  }
}
