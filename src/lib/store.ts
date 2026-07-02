"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  UserProfile,
  WorkoutLog,
  YogaSession,
  BreathSession,
  BodyMetric,
  StreakState,
  ModuleKey,
  ProgramEnrollment,
  Dosha,
  WeeklyRoutine,
  JournalEntry,
  AccountLog,
} from "./types";

export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const todayISO = () => new Date().toISOString();
export const dayKey = (d: string | Date = new Date()) =>
  (typeof d === "string" ? new Date(d) : d).toISOString().slice(0, 10);

const isoDaysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const emptyStreak = (): StreakState => ({ current: 0, longest: 0, lastDate: null });

interface Prefs {
  sound: boolean;
  haptics: boolean;
}

interface AppState {
  hydrated: boolean;
  isAuthed: boolean;
  profile: UserProfile;
  workouts: WorkoutLog[];
  yoga: YogaSession[];
  breath: BreathSession[];
  body: BodyMetric[];
  streaks: Record<ModuleKey, StreakState>;
  enrollment: ProgramEnrollment | null;
  prefs: Prefs;
  draftExercises: string[];
  weeklyRoutines: WeeklyRoutine[];
  journalEntries: JournalEntry[];
  accountLogs: AccountLog[];

  // auth / onboarding
  login: (email: string, name?: string) => void;
  logout: () => void;
  setDosha: (scores: Record<Dosha, number>, primary: UserProfile["doshaPrimary"]) => void;
  setGoals: (goals: string[]) => void;
  setProfile: (partial: Partial<UserProfile>) => void;
  changePassword: (currentPassword: string, nextPassword: string) => { ok: boolean; message: string };
  completeOnboarding: () => void;
  setPrefs: (p: Partial<Prefs>) => void;
  upgradeToPro: () => void;

  // logging
  addWorkout: (w: WorkoutLog) => void;
  addYoga: (y: YogaSession) => void;
  addBreath: (b: BreathSession) => void;
  addBody: (m: BodyMetric) => void;

  // workout draft
  setDraft: (ids: string[]) => void;
  toggleDraft: (id: string) => void;
  clearDraft: () => void;

  // programs
  enroll: (programId: string) => void;
  completeProgramDay: (key: string) => void;
  leaveProgram: () => void;

  // routines
  saveWeeklyRoutine: (r: WeeklyRoutine) => void;
  deleteWeeklyRoutine: (id: string) => void;

