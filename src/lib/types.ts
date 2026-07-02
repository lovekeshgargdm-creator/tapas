// Core domain types for Tapas (health practice tracker)

export type Dosha = "vata" | "pitta" | "kapha";
export type DoshaEffect = "increase" | "decrease" | "balance";
export type Tier = "free" | "pro";
export type ModuleKey = "move" | "yoga" | "breathe";
export type Gender = "male" | "female" | "prefer_not_to_say";
export type HeightUnit = "cm" | "ft_in";
export type WeightUnit = "kg" | "lbs";

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "forearms" | "abs" | "obliques" | "quads" | "hamstrings"
  | "glutes" | "calves" | "traps" | "lats" | "core" | "full_body"
  | "hip_flexors" | "adductors" | "neck" | "lower_back";

export type Equipment =
  | "bodyweight" | "dumbbell" | "barbell" | "kettlebell"
  | "resistance_band" | "pull_up_bar" | "bench" | "cable"
  | "machine" | "yoga_mat" | "none";

export interface Exercise {
  id: string;
  name: string;
  category: "strength" | "cardio" | "mobility" | "flexibility" | "calisthenics" | "warmup";
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  nature: "heating" | "cooling" | "grounding" | "neutral";
  instructions: string[];
  tips: string[];
}

export interface Asana {
  id: string;
  nameEnglish: string;
  nameSanskrit: string;
  nameDevanagari?: string;
  category:
    | "standing" | "seated" | "prone" | "supine"
    | "inversion" | "balance" | "twist" | "backbend" | "forward_fold";
  difficulty: 1 | 2 | 3 | 4 | 5;
  focusArea: ("flexibility" | "strength" | "balance" | "relaxation")[];
  holdSeconds: { beginner: number; intermediate: number; advanced: number };
  dosha: Record<Dosha, DoshaEffect>;
  contraindications: string[];
  instructions: string[];
  benefits: string[];
}

export interface PranayamaTechnique {
  id: string;
  name: string;
  nameSanskrit: string;
  nameDevanagari?: string;
  category: "energizing" | "balancing" | "cooling" | "grounding";
  ratio: { inhale: number; holdIn: number; exhale: number; holdOut: number };
  dosha: Record<Dosha, DoshaEffect>;
  bestTime: string;
  bestFor: string[];
  contraindications: string[];
  instructions: string[];
  benefits: string[];
  color: string;
}

export interface FlowStep {
  asanaId: string;
  holdSeconds: number;
  side?: "left" | "right" | "both";
  breathCue?: string;
  transitionNote?: string;
}

export interface YogaFlow {
  id: string;
  name: string;
  dosha: Dosha | "tridoshic";
  durationMin: number;
  intention: string;
  description: string;
  tier: Tier;
  sequence: FlowStep[];
}

export interface ProgramDay {
  week: number;
  day: number;
  title: string;
  type: "workout" | "yoga_flow" | "breathwork" | "rest" | "mixed";
  module?: ModuleKey;
  description: string;
  durationMin: number;
  refId?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeks: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  focus: string[];
  tier: Tier;
  accent: string;
  days: ProgramDay[];
}

// ---- User-logged records ----
export interface LoggedSet {
  reps: number;
  weight: number;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  targetMuscles: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO date
  name: string;
  durationMin: number;
  rpe?: number;
  notes?: string;
  exercises: LoggedExercise[];
  volume: number;
}

export interface YogaSession {
  id: string;
  date: string;
  flowId?: string;
  flowName: string;
  type: "flow" | "surya_namaskar" | "freestyle" | "poses" | "pranayama" | "routine";
  durationMin: number;
  posesCount: number;
  suryaRounds?: number;
  notes?: string;
}

export interface BreathSession {
  id: string;
  date: string;
  techniqueId: string;
  techniqueName: string;
  durationSec: number;
  preMood?: number;
  postMood?: number;
  completed: boolean;
}


export interface BodyMetric {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
  chest?: number;
  hips?: number;
  arms?: number;
  thighs?: number;
  calves?: number;
  neck?: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastDate: string | null;
}

export interface ProgramEnrollment {
  programId: string;
  startDate: string;
  currentWeek: number;
  currentDay: number;
  completedDays: string[]; // "w-d"
  status: "active" | "paused" | "completed";
}

// ---- Weekly Routine ----
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday

export interface RoutineSet {
  id: string;
  reps?: number;
  weight?: number; // kg or lbs
  duration?: number; // seconds for yoga/plank
}

export interface RoutineItem {
  id: string;
  type: "exercise" | "asana" | "pranayama";
  refId: string;
  name: string;
  sets: RoutineSet[];
  restTimer: number; // in seconds, 0 means OFF
}

export interface DayRoutine {
  day: DayOfWeek;
  timeOfDay: "morning" | "evening" | "any";
  focus?: string;
  items: RoutineItem[];
  enabled: boolean;
}

export interface WeeklyRoutine {
  id: string;
  name: string;
  module: "yoga" | "train" | "combined";
  days: DayRoutine[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountLog {
  id: string;
  date: string;
  action: string;
  detail: string;
}

// ---- Journal Entry (unified) ----
export interface JournalEntry {
  id: string;
  date: string; // ISO date-time
  module: "yoga" | "train";
  title: string;
  durationMin: number;
  notes?: string;
  // yoga-specific
  posesCount?: number;
  techniqueId?: string;
  techniqueName?: string;
  // train-specific
  exerciseNames?: string[];
  volume?: number;
  rpe?: number;
}

// ---- User Profile ----
export interface UserProfile {
  name: string;
  email: string;
  doshaScores: Record<Dosha, number>;
  doshaPrimary: Dosha | "tridoshic" | null;
  goals: string[];
  tier: Tier;
  onboarded: boolean;
  // Personal info
  age?: number;
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  passwordUpdatedAt?: string;
}
