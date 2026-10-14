import type { Weather } from "@/lib/scene-time";

/**
 * Optional: let the room match the weather where you are. Uses your
 * rough location (rounded to ~10 km) and Open-Meteo's free forecast,
 * which needs no account or key. Nothing goes anywhere else.
 */

export type Place = { lat: number; lon: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** WMO weather codes, folded into the room's four kinds of weather. */
export function weatherFromCode(code: number): Weather {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code === 65 || code === 82) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "drizzle";
  return "clear";
}

export function locate(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: round(position.coords.latitude), lon: round(position.coords.longitude) }),
      reject,
      { enableHighAccuracy: false, maximumAge: 6 * 60 * 60 * 1000, timeout: 15000 }
    );
  });
}

export async function fetchWeather({ lat, lon }: Place): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`weather ${response.status}`);
  }

  const data = (await response.json()) as { error?: boolean; current?: { weather_code?: number } };
  const code = data.current?.weather_code;

  // A busy service answers with an error instead of weather.
  if (data.error || typeof code !== "number") {
    throw new Error("no weather");
  }

  return weatherFromCode(code);
}
