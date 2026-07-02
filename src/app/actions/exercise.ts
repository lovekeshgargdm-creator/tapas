"use server";

/**
 * Exercise data source: yuhonas/free-exercise-db (MIT, ~873 exercises).
 * Every exercise ships with real photos hosted on GitHub raw CDN — the old
 * exercisedb.dev GIF host went offline (NXDOMAIN), which is why images broke.
 * We only ever surface exercises that have at least one working image.
 */

const DATA_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export interface ExerciseDbExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string; // primary image (frame 0)
  images: string[]; // all frames (usually 2) — used for gif-like animation
  level?: string;
}

interface RawExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// Map UI filter keys → primaryMuscle values in the dataset.
const MUSCLE_GROUPS: Record<string, string[]> = {
  chest: ["chest"],
  back: ["lats", "middle back", "lower back", "traps"],
  shoulders: ["shoulders"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  abs: ["abdominals"],
  core: ["abdominals"],
  quads: ["quadriceps"],
  hamstrings: ["hamstrings"],
  glutes: ["glutes"],
  calves: ["calves"],
  forearms: ["forearms"],
};

// Module-level cache so we only pull the dataset once per server lifetime.
let cache: RawExercise[] | null = null;
let cachePromise: Promise<RawExercise[]> | null = null;

async function getData(): Promise<RawExercise[]> {
  if (cache) return cache;
  if (!cachePromise) {
    cachePromise = fetch(DATA_URL, { next: { revalidate: 86400 } })
      .then((r) => r.json())
      .then((all: RawExercise[]) => {
        // Only keep exercises that actually have an image.
        cache = (all || []).filter((e) => e.images && e.images.length > 0);
        return cache;
      })
      .catch((err) => {
        console.error("Failed to load exercise dataset:", err);
        return [];
      });
  }
  return cachePromise;
}

function toExercise(e: RawExercise): ExerciseDbExercise {
  return {
    id: e.id,
    name: e.name,
    bodyPart: e.primaryMuscles?.[0] || e.category || "",
    equipment: e.equipment || "body weight",
    target: e.primaryMuscles?.[0] || "",
    secondaryMuscles: e.secondaryMuscles || [],
    instructions: e.instructions || [],
    gifUrl: `${IMG_BASE}/${e.images[0]}`,
    images: e.images.map((img) => `${IMG_BASE}/${img}`),
    level: e.level,
  };
}

function matchesBodyPart(e: RawExercise, bodyPart: string): boolean {
  if (!bodyPart || bodyPart.toLowerCase() === "all") return true;
  const key = bodyPart.toLowerCase();
  const group = MUSCLE_GROUPS[key];
  const muscles = (e.primaryMuscles || []).map((m) => m.toLowerCase());
  if (group) return muscles.some((m) => group.includes(m));
  // Fall back to a direct muscle / category match.
  return muscles.includes(key) || e.category?.toLowerCase() === key;
}

export async function fetchExerciseDetails(
  name: string,
): Promise<ExerciseDbExercise | null> {
  const data = await getData();
  const q = name.toLowerCase();
  const exact = data.find((e) => e.name.toLowerCase() === q);
  const match = exact || data.find((e) => e.name.toLowerCase().includes(q));
  return match ? toExercise(match) : null;
}

export async function fetchExerciseById(
  id: string,
): Promise<ExerciseDbExercise | null> {
  const data = await getData();
  const match = data.find((e) => e.id === id);
  return match ? toExercise(match) : null;
}

export interface ExerciseListResponse {
  data: ExerciseDbExercise[];
  nextCursor: string | null;
}

export async function fetchExerciseList(
  query: string = "",
  bodyPart: string = "",
  cursor: string = "",
  limit: number = 20,
): Promise<ExerciseListResponse> {
  const data = await getData();
  const q = query.trim().toLowerCase();

  const filtered = data.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q)) return false;
    if (!matchesBodyPart(e, bodyPart)) return false;
    return true;
  });

  const offset = cursor ? parseInt(cursor, 10) || 0 : 0;
  const page = filtered.slice(offset, offset + limit);
  const nextOffset = offset + limit;

  return {
    data: page.map(toExercise),
    nextCursor: nextOffset < filtered.length ? String(nextOffset) : null,
  };
}
