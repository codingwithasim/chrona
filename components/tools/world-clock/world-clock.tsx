"use client";

import { useState } from "react";
import { Globe2, LoaderIcon, Plus, Undo2 } from "lucide-react";

import { ToolFrame } from "@/components/shell/tool-frame";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useNow } from "@/hooks/use-now";
import { useSceneStore } from "@/stores/scene-store";
import { useWorldClockStore } from "@/stores/world-clock-store";

import { CityDialog } from "./add-city-dialog";
import { TimezoneCard } from "./timezone-card";

function describeOffset(minutes: number) {
  const sign = minutes > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;

  return `${sign}${hours ? `${hours}h` : ""}${rest ? ` ${rest}m` : ""}`.trim();
}

export function WorldClockTool() {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);

  const cities = useWorldClockStore((state) => state.cities);
  const hasHydrated = useWorldClockStore((state) => state.hasHydrated);
  const editingTimezone = useWorldClockStore((state) => state.editingTimezone);
  const addCity = useWorldClockStore((state) => state.addCity);
  const updateCity = useWorldClockStore((state) => state.updateCity);
  const removeCity = useWorldClockStore((state) => state.removeCity);
  const openEditCity = useWorldClockStore((state) => state.openEditCity);
  const closeEditCity = useWorldClockStore((state) => state.closeEditCity);

  const [isAddOpen, setIsAddOpen] = useState(false);

  // Minutes added to "now" while scrubbing a timeline.
  const [offset, setOffset] = useState(0);

  const editing = cities.find((city) => city.timezone === editingTimezone) ?? null;
  const dialogOpen = isAddOpen || editing !== null;

  const preview = now ? new Date(now.getTime() + offset * 60_000) : null;

  return (
    <ToolFrame
      href="/world-clock"
      className="max-w-5xl"
      actions={
        <Button
          size="sm"
          onClick={() => {
            closeEditCity();
            setIsAddOpen(true);
          }}
        >
          <Plus />
          <span className="hidden sm:inline">Add city</span>
        </Button>
      }
    >
      <div className="mb-4 flex min-h-9 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Drag any timeline to see what time it would be everywhere else.
        </p>

        {offset !== 0 && (
          <Button size="sm" variant="secondary" onClick={() => setOffset(0)}>
            <Undo2 />
            Back to now
            <span className="font-display">({describeOffset(offset)})</span>
          </Button>
        )}
      </div>

      {!hasHydrated || !preview ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <LoaderIcon role="status" aria-label="Loading" className="size-4 animate-spin" />
          Loading clocks…
        </div>
      ) : cities.length === 0 ? (
        <Empty className="py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Globe2 className="size-5" />
            </EmptyMedia>
          </EmptyHeader>
          <EmptyTitle>No cities yet</EmptyTitle>
          <EmptyDescription>
            Add the places your friends, family or team live in.
          </EmptyDescription>
          <Button size="sm" className="mt-4" onClick={() => setIsAddOpen(true)}>
            <Plus />
            Add city
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((city) => (
            <TimezoneCard
              key={city.timezone}
              city={city}
              preview={preview}
              hour24={hour24}
              previewing={offset !== 0}
              onScrub={(delta) => setOffset((value) => value + delta)}
              onEdit={() => openEditCity(city.timezone)}
              onDelete={() => removeCity(city.timezone)}
            />
          ))}
        </div>
      )}

      <CityDialog
        open={dialogOpen}
        editing={editing}
        added={cities.map((city) => city.timezone)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditCity();
            setIsAddOpen(false);
          }
        }}
        onSelect={(city) => {
          if (editing) {
            updateCity(editing.timezone, city);
            closeEditCity();
          } else {
            addCity(city);
            setIsAddOpen(false);
          }
        }}
      />
    </ToolFrame>
  );
}
