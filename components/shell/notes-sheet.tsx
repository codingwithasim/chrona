"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNotesStore } from "@/stores/notes-store";

/** Quick notes, pinned to the corkboard. */
export function NotesSheet() {
  const open = useNotesStore((state) => state.open);
  const setOpen = useNotesStore((state) => state.setOpen);
  const text = useNotesStore((state) => state.text);
  const setText = useNotesStore((state) => state.setText);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[min(26rem,94vw)] gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-foreground/[0.06] px-5 py-4 text-left">
          <SheetTitle className="flex items-baseline gap-2 text-[15px] font-medium">
            Notes
            <span className="text-[11px] font-normal text-muted-foreground/70">メモ</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Thoughts, ideas, a list for later… saved as you type."
            className="min-h-0 flex-1 resize-none rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3.5 text-[14px] leading-7 outline-none placeholder:text-muted-foreground/60 focus:border-foreground/25"
          />
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/70">
            <span>
              {words} {words === 1 ? "word" : "words"} · saved in this browser
            </span>
            {text && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Clear all notes?")) {
                    setText("");
                  }
                }}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
