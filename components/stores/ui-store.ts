import { create } from "zustand";

import type { PomodoroMode } from "@/components/tools/pomodoro/use-pomodoro";

export type Tool =
  | "timer"
  | "stopwatch"
  | "pomodoro"
  | "world-clock"
  | "alarms";

type Lap = {
  id: number;
  split: number;
  total: number;
};

type UIState = {
  stopwatchLaps: Lap[];

  stopwatchActions?: {
    lap?: () => void;
    clearLaps?: () => void;
  };

  setStopwatchLaps: (laps: Lap[]) => void;

  setStopwatchActions: (
    actions: UIState["stopwatchActions"]
  ) => void;

  pomodoroState?: {
    mode: PomodoroMode;
    timeLeft: number;
    isRunning: boolean;
    cycle: number;
  };

  pomodoroActions?: {
    setMode?: (mode: PomodoroMode) => void;
    start?: () => void;
    pause?: () => void;
    reset?: () => void;
  };

  setPomodoroState: (state: UIState["pomodoroState"]) => void;

  setPomodoroActions: (
    actions: UIState["pomodoroActions"]
  ) => void;
};

export const useUIStore = create<UIState>((set) => ({
  stopwatchLaps: [],
  stopwatchActions: undefined,

  setStopwatchLaps: (laps) =>
    set({ stopwatchLaps: laps }),

  setStopwatchActions: (actions) =>
    set({ stopwatchActions: actions }),

  pomodoroState: {
    mode: "focus",
    timeLeft: 25 * 60,
    isRunning: false,
    cycle: 1,
  },

  pomodoroActions: undefined,

  setPomodoroState: (state) =>
    set({ pomodoroState: state }),

  setPomodoroActions: (actions) =>
    set({ pomodoroActions: actions }),
}));
