"use client";

import { createContext, useContext } from "react";

import { cn } from "@/lib/utils";
import { type PanelStyle, panelStyles, useSettingsStore } from "@/stores/settings-store";

/** The style the current tool is drawn in (set by ToolFrame). */
export const PanelStyleContext = createContext<PanelStyle>("card");

export function usePanelStyle() {
  return useContext(PanelStyleContext);
}

/** Small drawings of each style, for the picker. */
function Thumb({ style }: { style: PanelStyle }) {
  return (
    <svg viewBox="0 0 48 30" className="h-7 w-11" aria-hidden="true">
      <rect x="0.5" y="0.5" width="47" height="29" rx="5" fill="currentColor" opacity="0.06" stroke="currentColor" strokeOpacity="0.15" />
      {style === "float" && (
        <>
          <circle cx="33" cy="13" r="7" fill="none" stroke="currentColor" strokeOpacity="0.5" />
          <rect x="29" y="12" width="8" height="2" rx="1" fill="currentColor" opacity="0.7" />
        </>
      )}
      {style === "card" && (
        <>
          <rect x="25" y="4" width="17" height="22" rx="3" fill="currentColor" opacity="0.18" />
          <rect x="29" y="12" width="9" height="2" rx="1" fill="currentColor" opacity="0.7" />
        </>
      )}
      {style === "memo" && (
        <g transform="rotate(-4 33 15)">
          <rect x="25" y="5" width="16" height="20" rx="1" fill="#f3ead7" />
          <rect x="30" y="3.5" width="6" height="3" fill="currentColor" opacity="0.25" />
          <rect x="28" y="12" width="9" height="2" rx="1" fill="#4a4550" opacity="0.8" />
        </g>
      )}
      {style === "bar" && (
        <>
          <rect x="10" y="21" width="28" height="5" rx="2.5" fill="currentColor" opacity="0.2" />
          <rect x="13" y="23" width="8" height="1.4" rx="0.7" fill="currentColor" opacity="0.7" />
        </>
      )}
      {style === "corner" && (
        <>
          <rect x="31" y="18" width="13" height="8" rx="2" fill="currentColor" opacity="0.2" />
          <rect x="33" y="21.5" width="6" height="1.4" rx="0.7" fill="currentColor" opacity="0.7" />
        </>
      )}
    </svg>
  );
}

export function PanelStylePicker({ className }: { className?: string }) {
  const panelStyle = useSettingsStore((state) => state.panelStyle);
  const setPanelStyle = useSettingsStore((state) => state.setPanelStyle);

  return (
    <div role="radiogroup" aria-label="Panel style" className={cn("grid grid-cols-3 gap-2 sm:grid-cols-5", className)}>
      {panelStyles.map((style) => {
        const selected = style.id === panelStyle;

        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={selected}
            title={style.description}
            onClick={() => setPanelStyle(style.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-[11px] transition-colors duration-300",
              selected
                ? "bg-foreground/[0.08] text-foreground"
                : "text-muted-foreground/80 hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <Thumb style={style.id} />
            {style.label}
          </button>
        );
      })}
    </div>
  );
}
