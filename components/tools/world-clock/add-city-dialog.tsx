"use client";

import { useState } from "react";
import { Check, LucideMap, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useNow } from "@/hooks/use-now";
import { useSceneStore } from "@/stores/scene-store";
import { type City, searchCities } from "@/stores/world-clock-store";

import { formatZonedTime, offsetFromLocal } from "./time-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (city: City) => void;
  /** Timezone being replaced, when changing a city. */
  editing?: City | null;
  added: string[];
};

export function CityDialog({
  open,
  onOpenChange,
  onSelect,
  editing,
  added,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        {/* Remount on open so the search starts empty */}
        {open && (
          <CityPicker
            onSelect={(city) => {
              onSelect(city);
              onOpenChange(false);
            }}
            editing={editing}
            added={added}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CityPicker({
  onSelect,
  editing,
  added,
}: {
  onSelect: (city: City) => void;
  editing?: City | null;
  added: string[];
}) {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);
  const [query, setQuery] = useState("");

  const results = searchCities(query);

  return (
    <>
      <div className="border-b-2 border-dashed border-border px-5 pt-5 pb-4">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editing ? `Swap ${editing.name} for…` : "Add a city"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search a city, country or time zone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto p-2">
        {results.length === 0 ? (
          <div className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideMap className="size-5" />
                </EmptyMedia>
              </EmptyHeader>
              <EmptyTitle>No cities found</EmptyTitle>
              <EmptyDescription>
                Try &ldquo;Tokyo&rdquo;, &ldquo;Karachi&rdquo; or &ldquo;Europe&rdquo;.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <ul className="space-y-1">
            {results.map((city) => {
              const isAdded = added.includes(city.timezone);
              const time = now ? formatZonedTime(now, city.timezone, hour24) : null;
              const offset = now ? offsetFromLocal(now, city.timezone) : null;

              return (
                <li key={city.timezone}>
                  <button
                    type="button"
                    disabled={isAdded}
                    onClick={() => onSelect(city)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors enabled:hover:bg-muted disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-bold">
                        {city.name}
                        {isAdded && <Check className="size-3.5 text-mint" />}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {city.country} · {city.timezone}
                      </span>
                    </span>

                    {time && (
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-sm">
                          {time.time}
                          {time.meridiem && (
                            <span className="ml-1 font-sans text-[10px] text-muted-foreground">
                              {time.meridiem}
                            </span>
                          )}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {offset ?? "your time"}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
