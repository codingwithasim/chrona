import type { Metadata, Viewport } from "next";
import { Mochiy_Pop_One, Zen_Maru_Gothic } from "next/font/google";
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
import { AlarmWatcher } from "@/components/tools/alarms/alarm-watcher";
import { ToolTicker } from "@/components/tools/tool-ticker";

const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-zen",
  display: "swap",
});

const mochiy = Mochiy_Pop_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mochiy",
  display: "swap",
});

export const metadata: Metadata = rootMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,

  themeColor: [
    {
      media:
        "(prefers-color-scheme: light)",
      color: "#ece3dc",
    },
    {
      media:
        "(prefers-color-scheme: dark)",
      color: "#15122b",
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
      className={cn("dark h-full", "antialiased", zenMaru.variable, mochiy.variable)}
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

          <VercelAnalytics/>
          <ClarityAnalytics/>
        </TooltipProvider>
      </body>
    </html>
  );
}
