import type { Metadata, Viewport } from "next";
import { Mochiy_Pop_One, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ClarityAnalytics } from "@/components/analytics/clarity-analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next"
import { JsonLd } from "@/components/seo/json-ld";
import { createRootStructuredData, rootMetadata } from "@/lib/seo";
import { RoomScene } from "@/components/scene/room-scene";
import { SceneController } from "@/components/scene/scene-controller";
import { DialogueBox } from "@/components/shell/dialogue-box";
import { GazeExit } from "@/components/shell/gaze-exit";
import { AlarmWatcher } from "@/components/tools/alarms/alarm-watcher";

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
      className={cn("h-full", "antialiased", zenMaru.variable, mochiy.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <JsonLd
          id="chrona-structured-data"
          data={createRootStructuredData()}
        />

        <TooltipProvider delay={600}>
          <ThemeProvider>
            <RoomScene />
            <SceneController />
            <AlarmWatcher />

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
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
