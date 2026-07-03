import type { DayOfWeek } from "../types";

export type PresetItem =
  | { type: "exercise"; name: string; sets?: number; reps?: number; restTimer?: number }
  | { type: "asana"; id: string; duration?: number }
  | { type: "pranayama"; id: string; duration?: number };

export interface RoutinePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  days: DayOfWeek[];
  items: PresetItem[];
  accent: string;
}

export const ROUTINE_PRESETS: RoutinePreset[] = [
  {
    id: "home-strength",
    name: "Home Strength",
    category: "Home",
    description: "No-machine strength staples for a simple home routine.",
    days: [0, 2, 4],
    accent: "#73fd9c",
    items: [
      { type: "exercise", name: "push up", sets: 3, reps: 10, restTimer: 45 },
      { type: "exercise", name: "squat", sets: 3, reps: 12, restTimer: 45 },
      { type: "exercise", name: "plank", sets: 3, reps: 30, restTimer: 30 },
    ],
  },
  {
    id: "travel-reset",
    name: "Travel Reset",
    category: "Travel",
    description: "Compact mobility and breathwork for hotel rooms or busy days.",
    days: [0, 1, 2, 3, 4, 5, 6],
    accent: "var(--color-breathe)",
    items: [
      { type: "asana", id: "uttanasana", duration: 40 },
      { type: "asana", id: "paschimottanasana", duration: 60 },
      { type: "asana", id: "balasana", duration: 60 },
      { type: "pranayama", id: "nadi-shodhana", duration: 180 },
    ],
  },
  {
    id: "morning-energy",
    name: "Morning Energy",
    category: "Morning",
    description: "Wake the body with strength, standing poses, and energizing breath.",
    days: [0, 1, 2, 3, 4],
    accent: "#fdb974",
    items: [
      { type: "exercise", name: "jumping jack", sets: 2, reps: 30, restTimer: 30 },
      { type: "asana", id: "utkatasana", duration: 40 },
      { type: "asana", id: "virabhadrasana-2", duration: 40 },
      { type: "pranayama", id: "bhastrika", duration: 120 },
    ],
  },
  {
    id: "evening-calm",
    name: "Evening Calm",
    category: "Sleep",
    description: "Slow poses and calming pranayam before bed.",
    days: [0, 1, 2, 3, 4, 5, 6],
    accent: "#bda8ff",
    items: [
      { type: "asana", id: "balasana", duration: 90 },
      { type: "asana", id: "paschimottanasana", duration: 90 },
      { type: "asana", id: "savasana", duration: 180 },
      { type: "pranayama", id: "bhramari", duration: 180 },
    ],
  },
  {
    id: "desk-reset",
    name: "Desk Reset",
    category: "Office",
    description: "Short reset for stiffness from sitting.",
    days: [0, 1, 2, 3, 4],
    accent: "#2ee5b5",
    items: [
      { type: "exercise", name: "neck side stretch", sets: 2, reps: 8, restTimer: 15 },
      { type: "asana", id: "uttanasana", duration: 45 },
      { type: "asana", id: "ardha-matsyendrasana", duration: 40 },
      { type: "pranayama", id: "ujjayi", duration: 120 },
    ],
  },
  {
    id: "breath-foundation",
    name: "Breath Foundation",
    category: "Breathing",
    description: "A gentle pranayam-only routine for daily consistency.",
    days: [0, 1, 2, 3, 4, 5, 6],
    accent: "var(--color-breathe)",
    items: [
      { type: "pranayama", id: "nadi-shodhana", duration: 240 },
      { type: "pranayama", id: "bhramari", duration: 180 },
      { type: "pranayama", id: "sitali", duration: 120 },
    ],
  },
  {
    id: "balanced-week",
    name: "Balanced Week",
    category: "Popular",
    description: "A balanced mix of training, poses, and breathwork.",
    days: [0, 2, 4, 5],
    accent: "#73fd9c",
    items: [
      { type: "exercise", name: "push up", sets: 3, reps: 8, restTimer: 45 },
      { type: "exercise", name: "lunge", sets: 3, reps: 10, restTimer: 45 },
      { type: "asana", id: "trikonasana", duration: 40 },
      { type: "asana", id: "setu-bandha", duration: 45 },
      { type: "pranayama", id: "nadi-shodhana", duration: 180 },
    ],
  },
];
