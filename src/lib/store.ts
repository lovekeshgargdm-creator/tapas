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
  RoutineSessionDraft,
  JournalEntry,
  AccountLog,
  FastingSession,
  FastingProtocol,
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

export interface AppState {
  hydrated: boolean;
  isAuthed: boolean;
  profile: UserProfile;
  workouts: WorkoutLog[];
  yoga: YogaSession[];
  breath: BreathSession[];
  body: BodyMetric[];
  fasting: FastingSession[];
  streaks: Record<ModuleKey, StreakState>;
  enrollment: ProgramEnrollment | null;
  prefs: Prefs;
  draftExercises: string[];
  draftRoutine: RoutineSessionDraft | null;
  weeklyRoutines: WeeklyRoutine[];
  journalEntries: JournalEntry[];
  accountLogs: AccountLog[];

  // auth / onboarding
  replaceStoredData: (data: Partial<StoredAppData>, email: string, name?: string) => void;
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
  updateBody: (id: string, patch: Partial<BodyMetric>) => void;
  deleteBody: (id: string) => void;

  // workout draft
  setDraft: (ids: string[]) => void;
  setRoutineDraft: (draft: RoutineSessionDraft) => void;
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

  // fasting
  startFast: (protocol: FastingProtocol, targetHours: number) => void;
  endFast: (id: string, notes?: string) => void;
  deleteFast: (id: string) => void;

  seedDemo: () => void;
}

export type StoredAppData = Pick<
  AppState,
  | "profile"
  | "workouts"
  | "yoga"
  | "breath"
  | "body"
  | "fasting"
  | "streaks"
  | "enrollment"
  | "prefs"
  | "draftExercises"
  | "draftRoutine"
  | "weeklyRoutines"
  | "journalEntries"
  | "accountLogs"
>;

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

const baseStoredData = (): StoredAppData => ({
  profile: { ...defaultProfile },
  workouts: [],
  yoga: [],
  breath: [],
  body: [],
  fasting: [],
  streaks: { move: emptyStreak(), yoga: emptyStreak(), breathe: emptyStreak() },
  enrollment: null,
  prefs: { sound: true, haptics: true },
  draftExercises: [],
  draftRoutine: null,
  weeklyRoutines: [],
  journalEntries: [],
  accountLogs: [],
});

