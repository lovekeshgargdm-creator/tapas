"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchExerciseDetails } from "@/app/actions/exercise";
import { fetchYogaPoseMediaMap, type YogaPoseMedia } from "@/app/actions/yoga";
import { AppHeader } from "@/components/AppHeader";
import { BackHeader } from "@/components/BackHeader";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { ASANAS, ROUTINE_PRESETS, TECHNIQUES, type PresetItem, type RoutinePreset } from "@/lib/seed";
import { useStore, uid, todayISO } from "@/lib/store";
import {
  IconSearch, IconPlus,
  IconDumbbell,
  IconTrash, IconClose, IconPlay, IconYoga, IconBreathe, IconEdit, IconStar, IconCopy, IconChevron, IconCheck, IconCircleCheckBig
} from "@/components/Icons";
import type { WeeklyRoutine, DayRoutine, DayOfWeek, RoutineItem } from "@/lib/types";

const DAYS_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ROUTINE_BUILDER_KEY = "tapas-routine-builder-draft";
const ROUTINE_SELECTION_KEY = "tapas-routine-library-selection";
const todayRoutineDay = () => ((new Date().getDay() + 6) % 7) as DayOfWeek;
const usesExternalWeight = (equipment?: string, name?: string) => {
  const text = `${equipment || ""} ${name || ""}`.toLowerCase();
  if (/body weight|bodyweight|none|assisted|band|resistance band/.test(text)) return false;
  if (/push[- ]?up|pull[- ]?up|chin[- ]?up|plank|crunch|sit[- ]?up|burpee|mountain climber/.test(text)) return false;
  return true;
};
const formatDuration = (seconds?: number) => {
  const value = seconds || 0;
  if (value >= 60 && value % 60 === 0) return `${value / 60} min`;
  if (value >= 60) return `${Math.floor(value / 60)}m ${value % 60}s`;
  return `${value || 0}s`;
};
const blankRoutineDays = () =>
  Array.from({ length: 7 }, (_, i) => ({
    day: i as DayOfWeek,
    timeOfDay: "any" as const,
    items: [],
    enabled: i < 5,
  }));

function cloneRoutineItem(item: RoutineItem): RoutineItem {
  return {
    ...item,
    id: uid(),
    sets: item.sets.map((set) => ({ ...set, id: uid() })),
  };
}

