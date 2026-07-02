import type {
  WorkoutLog,
  YogaSession,
  BreathSession,
  StreakState,
  ModuleKey,
} from "./types";

const DAY = 86400000;

export function daysAgo(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  return Math.floor((Date.now() - d) / DAY);
}

export function withinDays(dateStr: string, n: number): boolean {
  return daysAgo(dateStr) < n;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export interface Scores {
  pulse: number;
  move: number;
  yoga: number;
  breathe: number;
  recovery: number;
}

export function computeScores(
  workouts: WorkoutLog[],
  yoga: YogaSession[],
  breath: BreathSession[],
  streaks: Record<ModuleKey, StreakState>,
): Scores {
  // ---- Move (weekly target 3) ----
  const wWeek = workouts.filter((w) => withinDays(w.date, 7));
  const activeDays = new Set(wWeek.map((w) => w.date.slice(0, 10))).size;
  const muscles = new Set<string>();
  wWeek.forEach((w) => w.exercises.forEach((e) => muscles.add(e.targetMuscles)));
  const moveScore = clamp(
    Math.min(wWeek.length / 3, 1) * 40 +
      Math.min(activeDays / 7, 1) * 30 +
      Math.min(streaks.move.current / 7, 1) * 15 +
      Math.min(muscles.size / 6, 1) * 15,
  );

  // ---- Yoga (weekly target 3) ----
  const yWeek = yoga.filter((y) => withinDays(y.date, 7));
  const flowTypes = new Set(yWeek.map((y) => y.type)).size;
  const yogaScore = clamp(
    Math.min(yWeek.length / 3, 1) * 40 +
      Math.min(flowTypes / 3, 1) * 20 +
      (yWeek.length > 0 ? 20 : 0) +
      Math.min(streaks.yoga.current / 7, 1) * 20,
  );

  // ---- Breathe (weekly target 4) ----
  const bWeek = breath.filter((b) => withinDays(b.date, 7) && b.completed);
  const techniques = new Set(bWeek.map((b) => b.techniqueId)).size;
  const moodDeltas = bWeek
    .filter((b) => b.preMood != null && b.postMood != null)
    .map((b) => (b.postMood! - b.preMood!) / 4);
  const avgMood =
    moodDeltas.length > 0
      ? moodDeltas.reduce((a, c) => a + c, 0) / moodDeltas.length
      : 0.5;
  const breatheScore = clamp(
    Math.min(bWeek.length / 4, 1) * 50 +
      Math.min(techniques / 4, 1) * 25 +
      clamp(avgMood, 0, 1) * 25,
  );

  // ---- Recovery (Removed) ----
  const recoveryScore = 0;

  const pulse = Math.round(
    moveScore * 0.4 + yogaScore * 0.3 + breatheScore * 0.3,
  );

  return {
    pulse,
    move: Math.round(moveScore),
    yoga: Math.round(yogaScore),
    breathe: Math.round(breatheScore),
    recovery: Math.round(recoveryScore),
  };
}



export function pulseColor(score: number): string {
  if (score >= 86) return "#2ee5b5";
  if (score >= 71) return "#73fd9c";
  if (score >= 51) return "#a8e35a";
  if (score >= 31) return "#f5ad0b";
  return "#ffb3b3";
}

export function pulseVerdict(score: number): string {
  if (score >= 86) return "Thriving";
  if (score >= 71) return "Your rhythm is steady";
  if (score >= 51) return "Finding your groove";
  if (score >= 31) return "Getting started";
  return "Let's build momentum";
}

// Rolling 7-value sparkline for a module from logged data
export function sparkline(dates: string[]): number[] {
  const buckets = new Array(7).fill(0);
  dates.forEach((d) => {
    const ago = daysAgo(d);
    if (ago >= 0 && ago < 7) buckets[6 - ago] += 1;
  });
  return buckets;
}