export function selectStoredAppData(state: AppState): StoredAppData {
  return {
    profile: state.profile,
    workouts: state.workouts,
    yoga: state.yoga,
    breath: state.breath,
    body: state.body,
    fasting: state.fasting,
    streaks: state.streaks,
    enrollment: state.enrollment,
    prefs: state.prefs,
    draftExercises: state.draftExercises,
    draftRoutine: state.draftRoutine,
    weeklyRoutines: state.weeklyRoutines,
    journalEntries: state.journalEntries,
    accountLogs: state.accountLogs,
  };
}

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
      fasting: [],
      streaks: { move: emptyStreak(), yoga: emptyStreak(), breathe: emptyStreak() },
      enrollment: null,
      prefs: { sound: true, haptics: true },
      draftExercises: [],
      draftRoutine: null,
      weeklyRoutines: [],
      journalEntries: [],
      accountLogs: [],

      setDraft: (ids) => set({ draftExercises: ids, draftRoutine: null }),
      setRoutineDraft: (draft) => set({ draftRoutine: draft, draftExercises: [] }),
      toggleDraft: (id) =>
        set((st) => ({
          draftRoutine: null,
          draftExercises: st.draftExercises.includes(id)
            ? st.draftExercises.filter((x) => x !== id)
            : [...st.draftExercises, id],
        })),
      clearDraft: () => set({ draftExercises: [], draftRoutine: null }),

      replaceStoredData: (data, email, name) => {
        const base = baseStoredData();
        const nextProfile = {
          ...base.profile,
          ...data.profile,
          email,
          name: data.profile?.name || name || email.split("@")[0],
        };
        set({
          ...base,
          ...data,
          hydrated: true,
          isAuthed: true,
          profile: nextProfile,
          streaks: { ...base.streaks, ...data.streaks },
          prefs: { ...base.prefs, ...data.prefs },
          draftExercises: data.draftExercises ?? [],
          draftRoutine: data.draftRoutine ?? null,
          enrollment: data.enrollment ?? null,
        });
      },

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
          fasting: [],
          streaks: { move: emptyStreak(), yoga: emptyStreak(), breathe: emptyStreak() },
          enrollment: null,
          draftExercises: [],
          draftRoutine: null,
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
      updateBody: (id, patch) =>
        set((st) => ({
          body: st.body.map((entry) =>
            entry.id === id ? { ...entry, ...patch, id: entry.id } : entry,
          ),
        })),
      deleteBody: (id) =>
        set((st) => ({ body: st.body.filter((entry) => entry.id !== id) })),

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

      startFast: (protocol, targetHours) => {
        const now = todayISO();
        set((st) => ({
          fasting: [
            {
              id: uid(),
              date: now,
              protocol,
              targetHours,
              startedAt: now,
              completed: false,
            },
            ...(st.fasting || []),
          ],
        }));
      },

      endFast: (id, notes) =>
        set((st) => ({
          fasting: (st.fasting || []).map((f) => {
            if (f.id !== id) return f;
            const endedAt = todayISO();
            const actualHours =
              (new Date(endedAt).getTime() - new Date(f.startedAt).getTime()) /
              3600000;
            return {
              ...f,
              endedAt,
              actualHours: Math.round(actualHours * 100) / 100,
              completed: actualHours >= f.targetHours,
              notes: notes || f.notes,
            };
          }),
        })),

      deleteFast: (id) =>
        set((st) => ({ fasting: (st.fasting || []).filter((f) => f.id !== id) })),

      seedDemo: () => {
        const current = get();
        if (current.workouts.length >= 10 && current.body.length >= 8) return;

        const workoutTemplates: Omit<WorkoutLog, "id" | "date">[] = [
          {
            name: "Upper Body Power",
            durationMin: 52,
            rpe: 8,
            volume: 4820,
            exercises: [
              {
                exerciseId: "barbell-bench-press",
                name: "Barbell Bench Press",
                targetMuscles: "Chest, Shoulders, Triceps",
                equipment: "barbell, bench",
                usesWeight: true,
                sets: [
                  { reps: 10, weight: 60, done: true },
                  { reps: 8, weight: 62.5, done: true },
                  { reps: 8, weight: 65, done: true },
                ],
              },
              {
                exerciseId: "incline-dumbbell-row",
                name: "Incline Dumbbell Row",
                targetMuscles: "Back, Biceps",
                equipment: "dumbbell, bench",
                usesWeight: true,
                sets: [
                  { reps: 12, weight: 22, done: true },
                  { reps: 10, weight: 24, done: true },
                ],
              },
            ],
          },
          {
            name: "Lower Body Strength",
            durationMin: 48,
            rpe: 7,
            volume: 6100,
            exercises: [
              {
                exerciseId: "back-squat",
                name: "Barbell Back Squat",
                targetMuscles: "Quads, Glutes",
                equipment: "barbell",
                usesWeight: true,
                sets: [
                  { reps: 8, weight: 80, done: true },
                  { reps: 8, weight: 82.5, done: true },
                  { reps: 6, weight: 85, done: true },
                ],
              },
              {
                exerciseId: "walking-lunge",
                name: "Walking Lunge",
                targetMuscles: "Quads, Glutes",
                equipment: "dumbbell",
                usesWeight: true,
                sets: [{ reps: 12, weight: 16, done: true }],
              },
            ],
          },
          {
            name: "Home Bodyweight",
            durationMin: 36,
            rpe: 6,
            volume: 1800,
            exercises: [
              {
                exerciseId: "push-up",
                name: "Push Up",
                targetMuscles: "Chest, Triceps",
                equipment: "bodyweight",
                usesWeight: false,
                sets: [
                  { reps: 18, done: true },
                  { reps: 16, done: true },
                  { reps: 14, done: true },
                ],
              },
              {
                exerciseId: "bodyweight-squat",
                name: "Bodyweight Squat",
                targetMuscles: "Quads, Glutes",
                equipment: "bodyweight",
                usesWeight: false,
                sets: [{ reps: 25, done: true }],
              },
            ],
          },
          {
            name: "Pull & Core",
            durationMin: 44,
            rpe: 7,
            volume: 3900,
            exercises: [
              {
                exerciseId: "pull-up",
                name: "Pull Up",
                targetMuscles: "Back, Biceps",
                equipment: "pull up bar",
                usesWeight: false,
                sets: [
                  { reps: 8, done: true },
                  { reps: 7, done: true },
                  { reps: 6, done: true },
                ],
              },
              {
                exerciseId: "kettlebell-swing",
                name: "Kettlebell Swing",
                targetMuscles: "Glutes, Hamstrings",
                equipment: "kettlebell",
                usesWeight: true,
                sets: [
                  { reps: 15, weight: 20, done: true },
                  { reps: 15, weight: 20, done: true },
                ],
              },
            ],
          },
        ];
        const workoutDays = [1, 3, 5, 8, 10, 12, 15, 17, 20, 22, 24, 27];
        const workouts: WorkoutLog[] = workoutDays.map((daysAgo, index) => ({
          ...workoutTemplates[index % workoutTemplates.length],
          id: uid(),
          date: isoDaysAgo(daysAgo),
          volume: workoutTemplates[index % workoutTemplates.length].volume + index * 145,
        }));
        const yoga: YogaSession[] = [
          { id: uid(), date: isoDaysAgo(1), flowId: "morning-energizer", flowName: "Morning Energizer", type: "flow", durationMin: 15, posesCount: 8 },
          { id: uid(), date: isoDaysAgo(2), flowName: "Surya Namaskar", type: "surya_namaskar", durationMin: 12, posesCount: 12, suryaRounds: 12 },
          { id: uid(), date: isoDaysAgo(4), flowId: "vata-grounding", flowName: "Vata Grounding", type: "flow", durationMin: 30, posesCount: 11 },
          { id: uid(), date: isoDaysAgo(6), flowName: "Hip Mobility Reset", type: "poses", durationMin: 18, posesCount: 6 },
          { id: uid(), date: isoDaysAgo(9), flowName: "Evening Release", type: "flow", durationMin: 22, posesCount: 9 },
          { id: uid(), date: isoDaysAgo(13), flowName: "Balance Practice", type: "poses", durationMin: 16, posesCount: 5 },
          { id: uid(), date: isoDaysAgo(16), flowName: "Backbend Basics", type: "poses", durationMin: 20, posesCount: 7 },
          { id: uid(), date: isoDaysAgo(19), flowName: "Travel Stretch", type: "flow", durationMin: 14, posesCount: 6 },
          { id: uid(), date: isoDaysAgo(23), flowName: "Deep Rest", type: "flow", durationMin: 25, posesCount: 8 },
        ];
        const breath: BreathSession[] = [
          { id: uid(), date: isoDaysAgo(1), techniqueId: "box-breathing", techniqueName: "Box Breathing", durationSec: 300, preMood: 5, postMood: 8, completed: true },
          { id: uid(), date: isoDaysAgo(2), techniqueId: "nadi-shodhana", techniqueName: "Nadi Shodhana", durationSec: 420, preMood: 6, postMood: 8, completed: true },
          { id: uid(), date: isoDaysAgo(4), techniqueId: "bhramari", techniqueName: "Bhramari", durationSec: 240, preMood: 4, postMood: 7, completed: true },
          { id: uid(), date: isoDaysAgo(7), techniqueId: "ujjayi", techniqueName: "Ujjayi Breath", durationSec: 360, preMood: 6, postMood: 8, completed: true },
          { id: uid(), date: isoDaysAgo(11), techniqueId: "box-breathing", techniqueName: "Box Breathing", durationSec: 300, preMood: 5, postMood: 7, completed: true },
          { id: uid(), date: isoDaysAgo(14), techniqueId: "nadi-shodhana", techniqueName: "Nadi Shodhana", durationSec: 480, preMood: 5, postMood: 8, completed: true },
          { id: uid(), date: isoDaysAgo(18), techniqueId: "sheetali", techniqueName: "Sheetali", durationSec: 300, preMood: 6, postMood: 8, completed: true },
          { id: uid(), date: isoDaysAgo(25), techniqueId: "bhramari", techniqueName: "Bhramari", durationSec: 300, preMood: 4, postMood: 7, completed: true },
        ];
        const body: BodyMetric[] = Array.from({ length: 12 }, (_, index) => {
          const daysAgo = 33 - index * 3;
          return {
            id: uid(),
            date: isoDaysAgo(Math.max(daysAgo, 0)),
            weight: Number((75.1 - index * 0.18).toFixed(1)),
            waist: Number((86.4 - index * 0.22).toFixed(1)),
            chest: Number((101.5 + index * 0.08).toFixed(1)),
          };
        }).reverse();
        const weeklyRoutines: WeeklyRoutine[] = [
          {
            id: uid(),
            name: "Professor Demo Strength",
            module: "train",
            favorite: true,
            createdAt: isoDaysAgo(28),
            updatedAt: isoDaysAgo(1),
            days: [
              { day: 0, enabled: true, timeOfDay: "morning", focus: "Upper body", items: [
                { id: uid(), type: "exercise", refId: "barbell-bench-press", name: "Barbell Bench Press", equipment: "barbell", usesWeight: true, restTimer: 75, sets: [{ id: uid(), reps: 10, weight: 60 }, { id: uid(), reps: 8, weight: 65 }] },
                { id: uid(), type: "exercise", refId: "incline-dumbbell-row", name: "Incline Dumbbell Row", equipment: "dumbbell", usesWeight: true, restTimer: 60, sets: [{ id: uid(), reps: 12, weight: 24 }] },
              ] },
              { day: 2, enabled: true, timeOfDay: "evening", focus: "Lower body", items: [
                { id: uid(), type: "exercise", refId: "back-squat", name: "Barbell Back Squat", equipment: "barbell", usesWeight: true, restTimer: 90, sets: [{ id: uid(), reps: 8, weight: 82.5 }, { id: uid(), reps: 6, weight: 85 }] },
              ] },
              { day: 4, enabled: true, timeOfDay: "any", focus: "Home circuit", items: [
                { id: uid(), type: "exercise", refId: "push-up", name: "Push Up", equipment: "bodyweight", usesWeight: false, restTimer: 45, sets: [{ id: uid(), reps: 18 }, { id: uid(), reps: 14 }] },
              ] },
              { day: 1, enabled: false, timeOfDay: "any", items: [] },
              { day: 3, enabled: false, timeOfDay: "any", items: [] },
              { day: 5, enabled: false, timeOfDay: "any", items: [] },
              { day: 6, enabled: false, timeOfDay: "any", items: [] },
            ],
          },
          {
            id: uid(),
            name: "Yoga + Breath Reset",
            module: "combined",
            favorite: true,
            createdAt: isoDaysAgo(20),
            updatedAt: isoDaysAgo(2),
            days: [
              { day: 1, enabled: true, timeOfDay: "morning", focus: "Mobility", items: [
                { id: uid(), type: "asana", refId: "tree", name: "Tree Pose", restTimer: 20, sets: [{ id: uid(), duration: 45 }] },
                { id: uid(), type: "pranayama", refId: "nadi-shodhana", name: "Nadi Shodhana", restTimer: 0, sets: [{ id: uid(), duration: 300 }] },
              ] },
              { day: 3, enabled: true, timeOfDay: "evening", focus: "Recovery", items: [
                { id: uid(), type: "asana", refId: "childs-pose", name: "Child's Pose", restTimer: 15, sets: [{ id: uid(), duration: 60 }] },
                { id: uid(), type: "pranayama", refId: "bhramari", name: "Bhramari", restTimer: 0, sets: [{ id: uid(), duration: 240 }] },
              ] },
              { day: 0, enabled: false, timeOfDay: "any", items: [] },
              { day: 2, enabled: false, timeOfDay: "any", items: [] },
              { day: 4, enabled: false, timeOfDay: "any", items: [] },
              { day: 5, enabled: false, timeOfDay: "any", items: [] },
              { day: 6, enabled: false, timeOfDay: "any", items: [] },
            ],
          },
        ];
        const journalEntries: JournalEntry[] = [
          { id: uid(), date: isoDaysAgo(1), module: "train", title: "Bench felt stronger", durationMin: 52, exerciseNames: ["Barbell Bench Press", "Incline Dumbbell Row"], volume: 4820, rpe: 8, notes: "Good energy and clean reps." },
          { id: uid(), date: isoDaysAgo(4), module: "yoga", title: "Grounding practice", durationMin: 30, posesCount: 11, notes: "Calmer after the evening flow." },
          { id: uid(), date: isoDaysAgo(9), module: "yoga", title: "Better hip mobility", durationMin: 22, posesCount: 9, notes: "Left side still tighter." },
        ];
        const fasting: FastingSession[] = [
          { id: uid(), date: isoDaysAgo(1), protocol: "16:8", targetHours: 16, actualHours: 16.5, startedAt: isoDaysAgo(1), endedAt: isoDaysAgo(0.33), completed: true, notes: "Felt great, easy to maintain." },
          { id: uid(), date: isoDaysAgo(3), protocol: "16:8", targetHours: 16, actualHours: 14.2, startedAt: isoDaysAgo(3), endedAt: isoDaysAgo(2.41), completed: false, notes: "Broke early — social dinner." },
          { id: uid(), date: isoDaysAgo(5), protocol: "18:6", targetHours: 18, actualHours: 18.1, startedAt: isoDaysAgo(5), endedAt: isoDaysAgo(4.25), completed: true },
          { id: uid(), date: isoDaysAgo(7), protocol: "16:8", targetHours: 16, actualHours: 16.8, startedAt: isoDaysAgo(7), endedAt: isoDaysAgo(6.3), completed: true },
          { id: uid(), date: isoDaysAgo(10), protocol: "20:4", targetHours: 20, actualHours: 20.3, startedAt: isoDaysAgo(10), endedAt: isoDaysAgo(9.15), completed: true, notes: "Warrior Diet trial — tough but doable." },
          { id: uid(), date: isoDaysAgo(13), protocol: "16:8", targetHours: 16, actualHours: 16.0, startedAt: isoDaysAgo(13), endedAt: isoDaysAgo(12.33), completed: true },
        ];
        set({
          profile: {
            ...current.profile,
            name: current.profile.name || "Professor Demo",
            email: current.profile.email || "admin@admin.com",
            onboarded: true,
            age: current.profile.age ?? 29,
            gender: current.profile.gender ?? "male",
            heightCm: current.profile.heightCm ?? 176,
            weightKg: current.profile.weightKg ?? 73.6,
            goals: current.profile.goals.length
              ? current.profile.goals
              : ["strength", "flexible", "stress", "consistency"],
            doshaPrimary: current.profile.doshaPrimary ?? "tridoshic",
            doshaScores: current.profile.doshaScores ?? { vata: 34, pitta: 33, kapha: 33 },
          },
          workouts,
          yoga,
          breath,
          body,
          fasting,
          weeklyRoutines,
          journalEntries,
          accountLogs: [
            logAccount("Demo data loaded", "Professor account was prepared with sample activity"),
            logAccount("Signed in", `Signed in as ${current.profile.email || "admin@admin.com"}`),
            ...current.accountLogs,
          ],
          streaks: {
            move: { current: 2, longest: 8, lastDate: dayKey(isoDaysAgo(1)) },
            yoga: { current: 4, longest: 10, lastDate: dayKey(isoDaysAgo(1)) },
            breathe: { current: 2, longest: 7, lastDate: dayKey(isoDaysAgo(1)) },
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