export default function TrainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setRoutineDraft = useStore((s) => s.setRoutineDraft);
  const weeklyRoutines = useStore((s) => s.weeklyRoutines);
  const saveWeeklyRoutine = useStore((s) => s.saveWeeklyRoutine);
  const deleteWeeklyRoutine = useStore((s) => s.deleteWeeklyRoutine);

  const [routineSearch, setRoutineSearch] = useState("");

  // Routine builder
  const [buildingRoutine, setBuildingRoutine] = useState(false);
  const [routineName, setRoutineName] = useState("My Routine");
  const [allSameDay, setAllSameDay] = useState(false);
  const [dayRoutines, setDayRoutines] = useState<DayRoutine[]>(blankRoutineDays());
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [creatingPresetId, setCreatingPresetId] = useState<string | null>(null);
  const [routineTab, setRoutineTab] = useState<"all" | "favorites" | "presets">("all");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "all" || tab === "favorites" || tab === "presets") {
        setRoutineTab(tab);
      }
    }
  }, []);

  const handleSetRoutineTab = (tab: "all" | "favorites" | "presets") => {
    setRoutineTab(tab);
    if (typeof window !== "undefined") {
      router.replace(`/routine?tab=${tab}`, { scroll: false });
    }
  };

  const toggleDay = (d: DayOfWeek) => {
    setDayRoutines((prev) => prev.map((dr) => dr.day === d ? { ...dr, enabled: !dr.enabled } : dr));
  };

  const updateItemInDay = (day: DayOfWeek, itemId: string, updates: Partial<RoutineItem>) => {
    if (allSameDay) {
      setDayRoutines((prev) => prev.map((dr) => dr.enabled ? {
        ...dr, items: dr.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : dr));
    } else {
      setDayRoutines((prev) => prev.map((dr) => dr.day === day ? {
        ...dr, items: dr.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : dr));
    }
  };

  const removeItemFromDay = (day: DayOfWeek, itemId: string) => {
    setDayRoutines((prev) => prev.map((dr) => dr.day === day ? { ...dr, items: dr.items.filter((i) => i.id !== itemId) } : dr));
  };

  const saveRoutine = () => {
    const days = allSameDay
      ? dayRoutines.map((dr) => ({
          ...dr,
          items: dr.enabled ? dayRoutines[0].items.map(cloneRoutineItem) : [],
        }))
      : dayRoutines;
    const existing = editingRoutineId ? weeklyRoutines.find((routine) => routine.id === editingRoutineId) : null;
    const routine: WeeklyRoutine = {
      id: editingRoutineId || uid(),
      name: routineName.trim() || "My Routine",
      module: "combined",
      days,
      favorite: existing?.favorite,
      createdAt: existing?.createdAt || todayISO(),
      updatedAt: todayISO(),
    };
    saveWeeklyRoutine(routine);
    resetBuilder();
  };

  const resetBuilder = () => {
    setBuildingRoutine(false);
    setDayRoutines(blankRoutineDays());
    setRoutineName("My Routine");
    setAllSameDay(false);
    setEditingRoutineId(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(ROUTINE_BUILDER_KEY);
      window.sessionStorage.removeItem(ROUTINE_SELECTION_KEY);
    }
  };

  const editRoutine = (routine: WeeklyRoutine) => {
    setRoutineName(routine.name);
    setDayRoutines(routine.days.map((day) => ({
      ...day,
      items: day.items.map(cloneRoutineItem),
    })));
    setAllSameDay(false);
    setEditingRoutineId(routine.id);
    setBuildingRoutine(true);
  };

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || editingRoutineId === editId) return;
    const routine = weeklyRoutines.find((item) => item.id === editId);
    if (routine) editRoutine(routine);
  }, [searchParams, weeklyRoutines, editingRoutineId]);

  useEffect(() => {
    const presetId = searchParams.get("preset");
    if (!presetId || creatingPresetId === presetId) return;
    const presetObj = ROUTINE_PRESETS.find((p) => p.id === presetId);
    if (presetObj && !creatingPresetId) {
      createRoutineFromPreset(presetObj);
      if (typeof window !== "undefined") {
        router.replace("/routine?tab=all", { scroll: false });
      }
    }
  }, [searchParams, creatingPresetId, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldRestore =
      searchParams.get("restore") === "routine-library" ||
      window.sessionStorage.getItem(ROUTINE_BUILDER_KEY) ||
      window.sessionStorage.getItem(ROUTINE_SELECTION_KEY);
    if (!shouldRestore) return;
    const rawDraft = window.sessionStorage.getItem(ROUTINE_BUILDER_KEY);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as {
          routineName?: string;
          allSameDay?: boolean;
          dayRoutines?: DayRoutine[];
          editingRoutineId?: string | null;
        };
        if (draft.routineName) setRoutineName(draft.routineName);
        setAllSameDay(Boolean(draft.allSameDay));
        if (Array.isArray(draft.dayRoutines)) setDayRoutines(draft.dayRoutines);
        setEditingRoutineId(draft.editingRoutineId || null);
        setBuildingRoutine(true);
      } catch {
        window.sessionStorage.removeItem(ROUTINE_BUILDER_KEY);
      }
    }

    const rawSelection = window.sessionStorage.getItem(ROUTINE_SELECTION_KEY);
    if (rawSelection) {
      try {
        const selection = JSON.parse(rawSelection) as { day?: DayOfWeek; items?: RoutineItem[] };
        const items = Array.isArray(selection.items) ? selection.items : [];
        if (typeof selection.day === "number" && items.length > 0) {
          setDayRoutines((prev) =>
            prev.map((day) =>
              day.day === selection.day
                ? { ...day, enabled: true, items: [...day.items, ...items] }
                : day,
            ),
          );
        }
      } catch {
        // Ignore malformed handoff data; the builder draft is still restored.
      } finally {
        window.sessionStorage.removeItem(ROUTINE_SELECTION_KEY);
        window.sessionStorage.removeItem(ROUTINE_BUILDER_KEY);
      }
    }
  }, [searchParams]);

  const openRoutineLibrary = (day: DayOfWeek) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        ROUTINE_BUILDER_KEY,
        JSON.stringify({ routineName, allSameDay, dayRoutines, editingRoutineId }),
      );
    }
    router.push(`/routine/library?day=${day}`);
  };

  const duplicateRoutine = (routine: WeeklyRoutine) => {
    saveWeeklyRoutine({
      ...routine,
      id: uid(),
      name: `${routine.name} Copy`,
      favorite: false,
      days: routine.days.map((day) => ({
        ...day,
        items: day.items.map(cloneRoutineItem),
      })),
      createdAt: todayISO(),
      updatedAt: todayISO(),
    });
  };

  const toggleFavorite = (routine: WeeklyRoutine) => {
    saveWeeklyRoutine({
      ...routine,
      favorite: !routine.favorite,
      updatedAt: todayISO(),
    });
  };

  const useRoutine = (routine: WeeklyRoutine) => {
    const today = todayRoutineDay();
    const usableDays = routine.days.filter((day) => day.enabled && day.items.length > 0);
    const plan =
      usableDays.find((day) => day.day === today) ||
      usableDays.find((day) => day.day > today) ||
      usableDays[0];
    if (!plan || plan.items.length === 0) return;
    setRoutineDraft({
      routineId: routine.id,
      routineName: routine.name,
      day: plan.day,
      dayLabel: DAYS_LABELS[plan.day],
      items: plan.items.map(cloneRoutineItem),
      startedAt: todayISO(),
    });
    router.push("/workout/active");
  };

  const itemFromPreset = async (item: PresetItem, poseMedia: Record<string, YogaPoseMedia>): Promise<RoutineItem | null> => {
    if (item.type === "exercise") {
      const details = await fetchExerciseDetails(item.name);
      const weighted = usesExternalWeight(details?.equipment, details?.name || item.name);
      return {
        id: uid(),
        type: "exercise",
        refId: details?.id || item.name,
        name: details?.name || item.name,
        image: details?.gifUrl,
        equipment: details?.equipment,
        usesWeight: weighted,
        sets: Array.from({ length: item.sets || 3 }, () => ({
          id: uid(),
          reps: item.reps ?? 10,
          weight: undefined,
        })),
        restTimer: item.restTimer ?? 0,
      };
    }

    if (item.type === "asana") {
      const asana = ASANAS.find((entry) => entry.id === item.id);
      const media = poseMedia[item.id];
      if (!asana || !media?.image) return null;
      return {
        id: uid(),
        type: "asana",
        refId: asana.id,
        name: asana.nameEnglish,
        image: media.image,
        sets: [{ id: uid(), duration: item.duration ?? asana.holdSeconds.intermediate }],
        restTimer: 0,
      };
    }

    const technique = TECHNIQUES.find((entry) => entry.id === item.id);
    if (!technique) return null;
    return {
      id: uid(),
      type: "pranayama",
      refId: technique.id,
      name: technique.name,
      sets: [{ id: uid(), duration: item.duration ?? 300 }],
      restTimer: 0,
    };
  };

  const createRoutineFromPreset = async (preset: RoutinePreset) => {
    setCreatingPresetId(preset.id);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const poseMedia = await fetchYogaPoseMediaMap();
    const items = (await Promise.all(preset.items.map((item) => itemFromPreset(item, poseMedia)))).filter(Boolean) as RoutineItem[];
    if (items.length === 0) {
      setCreatingPresetId(null);
      return;
    }
    const activeDays = new Set<DayOfWeek>(preset.days);
    const hasExercise = items.some((item) => item.type === "exercise");
    const hasYoga = items.some((item) => item.type !== "exercise");
    saveWeeklyRoutine({
      id: uid(),
      name: preset.name,
      module: hasExercise && hasYoga ? "combined" : hasExercise ? "train" : "yoga",
      days: blankRoutineDays().map((day) => ({
        ...day,
        enabled: activeDays.has(day.day),
        items: activeDays.has(day.day) ? items.map(cloneRoutineItem) : [],
      })),
      favorite: false,
      createdAt: todayISO(),
      updatedAt: todayISO(),
    });
    setCreatingPresetId(null);
    handleSetRoutineTab("all");
    setShowSuccessModal(true);
  };

  const routineList = weeklyRoutines
    .filter((r) => r.module === "train" || r.module === "combined" || r.module === "yoga")
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const visibleRoutines = routineList
    .filter((r) => routineTab !== "favorites" || r.favorite)
    .filter((r) => r.name.toLowerCase().includes(routineSearch.toLowerCase()));


  return (
    <div className="page">
      {!buildingRoutine ? (
        <AppHeader title="Routine" subtitle="Build training and yoga together" />
      ) : (
        <BackHeader 
          title={editingRoutineId ? "Edit Routine" : "Create Routine"} 
          subtitle="Manage your training plan" 
          onBack={resetBuilder} 
        />
      )}

        <div>
          {!buildingRoutine ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "var(--color-surface-main)", borderRadius: 12, padding: 4, marginBottom: 16 }}>
                {[
                  { id: "all", label: "All" },
                  { id: "favorites", label: "Favorites" },
                  { id: "presets", label: "Presets" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSetRoutineTab(tab.id as "all" | "favorites" | "presets")}
                    style={{
                      border: "none",
                      borderRadius: 9,
                      minHeight: 40,
                      fontWeight: 800,
                      background: routineTab === tab.id ? "var(--color-surface-3)" : "transparent",
                      color: routineTab === tab.id ? "var(--color-mint-active)" : "var(--color-text-muted)",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {routineTab === "presets" ? (
                <PresetSection
                  presets={ROUTINE_PRESETS}
                  creatingPresetId={creatingPresetId}
                  onCreate={createRoutineFromPreset}
                />
              ) : (
                <div>
                  <button
                    className="btn btn-primary btn-block"
                    style={{ marginBottom: 20 }}
                    onClick={() => setBuildingRoutine(true)}
                  >
                    <IconPlus width={18} height={18} /> Create Routine
                  </button>

                  {routineList.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ position: "relative", marginBottom: 10 }}>
                        <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                        <input className="input input-with-icon" placeholder="Search routines..." value={routineSearch} onChange={(event) => setRoutineSearch(event.target.value)} />
                      </div>
                    </div>
                  )}

                  {visibleRoutines.length === 0 ? (
                    <div className="clay" style={{ padding: 24, textAlign: "center" }}>
                      <div style={{ marginBottom: 10, color: "var(--color-text-muted)" }}><IconDumbbell width={40} height={40} /></div>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>{routineTab === "favorites" ? "No favorite routines yet." : "No routines yet."}</div>
                      <div className="text-caption">
                        {routineTab === "favorites"
                          ? "Tap the star on a routine to keep it here."
                          : "Build a weekly training schedule — different workouts per day or the same plan all week. You can also include yoga sessions!"}
                      </div>
                    </div>
                  ) : (
                    <div className="stack gap-md">
                      {visibleRoutines.map((r) => (
                        <TrainRoutineCard
                          key={r.id}
                          routine={r}
                          onUse={() => useRoutine(r)}
                          onFavorite={() => toggleFavorite(r)}
                          onEdit={() => editRoutine(r)}
                          onDuplicate={() => duplicateRoutine(r)}
                          onDelete={() => deleteWeeklyRoutine(r.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <TrainRoutineBuilder
              name={routineName}
              setName={setRoutineName}
              allSame={allSameDay}
              setAllSame={setAllSameDay}
              dayRoutines={dayRoutines}
              onToggleDay={toggleDay}
              onUpdateItem={updateItemInDay}
              onRemoveItem={removeItemFromDay}
              onOpenLibrary={openRoutineLibrary}
              onSave={saveRoutine}
              onCancel={resetBuilder}
            />
          )}
        </div>

        <AnimatePresence>
          {showSuccessModal && (
            <CenterModal onClose={() => setShowSuccessModal(false)} title="Success">
              <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 12 }}>
                  <div style={{ padding: "10px 0 20px", display: "grid", placeItems: "center" }}>
                    <IconCircleCheckBig width={50} height={50} style={{ color: "var(--color-mint-active)", filter: "drop-shadow(0 0 6px rgba(115,253,156,0.4))" }} />
                  </div>
                </motion.div>
                <p style={{ margin: "0 0 24px", color: "var(--color-text-secondary)", fontSize: 15 }}>
                  Routine added to your list successfully!
                </p>
                <button className="btn btn-primary btn-block btn-lg" onClick={() => setShowSuccessModal(false)}>
                  Awesome
                </button>
              </div>
            </CenterModal>
          )}
        </AnimatePresence>
    </div>
  );
}

function PresetSection({
  presets,
  creatingPresetId,
  onCreate,
}: {
  presets: RoutinePreset[];
  creatingPresetId: string | null;
  onCreate: (preset: RoutinePreset) => void;
}) {
  return (
    <section className="stack gap-sm" style={{ marginBottom: 22 }}>
      <div style={{ marginBottom: 2 }}>
        <h2 className="section-title" style={{ fontSize: 18, margin: 0 }}>Routine Presets</h2>
        <p className="text-caption" style={{ marginTop: 3 }}>Simple ready-made routines you can add and edit.</p>
      </div>
      {presets.map((preset) => {
        const isCreating = creatingPresetId === preset.id;
        const hasTrain = preset.items.some((item) => item.type === "exercise");
        const hasPose = preset.items.some((item) => item.type === "asana");
        const hasBreath = preset.items.some((item) => item.type === "pranayama");
        return (
          <div key={preset.id} className="card" style={{ padding: 0, position: "relative", overflow: "hidden", marginBottom: 16 }}>
            {preset.image && (
              <>
                <div style={{ position: "absolute", top: 0, right: 0, width: "65%", height: "100%", backgroundImage: `url(${preset.image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, pointerEvents: "none", WebkitMaskImage: "linear-gradient(to right, transparent, black 80%)", maskImage: "linear-gradient(to right, transparent, black 80%)" }} />
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(135deg, color-mix(in srgb, ${preset.accent} 10%, transparent) 0%, transparent 70%)`, pointerEvents: "none" }} />
              </>
            )}
            <div className="row between" style={{ padding: 18, gap: 12, alignItems: "flex-start", position: "relative", zIndex: 1 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row gap-xs wrap" style={{ marginBottom: 12 }}>
                  <span className="pill" style={{ color: preset.accent, borderColor: `color-mix(in srgb, ${preset.accent} 25%, transparent)`, background: `color-mix(in srgb, ${preset.accent} 8%, transparent)` }}>{preset.category}</span>
                  <span className="pill" style={{ background: "var(--color-surface-2)" }}>{preset.days.length} days</span>
                  <span className="pill" style={{ background: "var(--color-surface-2)" }}>{preset.items.length} items</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--color-text-primary)", letterSpacing: "-0.2px" }}>{preset.name}</h3>
                <p className="text-caption" style={{ marginTop: 6, lineHeight: 1.45, fontSize: 13, maxWidth: "85%" }}>{preset.description}</p>
                <div className="row wrap" style={{ marginTop: 14, alignItems: "center" }}>
                  {hasTrain && <span className="row" style={{ color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600 }}><IconDumbbell width={14} height={14} style={{ marginRight: 4 }} /> Train</span>}
                  {hasTrain && hasPose && <div style={{ width: 1, height: 12, background: "var(--color-outline-muted)", margin: "0 10px" }} />}
                  {hasPose && <span className="row" style={{ color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600 }}><IconYoga width={14} height={14} style={{ marginRight: 4 }} /> Yoga</span>}
                  {(hasTrain || hasPose) && hasBreath && <div style={{ width: 1, height: 12, background: "var(--color-outline-muted)", margin: "0 10px" }} />}
                  {hasBreath && <span className="row" style={{ color: "var(--color-text-muted)", fontSize: 12, fontWeight: 600 }}><IconBreathe width={14} height={14} style={{ marginRight: 4 }} /> Breathe</span>}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onCreate(preset)}
                disabled={Boolean(creatingPresetId)}
                style={{
                  minHeight: 36,
                  padding: "8px 16px",
                  fontSize: 13,
                  flexShrink: 0,
                  borderRadius: 20
                }}
              >
                <IconPlus width={15} height={15} /> {isCreating ? "Adding" : "Add"}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Train Routine Builder ───
function TrainRoutineBuilder({
  name, setName, allSame, setAllSame,
  dayRoutines, onToggleDay, onUpdateItem,
  onRemoveItem, onOpenLibrary,
  onSave, onCancel,
}: {
  name: string; setName: (s: string) => void;
  allSame: boolean; setAllSame: (b: boolean) => void;
  dayRoutines: DayRoutine[];
  onToggleDay: (d: DayOfWeek) => void;
  onUpdateItem: (d: DayOfWeek, id: string, updates: Partial<RoutineItem>) => void;
  onRemoveItem: (d: DayOfWeek, id: string) => void;
  onOpenLibrary: (d: DayOfWeek) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 0: true });
  const toggleExpandedDay = (day: DayOfWeek) => {
    setExpandedDays((current) => ({ ...current, [day]: !(current[day] ?? false) }));
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Routine Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 6 }} placeholder="My Training Routine" />
      </div>

      <div className="clay" style={{ padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Same routine every day</div>
          <div className="text-caption">Apply one plan to all enabled days</div>
        </div>
        <button onClick={() => setAllSame(!allSame)} aria-pressed={allSame}
          style={{ width: 48, height: 28, borderRadius: 999, border: "none", position: "relative", cursor: "pointer", background: allSame ? "var(--color-mint-active)" : "var(--color-surface-3)", transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 3, left: allSame ? 23 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
        </button>
      </div>

      <div className="uppercase-label" style={{ marginBottom: 10 }}>Select Days</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 18 }}>
        {DAYS_LABELS.map((label, i) => {
          const dr = dayRoutines.find((d) => d.day === i)!;
          return (
            <button key={i} onClick={() => onToggleDay(i as DayOfWeek)}
              style={{ padding: "8px 2px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11,
                background: dr.enabled ? "rgba(115,253,156,0.15)" : "var(--color-surface-main)",
                color: dr.enabled ? "var(--color-mint-active)" : "var(--color-text-muted)", transition: "all .2s" }}>
              {label}
            </button>
          );
        })}
      </div>

      {(allSame ? dayRoutines.slice(0, 1) : dayRoutines.filter((d) => d.enabled)).map((dr) => (
        <div key={dr.day} className="clay" style={{ marginBottom: 12, padding: 14 }}>
          {(() => {
            const isExpanded = expandedDays[dr.day] ?? false;
            return (
              <>
                <button
                  type="button"
                  onClick={() => toggleExpandedDay(dr.day)}
                  aria-expanded={isExpanded}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "inherit",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    marginBottom: isExpanded ? 10 : 0,
                  }}
                >
                  <span>
                    <span style={{ display: "block", fontWeight: 750, fontSize: 15 }}>{allSame ? "All Days" : DAYS_LABELS[dr.day]}</span>
                    <span className="text-caption" style={{ display: "block", marginTop: 2 }}>
                      {dr.items.length} item{dr.items.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span style={{ width: 32, height: 32, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--color-surface-main)", color: "var(--color-mint-active)", flexShrink: 0 }}>
                    <IconChevron width={16} height={16} style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .18s ease" }} />
                  </span>
                </button>

                {isExpanded && (
                  <>

          {dr.items.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {dr.items.map((item) => {
                const itemUsesWeight = item.usesWeight ?? usesExternalWeight(item.equipment, item.name);
                return (
                <div key={item.id} className="card" style={{ marginBottom: 10, padding: 12, background: "var(--color-surface-main)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.image ? (
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#fff", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(115,253,156,0.1)", color: "var(--color-mint-active)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          {item.type === "exercise" ? <IconDumbbell width={18} height={18} /> : item.type === "asana" ? <IconYoga width={18} height={18} /> : <IconBreathe width={18} height={18} />}
                        </div>
                      )}
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{item.name}</span>
                    </div>
                    <button onClick={() => onRemoveItem(dr.day, item.id)} style={{ background: "none", border: "none", color: "var(--color-status-error)", cursor: "pointer", padding: 4 }}>
                      <IconClose width={16} height={16} />
                    </button>
                  </div>

                  {item.type === "exercise" ? (
                    <div>
                      {/* Sets Header */}
                      <div style={{ display: "grid", gridTemplateColumns: itemUsesWeight ? "40px 1fr 1fr" : "40px 1fr", gap: 8, fontSize: 10.5, color: "var(--color-text-muted)", fontWeight: 700, marginBottom: 6, padding: "0 4px" }}>
                        <div style={{ textAlign: "center" }}>SET</div>
                        {itemUsesWeight && <div style={{ textAlign: "center" }}>KG</div>}
                        <div style={{ textAlign: "center" }}>REPS</div>
                      </div>
                      {/* Sets Rows */}
                      {item.sets.map((set, sIdx) => (
                        <div key={set.id} style={{ display: "grid", gridTemplateColumns: itemUsesWeight ? "40px 1fr 1fr" : "40px 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "6px 0" }}>{sIdx + 1}</div>
                          {itemUsesWeight && <input className="input" style={{ padding: "6px", fontSize: 13, textAlign: "center", minHeight: 32, background: "var(--color-surface-3)", border: "none" }} placeholder="-" type="number" value={set.weight || ""}
                            onChange={e => {
                              const newSets = [...item.sets];
                              newSets[sIdx] = { ...set, weight: parseInt(clampNumericInput(e.target.value, LIMITS.setWeight), 10) || undefined };
                              onUpdateItem(dr.day, item.id, { sets: newSets });
                            }} />}
                          <input className="input" style={{ padding: "6px", fontSize: 13, textAlign: "center", minHeight: 32, background: "var(--color-surface-3)", border: "none" }} placeholder="-" type="number" value={set.reps || ""}
                            onChange={e => {
                              const newSets = [...item.sets];
                              newSets[sIdx] = { ...set, reps: parseInt(clampNumericInput(e.target.value, LIMITS.reps), 10) || undefined };
                              onUpdateItem(dr.day, item.id, { sets: newSets });
                            }} />
                        </div>
                      ))}
                      <button className="btn btn-ghost" style={{ width: "100%", padding: "6px 0", fontSize: 12, marginTop: 4, background: "rgba(255,255,255,0.03)" }} 
                        onClick={() => {
                           const newSets = [...item.sets, { id: uid(), reps: undefined, weight: undefined }];
                           onUpdateItem(dr.day, item.id, { sets: newSets });
                        }}>
                        <IconPlus width={12} height={12} style={{ marginRight: 4 }} /> Add Set
                      </button>

                      {/* Rest Timer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 500, color: "var(--color-text-muted)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-mint-active)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Rest Timer
                        </div>
                        <select className="input" style={{ width: 80, padding: "4px 8px", fontSize: 12, minHeight: 28, background: "var(--color-surface-3)", border: "none" }} value={item.restTimer} onChange={(e) => onUpdateItem(dr.day, item.id, { restTimer: parseInt(e.target.value) })}>
                          <option value={0}>OFF</option>
                          <option value={15}>15s</option>
                          <option value={30}>30s</option>
                          <option value={45}>45s</option>
                          <option value={60}>60s</option>
                          <option value={90}>90s</option>
                          <option value={120}>2m</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-caption" style={{ marginBottom: 6 }}>
                        {item.type === "asana" ? "Hold duration in seconds" : "Session duration in seconds"} · {formatDuration(item.sets[0]?.duration)}
                      </div>
                      <input className="input" style={{ width: "100%", padding: "8px", fontSize: 13, textAlign: "center", minHeight: 36, background: "var(--color-surface-3)", border: "none" }} placeholder={item.type === "asana" ? "Hold seconds" : "Session seconds"} type="number"
                        value={item.sets[0]?.duration || ""} 
                        onChange={e => {
                          const newSets = [{ id: item.sets[0]?.id || uid(), duration: parseInt(clampNumericInput(e.target.value, LIMITS.durationSec), 10) || undefined }];
                          onUpdateItem(dr.day, item.id, { sets: newSets });
                        }} />
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}

          <button
            className="btn btn-ghost"
            style={{ fontSize: 13, padding: "8px 12px", width: "100%", border: "1px dashed rgba(115,253,156,0.35)", color: "var(--color-mint-active)" }}
            onClick={() => onOpenLibrary(dr.day)}
          >
            <IconPlus width={14} height={14} /> Open library and select items
          </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave}>Save Routine</button>
      </div>
    </div>
  );
}



function TrainRoutineCard({
  routine,
  onUse,
  onFavorite,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  routine: WeeklyRoutine;
  onUse: () => void;
  onFavorite: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const enabledDays = routine.days.filter((d) => d.enabled);
  const itemCount = enabledDays.reduce((sum, day) => sum + day.items.length, 0);
  const hasItems = itemCount > 0;
  let trainCount = 0;
  let poseCount = 0;
  let breathCount = 0;
  enabledDays.forEach(d => {
    d.items.forEach(i => {
      if (i.type === "exercise") trainCount++;
      if (i.type === "asana") poseCount++;
      if (i.type === "pranayama") breathCount++;
    });
  });
  
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ padding: 16, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingRight: 10 }}>
            <h3 style={{ fontWeight: 800, fontSize: 18, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--color-text-primary)" }}>
              {routine.name}
            </h3>
            <span className="pill" style={{ background: "color-mix(in srgb, var(--color-text-primary) 8%, transparent)", border: "1px solid var(--color-outline-muted)", padding: "4px 8px", fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, flexShrink: 0 }}>
              {enabledDays.length} {enabledDays.length === 1 ? 'day' : 'days'}
            </span>
          </div>
          <button 
            onClick={onFavorite} 
            aria-label={routine.favorite ? "Remove favorite" : "Mark favorite"} 
            title={routine.favorite ? "Remove favorite" : "Mark favorite"} 
            style={{ 
              background: "none", border: "none", cursor: "pointer", flexShrink: 0, 
              padding: 4, margin: "-4px -4px 0 0", 
              color: routine.favorite ? "#fdb974" : "var(--color-text-muted)" 
            }}
          >
            <IconStar width={22} height={22} fill={routine.favorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="row gap-xs wrap" style={{ marginBottom: 18 }}>
          {trainCount > 0 && <span className="pill row" style={{ color: "var(--color-train)", borderColor: "color-mix(in srgb, var(--color-train) 25%, transparent)", background: "color-mix(in srgb, var(--color-train) 8%, transparent)" }}><IconDumbbell width={12} height={12} style={{ marginRight: 4 }} /> {trainCount} {trainCount === 1 ? 'Exercise' : 'Exercises'}</span>}
          {poseCount > 0 && <span className="pill row" style={{ color: "var(--color-yoga)", borderColor: "color-mix(in srgb, var(--color-yoga) 25%, transparent)", background: "color-mix(in srgb, var(--color-yoga) 8%, transparent)" }}><IconYoga width={12} height={12} style={{ marginRight: 4 }} /> {poseCount} {poseCount === 1 ? 'Pose' : 'Poses'}</span>}
          {breathCount > 0 && <span className="pill row" style={{ color: "var(--color-breathe)", borderColor: "color-mix(in srgb, var(--color-breathe) 25%, transparent)", background: "color-mix(in srgb, var(--color-breathe) 8%, transparent)" }}><IconBreathe width={12} height={12} style={{ marginRight: 4 }} /> {breathCount} {breathCount === 1 ? 'Breath' : 'Breaths'}</span>}
        </div>

        <div className="row between" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            <div className="row" style={{ gap: 3 }}>
              {DAYS_LABELS.map((label, i) => {
                const dr = routine.days.find((d) => d.day === i);
                const active = dr?.enabled;
                return (
                  <div 
                    key={i} 
                    style={{ 
                      width: 22, height: 22, borderRadius: "50%", 
                      display: "grid", placeItems: "center", fontSize: 10, fontWeight: 750,
                      background: active ? "var(--color-mint-active)" : "var(--color-surface-main)",
                      color: active ? "var(--color-surface-main)" : "var(--color-text-secondary)",
                      boxShadow: active ? "0 2px 8px rgba(115,253,156,0.3)" : "none"
                    }}
                  >
                    {label.charAt(0)}
                  </div>
                );
              })}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ minHeight: 36, borderRadius: 20, fontSize: 13, padding: "0 16px", flexShrink: 0 }} 
            onClick={onUse} 
            disabled={!hasItems}
          >
            <IconPlay width={14} height={14} style={{ marginRight: 4 }} /> Start
          </button>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "1px solid var(--color-outline-muted)", background: "var(--color-surface-2)" }}>
        <button 
          onClick={onEdit} 
          style={{ padding: "14px 0", background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, display: "flex", gap: 6, justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        >
          <IconEdit width={15} height={15} /> Edit
        </button>
        <button 
          onClick={onDuplicate} 
          style={{ padding: "14px 0", background: "none", border: "none", borderLeft: "1px solid var(--color-outline-muted)", borderRight: "1px solid var(--color-outline-muted)", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600, display: "flex", gap: 6, justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        >
          <IconCopy width={15} height={15} /> Duplicate
        </button>
        <button 
          onClick={onDelete} 
          style={{ padding: "14px 0", background: "none", border: "none", color: "var(--color-status-error)", fontSize: 13, fontWeight: 600, display: "flex", gap: 6, justifyContent: "center", alignItems: "center", cursor: "pointer" }}
        >
          <IconTrash width={15} height={15} /> Delete
        </button>
      </div>


    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)",
  textTransform: "uppercase", letterSpacing: "0.08em",
};

function CenterModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(4,8,6,0.68)", zIndex: 400 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="glass"
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
          width: "min(420px, calc(100% - 32px))",
          zIndex: 401,
          borderRadius: 18,
          padding: 18,
          boxSizing: "border-box",
        }}
      >
        <div className="row center" style={{ gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
          <h3 className="section-title" style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        </div>
        {children}
      </motion.div>
    </>
  );
}
