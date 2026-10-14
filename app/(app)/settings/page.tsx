import type { Metadata } from "next";

import { SettingsPanel } from "@/components/tools/settings/settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Choose sounds, the time of day, season and weather in your Chrona room.",
  alternates: {
    canonical: "/settings",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SettingsPage() {
  return <SettingsPanel />;
}
