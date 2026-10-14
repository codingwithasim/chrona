"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { type FocusTask, MAX_ESTIMATE, useFocusStore } from "@/stores/focus-store";

/** Pomodoros taken (filled) against the guess (hollow). Click to change the guess. */
function Tally({ task, onEstimate }: { task: FocusTask; onEstimate: (estimate: number) => void }) {
  const estimate = task.estimate ?? 0;
  const dots = Math.min(Math.max(task.pomodoros, estimate), 6);
  const extra = Math.max(task.pomodoros, estimate) - dots;

  return (
    <button
      type="button"
      disabled={task.done}
      onClick={() => onEstimate(estimate >= MAX_ESTIMATE ? 0 : estimate + 1)}
      title={estimate ? `${task.pomodoros} of ${estimate} pomodoros · click to change the guess` : "How many pomodoros will it take?"}
      aria-label={`${task.pomodoros} pomodoros done${estimate ? ` of ${estimate}` : ""}. Change the estimate`}
      className="flex h-6 shrink-0 items-center gap-0.5 rounded-full px-1.5 hover:bg-foreground/5 disabled:pointer-events-none"
    >
      {dots === 0 ? (
        <span className="text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">est.</span>
      ) : (
        Array.from({ length: dots }, (_, index) => (
          <span
            key={index}
            className="size-1.5 rounded-full border"
            style={
              index < task.pomodoros
                ? { backgroundColor: "var(--ember)", borderColor: "var(--ember)" }
                : { borderColor: "color-mix(in oklab, var(--foreground) 30%, transparent)" }
            }
          />
        ))
      )}
      {extra > 0 && <span className="text-[10px] text-muted-foreground">+{extra}</span>}
    </button>
  );
}

/** "Working on …", with a little list of today's tasks behind it. */
export function CurrentTask() {
  const tasks = useFocusStore((state) => state.tasks);
  const currentId = useFocusStore((state) => state.currentId);
  const addTask = useFocusStore((state) => state.addTask);
  const toggleTask = useFocusStore((state) => state.toggleTask);
  const removeTask = useFocusStore((state) => state.removeTask);
  const setCurrent = useFocusStore((state) => state.setCurrent);
  const clearDone = useFocusStore((state) => state.clearDone);
  const setEstimate = useFocusStore((state) => state.setEstimate);

  const [draft, setDraft] = useState("");
  const [estimate, setDraftEstimate] = useState(1);

  const current = tasks.find((task) => task.id === currentId && !task.done);
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  return (
    <Popover.Root>
      <Popover.Trigger
        className="max-w-full truncate rounded-full px-3 py-1 text-[12px] text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
      >
        {current ? (
          <>
            <span className="text-muted-foreground/70">working on · </span>
            <span className="text-foreground/80">{current.text}</span>
            {(current.estimate ?? 0) > 0 && (
              <span className="text-muted-foreground/70"> · {current.pomodoros}/{current.estimate}</span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <Plus className="size-3" strokeWidth={1.8} />
            What are you working on?
          </span>
        )}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" sideOffset={8} collisionPadding={12} className="isolate z-50">
          <Popover.Popup className="panel w-[min(20rem,calc(100vw-1.5rem))] origin-(--transform-origin) p-3 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Popover.Title className="px-1 pb-2 text-[11px] tracking-[0.25em] text-muted-foreground/80 lowercase">
              today&apos;s tasks
            </Popover.Title>

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addTask(draft, estimate);
                setDraft("");
                setDraftEstimate(1);
              }}
            >
              <input
                autoFocus
                value={draft}
                maxLength={80}
                placeholder="Add a task"
                onChange={(event) => setDraft(event.target.value)}
                className="h-9 min-w-0 flex-1 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3.5 text-[13px] outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25"
              />
              <button
                type="button"
                onClick={() => setDraftEstimate((value) => (value >= MAX_ESTIMATE ? 0 : value + 1))}
                title="How many pomodoros it should take (click to change)"
                aria-label={estimate ? `Estimate: ${estimate} pomodoros. Change` : "No estimate. Change"}
                className="flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] tabular-nums text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: estimate ? "var(--ember)" : "color-mix(in oklab, var(--foreground) 25%, transparent)" }} />
                {estimate ? `×${estimate}` : "–"}
              </button>
              <button
                type="submit"
                aria-label="Add task"
                disabled={!draft.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
              >
                <Plus className="size-4" strokeWidth={1.8} />
              </button>
            </form>

            {tasks.length === 0 ? (
              <p className="px-1 pt-3 text-[12px] leading-5 text-muted-foreground/80">
                Add what you&apos;re focusing on, and roughly how many
                pomodoros it should take. Each finished one fills a dot.
              </p>
            ) : (
              <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
                {[...open, ...done].map((task) => {
                  const active = task.id === currentId && !task.done;

                  return (
                    <li key={task.id} className="group flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-foreground/[0.04]">
                      <button
                        type="button"
                        aria-label={task.done ? `Mark "${task.text}" as not done` : `Mark "${task.text}" as done`}
                        onClick={() => toggleTask(task.id)}
                        className={cn(
                          "grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors",
                          task.done ? "border-transparent bg-foreground/15" : "border-foreground/25 hover:border-foreground/50"
                        )}
                      >
                        {task.done && <Check className="size-3" strokeWidth={2.2} />}
                      </button>

                      <button
                        type="button"
                        disabled={task.done}
                        onClick={() => setCurrent(task.id)}
                        title={task.done ? undefined : "Work on this"}
                        className={cn(
                          "min-w-0 flex-1 truncate text-left text-[13px]",
                          task.done ? "text-muted-foreground/60 line-through" : active ? "text-foreground" : "text-foreground/70"
                        )}
                      >
                        {active && (
                          <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 -translate-y-px rounded-full" style={{ backgroundColor: "var(--honey)" }} />
                        )}
                        {task.text}
                      </button>

                      <Tally task={task} onEstimate={(value) => setEstimate(task.id, value)} />

                      <button
                        type="button"
                        aria-label={`Delete "${task.text}"`}
                        onClick={() => removeTask(task.id)}
                        className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {done.length > 0 && (
              <button
                type="button"
                onClick={clearDone}
                className="mt-2 px-1.5 text-[11px] text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear finished
              </button>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
