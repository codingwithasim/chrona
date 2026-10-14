/**
 * Time of day, seasons and weather for the room.
 *
 * NOTE: `SCENE_BOOT_SCRIPT` repeats the resolve rules below in plain
 * JavaScript so the right scene paints before React loads. Keep the
 * two in sync.
 */

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type TimeSetting = "auto" | TimeOfDay;

export type Season = "spring" | "summer" | "autumn" | "winter";
export type SeasonSetting = "auto" | Season;

export type Weather = "clear" | "drizzle" | "storm" | "snow";

export const SCENE_STORAGE_KEY = "chrona-scene";

export function resolveTimeOfDay(
  setting: TimeSetting,
  date: Date
): TimeOfDay {
  if (setting !== "auto") {
    return setting;
  }

  const hour = date.getHours();

  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";

  return "night";
}

export function resolveSeason(setting: SeasonSetting, date: Date): Season {
  if (setting !== "auto") {
    return setting;
  }

  const month = date.getMonth();

  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";

  return "winter";
}

export function isDarkTime(time: TimeOfDay) {
  return time === "evening" || time === "night";
}

export const timeLabels: Record<TimeSetting, { label: string; jp: string }> = {
  auto: { label: "Follow my clock", jp: "じどう" },
  morning: { label: "Morning", jp: "あさ" },
  day: { label: "Day", jp: "ひる" },
  evening: { label: "Evening", jp: "ゆうがた" },
  night: { label: "Night", jp: "よる" },
};

export const seasonLabels: Record<SeasonSetting, { label: string; jp: string }> = {
  auto: { label: "Follow the calendar", jp: "じどう" },
  spring: { label: "Spring", jp: "はる" },
  summer: { label: "Summer", jp: "なつ" },
  autumn: { label: "Autumn", jp: "あき" },
  winter: { label: "Winter", jp: "ふゆ" },
};

export const weatherLabels: Record<Weather, { label: string; jp: string }> = {
  clear: { label: "Clear", jp: "はれ" },
  drizzle: { label: "Drizzle", jp: "こさめ" },
  storm: { label: "Storm", jp: "あらし" },
  snow: { label: "Snow", jp: "ゆき" },
};

/**
 * Runs in <head> before the first paint: reads the saved scene
 * settings and sets data-tod / data-season / data-weather plus the
 * dark class on <html>.
 */
export const SCENE_BOOT_SCRIPT = `(function(){try{
var s={};try{s=(JSON.parse(localStorage.getItem("${SCENE_STORAGE_KEY}")||"{}").state)||{}}catch(e){}
var d=new Date(),h=d.getHours(),m=d.getMonth();
var t=s.timeOfDay&&s.timeOfDay!=="auto"?s.timeOfDay:(h>=5&&h<10?"morning":h>=10&&h<17?"day":h>=17&&h<20?"evening":"night");
var n=s.season&&s.season!=="auto"?s.season:(m>=2&&m<=4?"spring":m>=5&&m<=7?"summer":m>=8&&m<=10?"autumn":"winter");
var w=s.weather||"drizzle";
var r=document.documentElement,k=t==="evening"||t==="night";
r.setAttribute("data-tod",t);r.setAttribute("data-season",n);r.setAttribute("data-weather",w);
r.classList.toggle("dark",k);r.style.colorScheme=k?"dark":"light";
}catch(e){}})();`;
