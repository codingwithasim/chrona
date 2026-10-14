"use client";

import { Check, Lock } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { useRoomUnlocks } from "@/hooks/use-room";
import { formatHours, unlockTitle, UNLOCKS } from "@/lib/unlocks";
import { cn } from "@/lib/utils";
import { type Coat, COATS, DEFAULT_CAT_NAME, useRoomStore } from "@/stores/room-store";

/** Name your cat and pick her coat. */
export function YourCat() {
  const name = useRoomStore((state) => state.catName);
  const setName = useRoomStore((state) => state.setCatName);
  const coat = useRoomStore((state) => state.coat);
  const setCoat = useRoomStore((state) => state.setCoat);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3 text-[13px] font-medium">
        Name
        <input
          value={name}
          maxLength={16}
          placeholder={DEFAULT_CAT_NAME}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => !name.trim() && setName(DEFAULT_CAT_NAME)}
          className="h-8 w-40 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3.5 text-right text-[13px] font-normal outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25"
        />
      </label>

      <div className="space-y-2">
        <p className="text-[13px] font-medium">Coat</p>
        <div role="radiogroup" aria-label="Coat" className="flex flex-wrap gap-2">
          {(Object.keys(COATS) as Coat[]).map((id) => {
            const colors = COATS[id];
            const active = id === coat;

            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCoat(id)}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-[12px] transition-colors duration-300",
                  active ? "border-foreground/30 bg-foreground/[0.06] text-foreground" : "border-foreground/10 text-muted-foreground hover:text-foreground"
                )}
              >
                {/* A little swatch: fur with its patches */}
                <span className="relative size-6 overflow-hidden rounded-full ring-1 ring-black/10" style={{ backgroundColor: colors.fur }}>
                  <span className="absolute -top-1 -left-1 size-3.5 rounded-full" style={{ backgroundColor: colors.patch }} />
                  <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full" style={{ backgroundColor: colors.patch2 }} />
                </span>
                {colors.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** What the room has earned, what's next, and a way to put things away. */
export function RoomGrowth() {
  const { minutes } = useRoomUnlocks();
  const name = useRoomStore((state) => state.catName.trim() || DEFAULT_CAT_NAME);
  const hidden = useRoomStore((state) => state.hidden);
  const toggleHidden = useRoomStore((state) => state.toggleHidden);

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-5 text-muted-foreground">
        The room grows as you focus. {formatHours(minutes)} so far.
      </p>

      <ul className="space-y-2">
        {UNLOCKS.map((unlock) => {
          const earned = minutes >= unlock.minutes;

          return (
            <li key={unlock.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full",
                  earned ? "bg-[color-mix(in_oklab,var(--mint)_25%,transparent)] text-foreground" : "bg-foreground/[0.05] text-muted-foreground/70"
                )}
              >
                {earned ? <Check className="size-3.5" strokeWidth={2} /> : <Lock className="size-3" strokeWidth={1.8} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className={cn("block text-[13px]", earned ? "text-foreground" : "text-foreground/60")}>
                  {unlockTitle(unlock, name)}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {earned ? unlock.where : `At ${formatHours(unlock.minutes)} of focus · ${formatHours(unlock.minutes - minutes)} to go`}
                </span>
              </span>

              {earned && (
                <Switch
                  aria-label={`Show ${unlockTitle(unlock, name).toLowerCase()} in the room`}
                  checked={!hidden.includes(unlock.id)}
                  onCheckedChange={() => toggleHidden(unlock.id)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
