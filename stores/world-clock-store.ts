"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type City = {
  name: string;
  country: string;
  timezone: string;
  countryCode: string;
};

const DEFAULT_CITIES: City[] = [
  { name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo", countryCode: "jp" },
  { name: "Paris", country: "France", timezone: "Europe/Paris", countryCode: "fr" },
  { name: "New York", country: "United States", timezone: "America/New_York", countryCode: "us" },
  { name: "London", country: "United Kingdom", timezone: "Europe/London", countryCode: "gb" },
];

export const ALL_CITIES: City[] = [
  ...DEFAULT_CITIES,
  { name: "Los Angeles", country: "United States", timezone: "America/Los_Angeles", countryCode: "us" },
  { name: "Chicago", country: "United States", timezone: "America/Chicago", countryCode: "us" },
  { name: "Honolulu", country: "United States", timezone: "Pacific/Honolulu", countryCode: "us" },
  { name: "Toronto", country: "Canada", timezone: "America/Toronto", countryCode: "ca" },
  { name: "Mexico City", country: "Mexico", timezone: "America/Mexico_City", countryCode: "mx" },
  { name: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo", countryCode: "br" },
  { name: "Madrid", country: "Spain", timezone: "Europe/Madrid", countryCode: "es" },
  { name: "Berlin", country: "Germany", timezone: "Europe/Berlin", countryCode: "de" },
  { name: "Istanbul", country: "Türkiye", timezone: "Europe/Istanbul", countryCode: "tr" },
  { name: "Moscow", country: "Russia", timezone: "Europe/Moscow", countryCode: "ru" },
  { name: "Cairo", country: "Egypt", timezone: "Africa/Cairo", countryCode: "eg" },
  { name: "Lagos", country: "Nigeria", timezone: "Africa/Lagos", countryCode: "ng" },
  { name: "Nairobi", country: "Kenya", timezone: "Africa/Nairobi", countryCode: "ke" },
  { name: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai", countryCode: "ae" },
  { name: "Riyadh", country: "Saudi Arabia", timezone: "Asia/Riyadh", countryCode: "sa" },
  { name: "Karachi", country: "Pakistan", timezone: "Asia/Karachi", countryCode: "pk" },
  { name: "Mumbai", country: "India", timezone: "Asia/Kolkata", countryCode: "in" },
  { name: "Kathmandu", country: "Nepal", timezone: "Asia/Kathmandu", countryCode: "np" },
  { name: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok", countryCode: "th" },
  { name: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta", countryCode: "id" },
  { name: "Singapore", country: "Singapore", timezone: "Asia/Singapore", countryCode: "sg" },
  { name: "Hong Kong", country: "China", timezone: "Asia/Hong_Kong", countryCode: "hk" },
  { name: "Shanghai", country: "China", timezone: "Asia/Shanghai", countryCode: "cn" },
  { name: "Seoul", country: "South Korea", timezone: "Asia/Seoul", countryCode: "kr" },
  { name: "Sydney", country: "Australia", timezone: "Australia/Sydney", countryCode: "au" },
  { name: "Auckland", country: "New Zealand", timezone: "Pacific/Auckland", countryCode: "nz" },
];

type WorldClockState = {
  cities: City[];

  hasHydrated: boolean;
  setHydrated: () => void;

  editingTimezone: string | null;

  addCity: (city: City) => void;
  updateCity: (oldTimezone: string, city: City) => void;
  removeCity: (timezone: string) => void;

  openEditCity: (timezone: string) => void;
  closeEditCity: () => void;
};

export function searchCities(query: string) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return ALL_CITIES;
  }

  return ALL_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.timezone.toLowerCase().includes(q)
  );
}

export const useWorldClockStore = create<WorldClockState>()(
  persist(
    (set) => ({
      cities: DEFAULT_CITIES,
      editingTimezone: null,

      hasHydrated: false,
      setHydrated: () => set({ hasHydrated: true }),

      addCity: (city) =>
        set((state) => {
          if (state.cities.some((c) => c.timezone === city.timezone)) {
            return state;
          }

          return { cities: [...state.cities, city] };
        }),

      updateCity: (oldTimezone, city) =>
        set((state) => {
          // Swapping to a city that's already shown just removes the old one.
          if (
            city.timezone !== oldTimezone &&
            state.cities.some((c) => c.timezone === city.timezone)
          ) {
            return {
              cities: state.cities.filter((c) => c.timezone !== oldTimezone),
            };
          }

          return {
            cities: state.cities.map((c) =>
              c.timezone === oldTimezone ? city : c
            ),
          };
        }),

      removeCity: (timezone) =>
        set((state) => ({
          cities: state.cities.filter((c) => c.timezone !== timezone),
        })),

      openEditCity: (timezone) => set({ editingTimezone: timezone }),
      closeEditCity: () => set({ editingTimezone: null }),
    }),
    {
      name: "world-clock-storage",
      skipHydration: true,
      partialize: (state) => ({
        cities: state.cities,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
