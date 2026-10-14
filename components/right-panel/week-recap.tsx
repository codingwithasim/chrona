"use client";

import { useEffect, useState } from "react";
import { Download, Image as ImageIcon, Share2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { todayKey } from "@/lib/day-key";
import { drawRecap } from "@/lib/recap-card";
import { recentDays, streakOf, useFocusStore } from "@/stores/focus-store";
import { useRoomStore } from "@/stores/room-store";

const pill =
  "flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3.5 py-1.5 text-[12px] text-foreground/80 transition-colors duration-300 hover:bg-foreground/[0.07] hover:text-foreground";

/** "My week" as a picture you can keep or share. */
export function WeekRecap() {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const now = new Date();
    const { days } = useFocusStore.getState();

    void drawRecap({
      week: recentDays(days, 7, now),
      streak: streakOf(days, now),
      catName: useRoomStore.getState().catName.trim() || "Mochi",
    }).then((blob) => {
      if (!cancelled) {
        setCard({ blob, url: URL.createObjectURL(blob) });
      }
    });

    return () => {
      cancelled = true;
      setCard((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }
        return null;
      });
    };
  }, [open]);

  const file = card ? new File([card.blob], `chrona-week-${todayKey()}.png`, { type: "image/png" }) : null;
  const canShare = file !== null && typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] });

  function save() {
    if (!card || !file) {
      return;
    }

    const link = document.createElement("a");
    link.href = card.url;
    link.download = file.name;
    link.click();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={pill}>
        <ImageIcon className="size-3.5" strokeWidth={1.7} />
        Your week as a picture
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-baseline gap-2 text-[15px] font-medium">
              Your week
              <span className="text-[11px] font-normal text-muted-foreground/70">いっしゅうかん</span>
            </DialogTitle>
          </DialogHeader>

          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-foreground/[0.04]">
            {card && (
              // A generated blob: next/image can't optimise it, and needn't.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.url} alt="Your focus this week" className="size-full object-cover" />
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {canShare && (
              <button
                type="button"
                onClick={() => void navigator.share({ files: [file!], title: "My week in Chrona" }).catch(() => {})}
                className={pill}
              >
                <Share2 className="size-3.5" strokeWidth={1.7} />
                Share
              </button>
            )}
            <button type="button" onClick={save} disabled={!card} className={pill}>
              <Download className="size-3.5" strokeWidth={1.7} />
              Save image
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
