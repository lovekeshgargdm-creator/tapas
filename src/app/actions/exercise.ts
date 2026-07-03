"use server";

/**
 * Exercise data source: AscendAPI ExerciseDB.
 * The free V1 endpoint returns GIF URLs on static.exercisedb.dev, but that DNS
 * host is currently unreliable. When EXERCISEDB_RAPIDAPI_KEY is configured, we
 * use RapidAPI V1 media from the working ExerciseDB CDN and keep the key server-only.
 */

const OSS_API_BASE = "https://oss.exercisedb.dev/api/v1/exercises";
const RAPID_API_BASE = "https://edb-with-gifs-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises";
const RAPID_API_HOST = "edb-with-gifs-and-images-by-ascendapi.p.rapidapi.com";
const LEGACY_DATA_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const LEGACY_IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export interface ExerciseDbExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  gifUrl: string;
  images: string[];
  level?: string;
}

interface RawExercise {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  gifUrls?: Record<string, string | undefined>;
  imageUrls?: Record<string, string | undefined>;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

interface LegacyExercise {
  name: string;
  images: string[];
}

interface ExerciseApiResponse {
  success: boolean;
  meta?: {
    total?: number;
    hasNextPage?: boolean;
    nextCursor?: string;
  };
  data: RawExercise[] | RawExercise;
}

type ApiFilter =
  | { key: "bodyParts"; value: string }
  | { key: "targetMuscles"; value: string }
  | { key: "equipments"; value: string }
  | null;

// Map existing UI category labels to ExerciseDB V1 fields.
const CATEGORY_FILTERS: Record<string, ApiFilter> = {
  all: null,
  chest: { key: "bodyParts", value: "chest" },
  back: { key: "bodyParts", value: "back" },
  shoulders: { key: "bodyParts", value: "shoulders" },
  biceps: { key: "targetMuscles", value: "biceps" },
  triceps: { key: "targetMuscles", value: "triceps" },
  abs: { key: "targetMuscles", value: "abs" },
  core: { key: "targetMuscles", value: "abs" },
  quads: { key: "targetMuscles", value: "quadriceps" },
  hamstrings: { key: "targetMuscles", value: "hamstrings" },
  glutes: { key: "targetMuscles", value: "glutes" },
  calves: { key: "targetMuscles", value: "calves" },
  forearms: { key: "targetMuscles", value: "forearms" },
};

const EQUIPMENT_FILTERS: Record<string, ApiFilter> = {
  all: null,
  bodyweight: { key: "equipments", value: "body weight" },
  dumbbell: { key: "equipments", value: "dumbbell" },
  kettlebell: { key: "equipments", value: "kettlebell" },
  barbell: { key: "equipments", value: "barbell" },
  band: { key: "equipments", value: "resistance band" },
  cable: { key: "equipments", value: "cable" },
  machine: { key: "equipments", value: "leverage machine" },
};

const cleanStep = (step: string) => step.replace(/^Step:\d+\s*/i, "").trim();
const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const rapidApiKey = process.env.EXERCISEDB_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY || "";
const isRapidApiEnabled = Boolean(rapidApiKey);

let legacyMediaIndex: Map<string, string[]> | null = null;
let legacyMediaPromise: Promise<Map<string, string[]>> | null = null;

function buildListUrl(query: string, bodyPart: string, cursor: string, limit: number, equipment: string): string {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (query.trim()) params.set("name", query.trim());
  if (cursor) params.set("after", cursor);

  const category = CATEGORY_FILTERS[bodyPart.toLowerCase()];
  if (category) params.set(category.key, category.value);
  const equipmentFilter = EQUIPMENT_FILTERS[equipment.toLowerCase()];
  if (equipmentFilter) params.set(equipmentFilter.key, equipmentFilter.value);

  return `${isRapidApiEnabled ? RAPID_API_BASE : OSS_API_BASE}?${params.toString()}`;
}

async function fetchApi(url: string): Promise<ExerciseApiResponse | null> {
  try {
    const headers: HeadersInit = isRapidApiEnabled
      ? {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": RAPID_API_HOST,
        }
      : {};
    const response = await fetch(url, { headers, next: { revalidate: 86400 } });
    if (!response.ok) throw new Error(`ExerciseDB responded ${response.status}`);
    return response.json();
  } catch (err) {
    console.error("Failed to load ExerciseDB data:", err);
    return null;
  }
}

async function getLegacyMediaIndex(): Promise<Map<string, string[]>> {
  if (legacyMediaIndex) return legacyMediaIndex;
  if (!legacyMediaPromise) {
    legacyMediaPromise = fetch(LEGACY_DATA_URL, { next: { revalidate: 86400 } })
      .then((response) => {
        if (!response.ok) throw new Error(`Legacy exercise media responded ${response.status}`);
        return response.json();
      })
      .then((all: LegacyExercise[]) => {
        const index = new Map<string, string[]>();
        for (const item of all || []) {
          if (!item.name || !item.images?.length) continue;
          index.set(
            normalizeKey(item.name),
            item.images.map((image) => `${LEGACY_IMG_BASE}/${image}`),
          );
        }
        legacyMediaIndex = index;
        return index;
      })
      .catch((err) => {
        console.error("Failed to load fallback exercise media:", err);
        return new Map<string, string[]>();
      });
  }
  return legacyMediaPromise;
}

function bestMediaUrl(urls?: Record<string, string | undefined>): string {
  if (!urls) return "";
  return urls["360p"] || urls["480p"] || urls["180p"] || urls["720p"] || urls["1080p"] || Object.values(urls).find(Boolean) || "";
}

function stableExerciseDbGif(e: RawExercise): string {
  const paidGif = bestMediaUrl(e.gifUrls);
  if (paidGif) return paidGif;

  // The free host currently returns NXDOMAIN in public DNS, so do not surface it
  // as a visible image unless their CDN domain changes again.
  if (e.gifUrl && !e.gifUrl.includes("static.exercisedb.dev")) return e.gifUrl;
  return "";
}

async function toExercise(e: RawExercise): Promise<ExerciseDbExercise> {
  const target = e.targetMuscles?.[0] || "";
  const exerciseDbGif = stableExerciseDbGif(e);
  const imageUrl = e.imageUrl || bestMediaUrl(e.imageUrls) || e.videoUrl || "";
  const legacyImages = exerciseDbGif || imageUrl ? [] : (await getLegacyMediaIndex()).get(normalizeKey(e.name)) || [];
  const media = [exerciseDbGif || imageUrl, ...legacyImages].filter(Boolean);
  return {
    id: e.exerciseId,
    name: e.name,
    bodyPart: e.bodyParts?.[0] || target,
    equipment: e.equipments?.[0] || "body weight",
    target,
    secondaryMuscles: e.secondaryMuscles || [],
    instructions: (e.instructions || []).map(cleanStep).filter(Boolean),
    gifUrl: media[0] || "",
    images: media,
  };
}

function normalizeSearch(value: string): string {
  return decodeURIComponent(value).replace(/[-_]+/g, " ").trim();
}

function isMachineExercise(exercise: ExerciseDbExercise): boolean {
  return /machine|cable|smith|assisted|lever|sled/i.test(exercise.equipment || "");
}

export async function fetchExerciseDetails(
  name: string,
): Promise<ExerciseDbExercise | null> {
  const query = normalizeSearch(name);
  if (!query) return null;
  const response = await fetchApi(buildListUrl(query, "all", "", 10, "all"));
  const data = Array.isArray(response?.data) ? response.data : [];
  const q = query.toLowerCase();
  const exact = data.find((e) => e.name.toLowerCase() === q);
  const match = exact || data.find((e) => e.name.toLowerCase().includes(q));
  return match ? toExercise(match) : null;
}

export async function fetchExerciseById(
  id: string,
): Promise<ExerciseDbExercise | null> {
  if (!id) return null;
  const base = isRapidApiEnabled ? RAPID_API_BASE : OSS_API_BASE;
  const response = await fetchApi(`${base}/${encodeURIComponent(id)}`);
  const item = response?.data && !Array.isArray(response.data) ? response.data : null;
  return item ? toExercise(item) : null;
}

export interface ExerciseListResponse {
  data: ExerciseDbExercise[];
  nextCursor: string | null;
  total: number | null;
}

export async function fetchExerciseList(
  query: string = "",
  bodyPart: string = "",
  cursor: string = "",
  limit: number = 20,
  equipment: string = "all",
): Promise<ExerciseListResponse> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const response = await fetchApi(buildListUrl(query, bodyPart || "all", cursor, safeLimit, equipment || "all"));
  const data = Array.isArray(response?.data) ? response.data : [];
  const exercises = await Promise.all(data.map(toExercise));
  const visibleExercises = equipment === "no_machine" ? exercises.filter((exercise) => !isMachineExercise(exercise)) : exercises;

  return {
    data: visibleExercises,
    nextCursor: response?.meta?.hasNextPage ? response.meta.nextCursor || null : null,
    total: equipment === "no_machine" ? null : typeof response?.meta?.total === "number" ? response.meta.total : null,
  };
}
