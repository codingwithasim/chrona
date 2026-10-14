"use client";

import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Music2, Pause, Play, Plus, Shuffle, SkipBack, SkipForward, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/stores/music-store";

import { CalmRange } from "./sound-mixer";

/** Three little bars that bob while music plays. */
function PlayingBars() {
  return (
    <span aria-hidden="true" className="flex h-[15px] items-end gap-[2px]">
      {[0, -0.4, -0.8].map((delay) => (
        <span
          key={delay}
          className="music-bar w-[3px] rounded-full bg-current"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}

const round =
  "grid size-8 place-items-center rounded-full text-foreground/70 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground disabled:opacity-30";

/** Your own songs, from your computer, played in the room. */
export function MusicPlayer() {
  const tracks = useMusicStore((state) => state.tracks);
  const loaded = useMusicStore((state) => state.loaded);
  const currentId = useMusicStore((state) => state.currentId);
  const playing = useMusicStore((state) => state.playing);
  const volume = useMusicStore((state) => state.volume);
  const shuffle = useMusicStore((state) => state.shuffle);
  const failedId = useMusicStore((state) => state.failedId);
  const { load, add, remove, play, toggle, next, previous, setVolume, toggleShuffle } = useMusicStore.getState();

  const input = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);

  const current = tracks.find((track) => track.id === currentId);

  async function pick(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setAdding(true);
    await add(Array.from(files));
    setAdding(false);
  }

  return (
    <Popover.Root onOpenChange={(open) => open && !loaded && void load()}>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-8 rounded-full hover:text-foreground", playing ? "text-foreground/80" : "text-foreground/55")}
            aria-label={playing && current ? `Your music: playing ${current.name}` : "Your music"}
          >
            {playing ? <PlayingBars /> : <Music2 className="size-[17px]" strokeWidth={1.7} />}
          </Button>
        }
      />

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={12} className="isolate z-50">
          <Popover.Popup className="panel max-h-[min(82dvh,40rem)] w-[min(20rem,calc(100vw-1.5rem))] origin-(--transform-origin) overflow-y-auto p-4 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Popover.Title className="text-[13px] font-medium">
              Your music
              <span className="ml-2 text-[11px] font-normal text-muted-foreground/70">おんがく</span>
            </Popover.Title>

            <input
              ref={input}
              type="file"
              multiple
              accept="audio/*,.mp3,.m4a,.ogg,.opus,.wav,.flac"
              className="hidden"
              onChange={(event) => {
                void pick(event.target.files);
                event.target.value = "";
              }}
            />

            {tracks.length === 0 ? (
              <div className="mt-3 space-y-3">
                <p className="text-[12px] leading-5 text-muted-foreground">
                  Bring your own songs: pick music files from your computer
                  and they&apos;ll play in the room, from the radio on the desk
                  too. They stay in this browser; nothing is uploaded.
                </p>
                <button
                  type="button"
                  disabled={adding || !loaded}
                  onClick={() => input.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] text-primary-foreground transition-opacity disabled:opacity-50"
                >
                  <Plus className="size-3.5" strokeWidth={1.8} />
                  {adding ? "Adding…" : "Add music files"}
                </button>
              </div>
            ) : (
              <>
                {/* Now playing */}
                <p className="mt-3 truncate text-[13px] text-foreground/85" title={current?.name}>
                  {current?.name ?? "Nothing playing yet"}
                </p>
                {failedId && failedId === currentId && (
                  <p className="text-[11px] text-destructive">This browser can&apos;t play that file.</p>
                )}

                <div className="mt-2 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    aria-label="Shuffle"
                    aria-pressed={shuffle}
                    onClick={toggleShuffle}
                    className={cn(round, shuffle && "text-foreground")}
                  >
                    <Shuffle className="size-3.5" strokeWidth={shuffle ? 2.2 : 1.7} />
                  </button>
                  <button type="button" aria-label="Previous" onClick={previous} className={round}>
                    <SkipBack className="size-4" strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    aria-label={playing ? "Pause" : "Play"}
                    onClick={toggle}
                    className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"
                  >
                    {playing ? (
                      <Pause className="size-4" fill="currentColor" strokeWidth={1.8} />
                    ) : (
                      <Play className="size-4 translate-x-px" fill="currentColor" strokeWidth={1.8} />
                    )}
                  </button>
                  <button type="button" aria-label="Next" onClick={next} className={round}>
                    <SkipForward className="size-4" strokeWidth={1.7} />
                  </button>
                  <span className="size-8" />
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <Volume2 className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  <CalmRange label="Music volume" value={volume} onChange={setVolume} />
                </div>

                <ul className="mt-3 max-h-56 space-y-0.5 overflow-y-auto">
                  {tracks.map((track) => {
                    const active = track.id === currentId;

                    return (
                      <li key={track.id} className="group flex items-center gap-1 rounded-xl hover:bg-foreground/[0.04]">
                        <button
                          type="button"
                          onClick={() => void play(track.id)}
                          className={cn(
                            "min-w-0 flex-1 truncate px-2.5 py-1.5 text-left text-[12px]",
                            active ? "text-foreground" : "text-foreground/65"
                          )}
                        >
                          {active && (
                            <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full" style={{ backgroundColor: "var(--honey)" }} />
                          )}
                          {track.name}
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove "${track.name}"`}
                          onClick={() => void remove(track.id)}
                          className="mr-1 grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  disabled={adding}
                  onClick={() => input.current?.click()}
                  className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <Plus className="size-3.5" strokeWidth={1.8} />
                  {adding ? "Adding…" : "Add more"}
                </button>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
