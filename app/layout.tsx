import type { Metadata, Viewport } from "next";
import { Kiwi_Maru, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClarityAnalytics } from "@/components/analytics/clarity-analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next"
import { JsonLd } from "@/components/seo/json-ld";
import { createRootStructuredData, rootMetadata } from "@/lib/seo";
import { SCENE_BOOT_SCRIPT } from "@/lib/scene-time";
import { RoomScene } from "@/components/scene/room-scene";
import { SceneController } from "@/components/scene/scene-controller";
import { DialogueBox } from "@/components/shell/dialogue-box";
import { GazeExit } from "@/components/shell/gaze-exit";
import { NotesSheet } from "@/components/shell/notes-sheet";
import { ShortcutsHelp } from "@/components/shell/shortcuts-help";
import { AlarmWatcher } from "@/components/tools/alarms/alarm-watcher";
import { ToolTicker } from "@/components/tools/tool-ticker";

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen",
  display: "swap",
  // Japanese fonts ship hundreds of unicode-range slices; let the
  // browser fetch only the ones a page actually uses.
  preload: false,
});

const kiwi = Kiwi_Maru({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-kiwi",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,

  themeColor: [
    {
      media:
        "(prefers-color-scheme: light)",
      color: "#dde4e9",
    },
    {
      media:
        "(prefers-color-scheme: dark)",
      color: "#0e1626",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-tod="night"
      data-season="spring"
      data-weather="drizzle"
      className={cn("dark h-full", "antialiased", zenMaru.variable, kiwi.variable)}
    >
      <head>
        {/* Paint the right time of day, season and weather before React loads */}
        <script dangerouslySetInnerHTML={{ __html: SCENE_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <JsonLd
          id="chrona-structured-data"
          data={createRootStructuredData()}
        />

        <TooltipProvider delay={600}>
          <RoomScene />
          <SceneController />
          <AlarmWatcher />
          <ToolTicker />

          <div
            data-passthrough
            className="relative z-10 flex min-h-full flex-1 flex-col"
          >
            {children}
          </div>

          <DialogueBox />
          <GazeExit />
          <NotesSheet />
          <ShortcutsHelp />

          <VercelAnalytics/>
          <ClarityAnalytics/>
        </TooltipProvider>
      </body>
    </html>
  );
}