  // journal
  addJournalEntry: (e: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;

  // sessions
  deleteYogaSession: (id: string) => void;
  deleteWorkout: (id: string) => void;

  seedDemo: () => void;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  doshaScores: { vata: 33, pitta: 33, kapha: 34 },
  doshaPrimary: null,
  goals: [],
  tier: "free",
  onboarded: false,
  heightUnit: "cm",
  weightUnit: "kg",
};

function logAccount(action: string, detail: string): AccountLog {
  return { id: uid(), date: todayISO(), action, detail };
}

function changedProfileFields(current: UserProfile, partial: Partial<UserProfile>) {
  const labels: Partial<Record<keyof UserProfile, string>> = {
    name: "name",
    email: "email",
    age: "age",
    gender: "gender",
    heightCm: "height",
    weightKg: "weight",
    heightUnit: "height unit",
    weightUnit: "weight unit",
  };
  return (Object.keys(partial) as (keyof UserProfile)[])
    .filter((key) => labels[key] && current[key] !== partial[key])
    .map((key) => labels[key]);
}

function bumpStreak(s: StreakState, date: string): StreakState {
  const key = dayKey(date);
  if (s.lastDate === key) return s;
  let current = 1;
  if (s.lastDate) {
    const diff =
      (new Date(key).getTime() - new Date(s.lastDate).getTime()) / 86400000;
    if (diff === 1) current = s.current + 1;
    else if (diff === 0) current = s.current;
  }
  return {
    current,
    longest: Math.max(s.longest, current),
    lastDate: key,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      isAuthed: false,
      profile: defaultProfile,
      workouts: [],
      yoga: [],
      breath: [],
      body: [],
      streaks: { move: emptyStreak(), yoga: emptyStreak(), breathe: emptyStreak() },
      enrollment: null,
      prefs: { sound: true, haptics: true },
      draftExercises: [],
      weeklyRoutines: [],
      journalEntries: [],
      accountLogs: [],

      setDraft: (ids) => set({ draftExercises: ids }),
      toggleDraft: (id) =>
        set((st) => ({
          draftExercises: st.draftExercises.includes(id)
            ? st.draftExercises.filter((x) => x !== id)
            : [...st.draftExercises, id],
        })),
      clearDraft: () => set({ draftExercises: [] }),

      login: (email, name) =>
        set((st) => ({
          isAuthed: true,
          profile: {
            ...st.profile,
            email,
            name: name || st.profile.name || email.split("@")[0],
          },
          accountLogs: st.isAuthed
            ? st.accountLogs
            : [logAccount("Signed in", `Signed in as ${email}`), ...st.accountLogs],
        })),

      logout: () =>
        set({
          isAuthed: false,
          profile: defaultProfile,
          workouts: [],
          yoga: [],
          breath: [],
          body: [],
          streaks: { move: emptyStreak(), yoga: emptyStreak(), breathe: emptyStreak() },
          enrollment: null,
          weeklyRoutines: [],
          journalEntries: [],
          accountLogs: [],
        }),

      setDosha: (scores, primary) =>
        set((st) => ({
          profile: { ...st.profile, doshaScores: scores, doshaPrimary: primary },
          accountLogs:
            st.profile.doshaPrimary === primary
              ? st.accountLogs
              : [logAccount("Ayurvedic profile updated", `Dosha profile set to ${primary || "tridoshic"}`), ...st.accountLogs],
        })),

      setGoals: (goals) =>
        set((st) => ({
          profile: { ...st.profile, goals },
          accountLogs:
            JSON.stringify(st.profile.goals) === JSON.stringify(goals)
              ? st.accountLogs
              : [logAccount("Goals updated", `${goals.length} goal${goals.length === 1 ? "" : "s"} selected`), ...st.accountLogs],
        })),

      setProfile: (partial) =>
        set((st) => {
          const fields = changedProfileFields(st.profile, partial);
          return {
            profile: { ...st.profile, ...partial },
            accountLogs:
              fields.length > 0
                ? [logAccount("Profile updated", `Changed ${fields.join(", ")}`), ...st.accountLogs]
                : st.accountLogs,
          };
        }),

      changePassword: (_currentPassword, nextPassword) => {
        if (nextPassword.trim().length < 8) {
          return { ok: false, message: "Password must be at least 8 characters." };
        }
        set((st) => ({
          profile: { ...st.profile, passwordUpdatedAt: todayISO() },
          accountLogs: [logAccount("Password changed", "Password was updated"), ...st.accountLogs],
        }));
        return { ok: true, message: "Password updated." };
      },

      completeOnboarding: () =>
        set((st) => ({ profile: { ...st.profile, onboarded: true } })),

      setPrefs: (p) => set((st) => ({ prefs: { ...st.prefs, ...p } })),

      upgradeToPro: () => set((st) => ({ profile: { ...st.profile, tier: "pro" } })),

      addWorkout: (w) =>
        set((st) => ({
          workouts: [w, ...st.workouts],
          streaks: { ...st.streaks, move: bumpStreak(st.streaks.move, w.date) },
        })),
      addYoga: (y) =>
        set((st) => ({
          yoga: [y, ...st.yoga],
          streaks: { ...st.streaks, yoga: bumpStreak(st.streaks.yoga, y.date) },
        })),
      addBreath: (b) =>
        set((st) => ({
          breath: [b, ...st.breath],
          streaks: b.completed
            ? { ...st.streaks, breathe: bumpStreak(st.streaks.breathe, b.date) }
            : st.streaks,
        })),
      addBody: (m) => set((st) => ({ body: [m, ...st.body] })),

      enroll: (programId) =>
        set({
          enrollment: {
            programId,
            startDate: todayISO(),
            currentWeek: 1,
            currentDay: 1,
            completedDays: [],
            status: "active",
          },
        }),
      completeProgramDay: (key) =>
        set((st) =>
          st.enrollment
            ? {
                enrollment: {
                  ...st.enrollment,
                  completedDays: st.enrollment.completedDays.includes(key)
                    ? st.enrollment.completedDays
                    : [...st.enrollment.completedDays, key],
                },
              }
            : {},
        ),
      leaveProgram: () => set({ enrollment: null }),

      saveWeeklyRoutine: (r) =>
        set((st) => {
          const existing = st.weeklyRoutines.findIndex((x) => x.id === r.id);
          if (existing >= 0) {
            const updated = [...st.weeklyRoutines];
            updated[existing] = { ...r, updatedAt: new Date().toISOString() };
            return { weeklyRoutines: updated };
          }
          return { weeklyRoutines: [r, ...st.weeklyRoutines] };
        }),

      deleteWeeklyRoutine: (id) =>
        set((st) => ({ weeklyRoutines: st.weeklyRoutines.filter((r) => r.id !== id) })),

      addJournalEntry: (e) =>
        set((st) => ({ journalEntries: [e, ...st.journalEntries] })),

      deleteJournalEntry: (id) =>
        set((st) => ({ journalEntries: st.journalEntries.filter((e) => e.id !== id) })),

      deleteYogaSession: (id) =>
        set((st) => ({ yoga: st.yoga.filter((y) => y.id !== id) })),

      deleteWorkout: (id) =>
        set((st) => ({ workouts: st.workouts.filter((w) => w.id !== id) })),

      seedDemo: () => {
        if (get().workouts.length > 0) return; // don't double-seed
        const workouts: WorkoutLog[] = [
          {
            id: uid(),
            date: isoDaysAgo(1),
            name: "Upper Body Power",
            durationMin: 52,
            rpe: 8,
            volume: 4820,
            exercises: [
              {
                exerciseId: "barbell-bench-press",
                name: "Barbell Bench Press",
                targetMuscles: "Chest, Shoulders, Triceps",
                sets: [
                  { reps: 10, weight: 60, done: true },
                  { reps: 8, weight: 62.5, done: true },
                  { reps: 8, weight: 62.5, done: true },
                ],
              },
              {
                exerciseId: "incline-dumbbell-row",
                name: "Incline Dumbbell Row",
                targetMuscles: "Back, Biceps",
                sets: [
                  { reps: 12, weight: 22, done: true },
                  { reps: 10, weight: 24, done: true },
                ],
              },
            ],
          },
          {
            id: uid(),
            date: isoDaysAgo(3),
            name: "Lower Body",
            durationMin: 48,
            rpe: 7,
            volume: 6100,
            exercises: [
              {
                exerciseId: "back-squat",
                name: "Barbell Back Squat",
                targetMuscles: "Quads, Glutes",
                sets: [
                  { reps: 8, weight: 80, done: true },
                  { reps: 8, weight: 82.5, done: true },
                ],
              },
            ],
          },
          {
            id: uid(),
            date: isoDaysAgo(5),
            name: "Full Body",
            durationMin: 45,
            rpe: 7,
            volume: 3900,
            exercises: [
              {
                exerciseId: "deadlift",
                name: "Conventional Deadlift",
                targetMuscles: "Hamstrings, Glutes, Back",
                sets: [{ reps: 5, weight: 100, done: true }],
              },
            ],
          },
        ];
        const yoga: YogaSession[] = [
          { id: uid(), date: isoDaysAgo(1), flowId: "morning-energizer", flowName: "Morning Energizer", type: "flow", durationMin: 15, posesCount: 8 },
          { id: uid(), date: isoDaysAgo(2), flowName: "Surya Namaskar", type: "surya_namaskar", durationMin: 12, posesCount: 12, suryaRounds: 12 },
          { id: uid(), date: isoDaysAgo(4), flowId: "vata-grounding", flowName: "Vata Grounding", type: "flow", durationMin: 30, posesCount: 11 },
        ];
        const body: BodyMetric[] = [
          { id: uid(), date: isoDaysAgo(7), weight: 74.2 },
          { id: uid(), date: isoDaysAgo(3), weight: 73.8 },
          { id: uid(), date: isoDaysAgo(0), weight: 73.6 },
        ];
        set({
          workouts,
          yoga,
          body,
          streaks: {
            move: { current: 3, longest: 6, lastDate: dayKey(isoDaysAgo(1)) },
            yoga: { current: 2, longest: 9, lastDate: dayKey(isoDaysAgo(1)) },
            breathe: { current: 0, longest: 0, lastDate: null },
          },
        });
      },
    }),
    {
      name: "tapas-store-v2",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
