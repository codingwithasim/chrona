import type { FocusDay } from "@/stores/focus-store";

/**
 * Draws "your week" as a picture to keep or share, entirely in the
 * browser: a dusk sky, the week's focus as soft bars, and the cat.
 */

export type RecapData = {
  week: FocusDay[];
  streak: number;
  catName: string;
};

const W = 1080;
const H = 1350;

function hoursLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** The app's rounded font, if the page has it loaded. */
function fontFamily() {
  const kiwi = getComputedStyle(document.documentElement).getPropertyValue("--font-kiwi").trim();
  return kiwi ? `${kiwi}, ui-rounded, system-ui, sans-serif` : "ui-rounded, system-ui, sans-serif";
}

export async function drawRecap({ week, streak, catName }: RecapData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = fontFamily();

  // The page loads font weights lazily; make sure the card's are here.
  await Promise.all(
    ["300", "400", "500"].map((weight) =>
      document.fonts?.load(`${weight} 40px ${font}`, "My week 0123456789hm").catch(() => [])
    )
  );

  // Dusk sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1c2547");
  sky.addColorStop(0.6, "#2c3a6b");
  sky.addColorStop(1, "#4b4f7c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // A few quiet stars
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.25 + random() * 0.55;
    ctx.fillStyle = "#fff6d8";
    ctx.beginPath();
    ctx.arc(random() * W, random() * H * 0.55, 1 + random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // A soft moon
  const moon = ctx.createRadialGradient(880, 210, 10, 880, 210, 200);
  moon.addColorStop(0, "rgba(255, 240, 200, 0.35)");
  moon.addColorStop(1, "rgba(255, 240, 200, 0)");
  ctx.fillStyle = moon;
  ctx.fillRect(600, 0, 480, 450);
  ctx.fillStyle = "#fbf1d6";
  ctx.beginPath();
  ctx.arc(880, 210, 54, 0, Math.PI * 2);
  ctx.fill();

  // Heading, with the icon
  try {
    const icon = await loadImage("/icons/icon-192.png");
    ctx.save();
    roundRect(ctx, 96, 110, 96, 96, 26);
    ctx.clip();
    ctx.drawImage(icon, 96, 110, 96, 96);
    ctx.restore();
  } catch {
    // No icon offline? The card still works.
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.font = `500 44px ${font}`;
  ctx.fillText("My week", 220, 152);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = `400 28px ${font}`;
  const first = new Date(`${week[0].date}T12:00:00`);
  const last = new Date(`${week[week.length - 1].date}T12:00:00`);
  const range = `${first.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${last.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  ctx.fillText(range, 220, 196);

  // The big number
  const total = week.reduce((sum, day) => sum + day.minutes, 0);
  const sessions = week.reduce((sum, day) => sum + day.sessions, 0);
  ctx.fillStyle = "#ffffff";
  ctx.font = `300 150px ${font}`;
  ctx.fillText(hoursLabel(total), 96, 430);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = `400 34px ${font}`;
  ctx.fillText("of calm, focused time", 100, 490);

  // Little stats
  const best = week.reduce((top, day) => (day.minutes > top.minutes ? day : top), week[0]);
  const stats: Array<[string, string]> = [
    [String(sessions), sessions === 1 ? "session" : "sessions"],
    [String(streak), streak === 1 ? "day streak" : "days streak"],
    [best.minutes ? new Date(`${best.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" }) : "–", "best day"],
  ];

  stats.forEach(([value, label], index) => {
    const x = 96 + index * 300;
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    roundRect(ctx, x, 560, 270, 150, 34);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `400 56px ${font}`;
    ctx.fillText(value, x + 34, 640);
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.font = `400 26px ${font}`;
    ctx.fillText(label, x + 34, 684);
  });

  // The week as soft bars
  const peak = Math.max(30, ...week.map((day) => day.minutes));
  const barsTop = 790;
  const barsHeight = 300;
  const slot = (W - 192) / week.length;

  week.forEach((day, index) => {
    const height = Math.max(14, (day.minutes / peak) * barsHeight);
    const x = 96 + index * slot + slot * 0.2;
    const width = slot * 0.6;
    const y = barsTop + barsHeight - height;

    ctx.fillStyle = day.minutes > 0 ? "#f0a35e" : "rgba(255, 255, 255, 0.12)";
    ctx.globalAlpha = index === week.length - 1 ? 1 : 0.8;
    roundRect(ctx, x, y, width, height, width / 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = `400 26px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "narrow" }), x + width / 2, barsTop + barsHeight + 46);
    ctx.textAlign = "left";
  });

  // Footer
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = `400 28px ${font}`;
  ctx.fillText(`${catName} kept me company`, 96, H - 110);
  ctx.textAlign = "right";
  ctx.fillText(window.location.host || "chrona", W - 96, H - 110);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not draw the card"))), "image/png")
  );
}
