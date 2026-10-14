import {
  AlarmClock,
  Globe2,
  Hourglass,
  type LucideIcon,
  Mail,
  Timer,
  TimerReset,
} from "lucide-react";

export type NavItem = {
  title: string;
  /** Japanese label shown alongside the English title. */
  jp: string;
  href: string;
  icon: LucideIcon;
  /** Accent color token for the tool. */
  color: string;
  description: string;
  /** What Mochi says when you open the tool. */
  line: string;
};

export const navigation: NavItem[] = [
  {
    title: "Timer",
    jp: "タイマー",
    href: "/timer",
    icon: Hourglass,
    color: "var(--sakura)",
    description: "Count down for study, tea, or a power nap.",
    line: "Set a timer and let the rain keep you company.",
  },
  {
    title: "Stopwatch",
    jp: "ストップウォッチ",
    href: "/stopwatch",
    icon: TimerReset,
    color: "var(--sky)",
    description: "Measure elapsed time, lap by lap.",
    line: "Ready when you are. I'll keep count… probably.",
  },
  {
    title: "Pomodoro",
    jp: "ポモドーロ",
    href: "/pomodoro",
    icon: Timer,
    color: "var(--honey)",
    description: "Focus sessions with gentle breaks in between.",
    line: "Twenty-five minutes of focus, then we nap. Deal?",
  },
  {
    title: "World Clock",
    jp: "世界時計",
    href: "/world-clock",
    icon: Globe2,
    color: "var(--mint)",
    description: "See what time it is in cities you care about.",
    line: "Somewhere out there it isn't raining. Let's check.",
  },
  {
    title: "Alarms",
    jp: "アラーム",
    href: "/alarms",
    icon: AlarmClock,
    color: "var(--lavender)",
    description: "Alarms that ring while the room is open.",
    line: "I'll wake you up. Just leave this tab open, nya.",
  },
  {
    title: "Feedback",
    jp: "おたより",
    href: "/feedback",
    icon: Mail,
    color: "var(--sakura)",
    description: "Write us a letter with ideas or bugs.",
    line: "Write us a letter! We read every single one.",
  },
];

export function getNavItem(pathname: string) {
  return navigation.find((item) => item.href === pathname);
}
