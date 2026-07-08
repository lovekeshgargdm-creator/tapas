"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchExerciseById, fetchExerciseDetails, fetchExerciseList } from "@/app/actions/exercise";
import { fetchYogaPoseMediaMap } from "@/app/actions/yoga";
import { useStore, uid, todayISO } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconClose, IconPlus, IconCheck, IconTrend, IconTimer, IconPause, IconPlay, IconYoga, IconBreathe } from "@/components/Icons";
import type { LoggedExercise, LoggedSet, RoutineItem } from "@/lib/types";

const DEFAULT_IDS = ["push up", "plank"];
const LIBRARY_TRY_KEY = "tapas-library-try-exercise";
type ActiveExercise = LoggedExercise & { restTimer?: number; image?: string };
type LibraryTryDraft = ActiveExercise & { returnTo?: string };
type TimedRoutineItem = {
  id: string;
  refId: string;
  type: "asana" | "pranayama";
  name: string;
  image?: string;
  duration: number;
  remaining: number;
  running: boolean;
  done: boolean;
};

const usesExternalWeight = (equipment?: string, name?: string) => {
  const text = `${equipment || ""} ${name || ""}`.toLowerCase();
  if (/body weight|bodyweight|none|assisted|band|resistance band/.test(text)) return false;
  if (/push[- ]?up|pull[- ]?up|chin[- ]?up|plank|crunch|sit[- ]?up|burpee|mountain climber/.test(text)) return false;
  return true;
};

const fromRoutineItem = (item: RoutineItem): ActiveExercise => {
  const weighted = item.usesWeight ?? usesExternalWeight(item.equipment, item.name);
  return {
    exerciseId: item.refId,
    name: item.name,
    image: item.image,
    targetMuscles: item.equipment ? item.equipment : weighted ? "Weighted exercise" : "Bodyweight",
    equipment: item.equipment,
    usesWeight: weighted,
    sets: item.sets.length
      ? item.sets.map((set) => ({
          reps: set.reps ?? 10,
          weight: weighted ? set.weight : undefined,
          done: false,
        }))
      : [{ reps: 10, weight: weighted ? undefined : undefined, done: false }],
    restTimer: item.restTimer,
  };
};

export default function ActiveWorkout() {
  const router = useRouter();
  const draft = useStore((s) => s.draftExercises);
  const draftRoutine = useStore((s) => s.draftRoutine);
  const clearDraft = useStore((s) => s.clearDraft);
  const addWorkout = useStore((s) => s.addWorkout);
  const addYoga = useStore((s) => s.addYoga);
  const addBreath = useStore((s) => s.addBreath);
  const prevWorkouts = useStore((s) => s.workouts);
  const mounted = useMounted();

  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [timedItems, setTimedItems] = useState<TimedRoutineItem[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [sessionRunning, setSessionRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [returnTo, setReturnTo] = useState("/routine");
  const [sessionName, setSessionName] = useState("");
  const [restTimer, setRestTimer] = useState<{
    total: number;
    remaining: number;
    running: boolean;
    label: string;
  } | null>(null);

  // Build the session from draft (or a sensible default)
  useEffect(() => {
    if (!mounted || exercises.length > 0 || timedItems.length > 0) return;
    let active = true;
    const loadDraft = async () => {
      if (typeof window !== "undefined") {
        const query = new URLSearchParams(window.location.search);
        const isLibraryTry = query.get("source") === "library";
        const exerciseId = query.get("exercise") || "";
        if (isLibraryTry && exerciseId) {
          const name = query.get("name") || exerciseId;
          const usesWeight = query.get("usesWeight") !== "0";
          const setCount = Math.max(1, Math.min(20, parseInt(query.get("sets") || "1", 10) || 1));
          const reps = parseInt(query.get("reps") || "10", 10) || 10;
          const weight = usesWeight ? parseFloat(query.get("weight") || "") || undefined : undefined;
          const restTimer = parseInt(query.get("rest") || "0", 10) || 0;
          setReturnTo(query.get("return") || `/library/train/${encodeURIComponent(exerciseId)}`);
          setSessionName(`Try ${name}`);
          if (active) {
                setExercises([{
                  exerciseId,
                  name,
                  image: query.get("image") || undefined,
              targetMuscles: query.get("target") || "",
              equipment: query.get("equipment") || undefined,
              usesWeight,
              restTimer,
              sets: Array.from({ length: setCount }, () => ({ reps, weight, done: false })),
            }]);
          }
          return;
        }

        const rawLibraryDraft = window.sessionStorage.getItem(LIBRARY_TRY_KEY);
        if (isLibraryTry && rawLibraryDraft) {
          try {
            const libraryDraft = JSON.parse(rawLibraryDraft) as LibraryTryDraft;
            if (libraryDraft.exerciseId && libraryDraft.name) {
              setReturnTo(libraryDraft.returnTo || `/library/train/${encodeURIComponent(libraryDraft.exerciseId)}`);
              setSessionName(`Try ${libraryDraft.name}`);
              if (active) {
                setExercises([{
                  exerciseId: libraryDraft.exerciseId,
                  name: libraryDraft.name,
                  image: libraryDraft.image,
                  targetMuscles: libraryDraft.targetMuscles || "",
                  equipment: libraryDraft.equipment,
                  usesWeight: libraryDraft.usesWeight,
                  restTimer: libraryDraft.restTimer,
                  sets: Array.isArray(libraryDraft.sets) && libraryDraft.sets.length
                    ? libraryDraft.sets
                    : [{ reps: 10, weight: libraryDraft.usesWeight === false ? undefined : 20, done: false }],
                }]);
              }
              return;
            }
          } catch {
            window.sessionStorage.removeItem(LIBRARY_TRY_KEY);
          }
        }
      }
      if (draftRoutine) {
        const initialExercises = draftRoutine.items
          .filter((item) => item.type === "exercise")
          .map((item) => fromRoutineItem(item));

        const initialTimedItems = draftRoutine.items
          .filter((item) => item.type === "asana" || item.type === "pranayama")
          .map((item) => {
            const duration = item.sets[0]?.duration || (item.type === "asana" ? 30 : 300);
            return {
              id: item.id,
              refId: item.refId,
              type: item.type,
              name: item.name,
              image: item.image,
              duration,
              remaining: duration,
              running: false,
              done: false,
            } as TimedRoutineItem;
          });

        if (active) {
          setExercises(initialExercises);
          setTimedItems(initialTimedItems);
        }

        initialExercises.forEach((exercise) => {
          if (!exercise.image) {
            fetchExerciseById(exercise.exerciseId).then((details) => {
              if (active && details?.gifUrl) {
                setExercises((prev) =>
                  prev.map((ex) =>
                    ex.exerciseId === exercise.exerciseId && !ex.image
                      ? {
                          ...ex,
                          image: details.gifUrl,
                          targetMuscles: ex.targetMuscles || details.target,
                          equipment: ex.equipment || details.equipment,
                        }
                      : ex
                  )
                );
              }
            });
          }
        });

        const needsPoseMedia = draftRoutine.items.some((item) => item.type === "asana" && !item.image);
        if (needsPoseMedia) {
          fetchYogaPoseMediaMap().then((poseMedia) => {
            if (active) {
              setTimedItems((prev) =>
                prev.map((item) =>
                  item.type === "asana" && !item.image && poseMedia[item.refId]?.image
                    ? { ...item, image: poseMedia[item.refId].image }
                    : item
                )
              );
            }
          });
        }
        return;
      }
      const ids = draft.length ? draft : DEFAULT_IDS;
      const loaded: ActiveExercise[] = [];
      for (const id of ids) {
        let ex = await fetchExerciseById(id);
        if (!ex) ex = await fetchExerciseDetails(id);
        const weighted = usesExternalWeight(ex?.equipment, ex?.name || id);
        loaded.push({
          exerciseId: ex?.id || id,
          name: ex?.name || id,
          image: ex?.gifUrl,
          targetMuscles: ex?.target || "",
          equipment: ex?.equipment,
          usesWeight: weighted,
          sets: [{ reps: 10, weight: weighted ? 20 : undefined, done: false }],
        });
      }
      if (active) setExercises(loaded);
    };
    loadDraft();
    return () => { active = false; };
  }, [mounted, draft, draftRoutine, exercises.length, timedItems.length]);

  useEffect(() => {
    if (!sessionRunning) return;
    const t = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(t);
  }, [sessionRunning]);

  useEffect(() => {
    if (!restTimer?.running) return;
    const t = window.setInterval(() => {
      setRestTimer((current) => {
        if (!current) return null;
        const next = Math.max(0, current.remaining - 1);
        return { ...current, remaining: next, running: next > 0 };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [restTimer?.running]);

  useEffect(() => {
    const hasRunningTimedItem = timedItems.some((item) => item.running);
    if (!hasRunningTimedItem) return;
    const t = window.setInterval(() => {
      setTimedItems((current) =>
        current.map((item) => {
          if (!item.running) return item;
          const next = Math.max(0, item.remaining - 1);
          return { ...item, remaining: next, running: next > 0, done: next === 0 ? true : item.done };
        }),
      );
    }, 1000);
    return () => window.clearInterval(t);
  }, [timedItems]);

  const lastFor = useMemo(() => {
    const map: Record<string, LoggedSet | undefined> = {};
    for (const ex of exercises) {
      for (const w of prevWorkouts) {
        const found = w.exercises.find((e) => e.exerciseId === ex.exerciseId);
        if (found) { map[ex.exerciseId] = found.sets[found.sets.length - 1]; break; }
      }
    }
    return map;
  }, [exercises, prevWorkouts]);

  const update = (ei: number, si: number, patch: Partial<LoggedSet>) => {
    const exercise = exercises[ei];
    const wasDone = Boolean(exercise?.sets[si]?.done);
    const willBeDone = patch.done === true;
    const shouldStartRest = Boolean(exercise?.restTimer && willBeDone && !wasDone && si < exercise.sets.length - 1);
    setExercises((prev) => prev.map((e, i) => i === ei ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, ...patch } : s) } : e));
    if (shouldStartRest && exercise?.restTimer) {
      setRestTimer({
        total: exercise.restTimer,
        remaining: exercise.restTimer,
        running: true,
        label: `${exercise.name} · Set ${si + 1} complete`,
      });
    }
  };

  const addSet = (ei: number) =>
    setExercises((prev) => prev.map((e, i) => {
      if (i !== ei) return e;
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { reps: last?.reps ?? 10, weight: e.usesWeight === false ? undefined : last?.weight ?? 20, done: false }] };
    }));

  const updateTimedItem = (id: string, patch: Partial<TimedRoutineItem>) =>
    setTimedItems((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));

  const resetTimedItem = (id: string) =>
    setTimedItems((prev) => prev.map((item) => item.id === id ? { ...item, remaining: item.duration, running: false, done: false } : item));

  const [addQ, setAddQ] = useState("");
  const [addList, setAddList] = useState<any[]>([]);
  
  useEffect(() => {
    if (!showAdd) return;
    let active = true;
    fetchExerciseList(addQ).then(res => {
      if (active) setAddList(res.data);
    });
    return () => { active = false; };
  }, [addQ, showAdd]);

  const addExercise = (ex: any) => {
    const weighted = usesExternalWeight(ex.equipment, ex.name);
    setExercises((prev) => [...prev, {
      exerciseId: ex.id, name: ex.name, image: ex.gifUrl, targetMuscles: ex.target || "", equipment: ex.equipment, usesWeight: weighted,
      sets: [{ reps: 10, weight: weighted ? 20 : undefined, done: false }],
    }]);
    setShowAdd(false);
  };

  const volume = exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).reduce((b, s) => b + s.reps * (s.weight || 0), 0), 0);
  const completedSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
  const completedExercises = exercises.filter((e) => e.sets.some((s) => s.done)).length;
  const completedTimedItems = timedItems.filter((item) => item.done).length;

  const finish = () => {
    const completed = exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length);
    if (completed.length > 0) {
      addWorkout({
        id: uid(),
        date: todayISO(),
        name: sessionName || (draftRoutine ? `${draftRoutine.routineName} · ${draftRoutine.dayLabel}` : workoutName(exercises)),
        durationMin: Math.max(1, Math.round(seconds / 60)),
        rpe: 7,
        volume,
        notes: draftRoutine ? `Completed from routine: ${draftRoutine.routineName}` : undefined,
        exercises: completed,
      });
    }
    const completedAsanas = timedItems.filter((item) => item.type === "asana" && (item.done || draftRoutine));
    if (completedAsanas.length > 0) {
      addYoga({
        id: uid(),
        date: todayISO(),
        flowName: draftRoutine ? `${draftRoutine.routineName} · ${draftRoutine.dayLabel}` : "Routine Poses",
        type: "routine",
        durationMin: Math.max(1, Math.round(completedAsanas.reduce((sum, item) => sum + item.duration, 0) / 60)),
        posesCount: completedAsanas.length,
      });
    }
    timedItems.filter((item) => item.type === "pranayama" && (item.done || draftRoutine)).forEach((item) => {
      addBreath({
        id: uid(),
        date: todayISO(),
        techniqueId: item.refId,
        techniqueName: item.name,
        durationSec: item.duration,
        completed: true,
      });
    });
    if (typeof window !== "undefined") window.sessionStorage.removeItem(LIBRARY_TRY_KEY);
    clearDraft();
    router.replace("/home");
  };

  const closeSession = () => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(LIBRARY_TRY_KEY);
    clearDraft();
    router.replace(returnTo);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const overload = lastFor[exercises[0]?.exerciseId];

  return (
    <main style={shell}>
      {/* header */}
      <header className="glass" style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid rgba(115,253,156,0.08)" }}>
        <button className="btn btn-secondary" onClick={() => setShowDiscard(true)} aria-label="Discard session" style={{ minHeight: 36, padding: "7px 10px", fontSize: 12 }}>
          <IconClose width={14} height={14} /> Discard
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>{sessionName || (draftRoutine ? draftRoutine.routineName : "Active Workout")}</div>
          <div className="text-mono seafoam row center gap-xs" style={{ fontSize: 13 }}><IconTimer width={13} height={13} />{mm}:{ss}</div>
        </div>
        <button className="btn btn-primary" style={{ minHeight: 38, padding: "8px 16px", fontSize: 14 }} onClick={() => setDone(true)}>Finish</button>
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: `18px 16px ${restTimer ? 128 : 40}px`, width: "100%" }}>
        <SessionTimerCard
          seconds={seconds}
          running={sessionRunning}
          onToggle={() => setSessionRunning((value) => !value)}
          onReset={() => setSeconds(0)}
        />

        {/* progressive overload */}
        {overload && exercises[0]?.usesWeight !== false && (
          <div className="card" style={{ marginBottom: 18, display: "flex", gap: 12, background: "linear-gradient(135deg, var(--color-warning-soft-bg), transparent)", border: "1px solid var(--color-warning-soft-border)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-warning-soft-bg)", display: "grid", placeItems: "center", color: "var(--color-warning-soft)", flexShrink: 0 }}>
              <IconTrend width={20} height={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--color-warning-soft)" }}>Progressive Overload</div>
              <p className="secondary" style={{ fontSize: 13.5, marginTop: 2, lineHeight: 1.5 }}>
                Last time on {exercises[0]?.name}: <b style={{ color: "var(--color-text-primary)" }}>{overload.weight ?? 0}kg × {overload.reps}</b>.
                Try {((overload.weight ?? 0) + 2.5).toFixed(1)}kg today, or an extra rep.
              </p>
            </div>
          </div>
        )}

        {/* exercises */}
        <div className="stack gap-md">
          {timedItems.map((item) => (
            <TimedRoutineCard
              key={item.id}
              item={item}
              onToggle={() => updateTimedItem(item.id, { running: !item.running && item.remaining > 0 })}
              onReset={() => resetTimedItem(item.id)}
              onDone={() => updateTimedItem(item.id, { done: !item.done, running: false, remaining: item.done ? item.duration : 0 })}
            />
          ))}

          {exercises.map((ex, ei) => (
            <motion.div key={ei} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: 16 }}>
                <Link
                  href={`/library/train/${encodeURIComponent(ex.exerciseId)}`}
                  style={{
                    color: "inherit",
                    display: "grid",
                    gridTemplateColumns: ex.image ? "58px 1fr" : "1fr",
                    alignItems: "center",
                    gap: 12,
                    maxWidth: "100%",
                    textDecoration: "none",
                    marginBottom: 12,
                  }}
                >
                  {ex.image && (
                    <span style={{ width: 54, height: 54, borderRadius: 12, background: "#fff", overflow: "hidden", display: "grid", placeItems: "center" }}>
                      {/\.(mp4|webm|mov)(\?|$)/i.test(ex.image) ? (
                        <video src={ex.image} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <img src={ex.image} alt={ex.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      )}
                    </span>
                  )}
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        color: "var(--color-mint-active)",
                        display: "block",
                        fontWeight: 800,
                        fontSize: 17,
                        textTransform: "capitalize",
                      }}
                    >
                      {ex.name}
                    </span>
                    <span className="text-caption" style={{ display: "block", marginTop: 2 }}>
                      {ex.usesWeight === false ? "Bodyweight / no KG needed" : `Target: ${ex.targetMuscles || "Strength"}`}
                    </span>
                  </span>
                </Link>
                {ex.restTimer ? (
                  <div className="pill" style={{ marginBottom: 12 }}>
                    <IconTimer width={13} height={13} /> Break {ex.restTimer >= 60 ? `${Math.round(ex.restTimer / 60)} min` : `${ex.restTimer}s`} between sets
                  </div>
                ) : null}

                <div style={{ display: "grid", gridTemplateColumns: ex.usesWeight === false ? "40px 1fr 48px" : "40px 1fr 1fr 48px", gap: 8, alignItems: "center" }}>
                  <Head>Set</Head>{ex.usesWeight !== false && <Head>KG</Head>}<Head>Reps</Head><Head><IconCheck width={14} height={14}/></Head>
                  {ex.sets.map((s, si) => (
                    <SetRow key={si} n={si + 1} s={s} usesWeight={ex.usesWeight !== false} onChange={(p) => update(ei, si, p)} />
                  ))}
                </div>

                <button onClick={() => addSet(ei)} className="btn btn-ghost" style={{ width: "100%", marginTop: 10, border: "1px dashed var(--color-text-muted)", borderRadius: 10 }}>
                  <IconPlus width={16} height={16} /> Add set
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)} className="card card-interactive" style={{ width: "100%", marginTop: 16, display: "flex", justifyContent: "center", gap: 8, color: "#73fd9c", fontWeight: 600, padding: 16 }}>
          <IconPlus width={20} height={20} /> Add Exercise
        </button>

        <div className="row between" style={{ marginTop: 20, padding: "0 4px" }}>
          <span className="text-caption">Volume</span>
          <span className="text-mono" style={{ fontWeight: 700 }}>{volume.toLocaleString()} kg · {completedSets} sets · {completedExercises} exercises</span>
        </div>
      </div>

      {/* Add exercise sheet */}
      <AnimatePresence>
        {restTimer && (
          <FloatingRestTimer
            timer={restTimer}
            onToggle={() => setRestTimer((current) => current ? { ...current, running: !current.running && current.remaining > 0 } : current)}
            onReset={() => setRestTimer((current) => current ? { ...current, remaining: current.total, running: false } : current)}
            onSkip={() => setRestTimer(null)}
          />
        )}
      </AnimatePresence>

      {/* Discard session */}
      <AnimatePresence>
        {showDiscard && (
          <CenterModal onClose={() => setShowDiscard(false)} title="Discard session?">
            <div className="stack gap-sm">
              <p className="secondary" style={{ lineHeight: 1.55 }}>
                This will leave the active routine without saving completed sets, pose timers, or breathing timers.
              </p>
              <button className="btn btn-primary btn-block" onClick={closeSession}>
                Discard Routine
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => setShowDiscard(false)}>
                Keep Going
              </button>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <Sheet onClose={() => setShowAdd(false)} title="Add Exercise">
            <div className="stack gap-sm" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <input className="input" placeholder="Search..." value={addQ} onChange={e => setAddQ(e.target.value)} style={{ width: "100%", marginBottom: 12, padding: "8px 12px" }} />
              {addList.map((e) => (
                <button key={e.id} className="card card-interactive" onClick={() => addExercise(e)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <div>
                    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{e.name}</div>
                    <div className="text-caption" style={{ textTransform: "capitalize" }}>{e.target}</div>
                  </div>
                  <IconPlus width={18} height={18} style={{ color: "#73fd9c" }} />
                </button>
              ))}
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Finish summary */}
      <AnimatePresence>
        {done && (
          <CenterModal onClose={() => setDone(false)} title="Workout complete">
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 12 }}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(115,253,156,0.14)", display: "grid", placeItems: "center", margin: "0 auto 16px", boxShadow: "var(--glow-mint)" }}>
                <IconCheck width={36} height={36} style={{ color: "#73fd9c" }} />
              </motion.div>
              <div className="row" style={{ justifyContent: "space-around", margin: "16px 0" }}>
                <Metric label="Duration" value={`${Math.max(1, Math.round(seconds/60))}m`} />
                <Metric label="Volume" value={`${volume.toLocaleString()}kg`} />
                <Metric label="Done" value={`${completedExercises + completedTimedItems}`} />
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={finish} disabled={completedSets === 0 && completedTimedItems === 0}>Finish</button>
            </div>
          </CenterModal>
        )}
      </AnimatePresence>
    </main>
  );
}

function workoutName(ex: LoggedExercise[]) {
  const id = ex[0]?.exerciseId || "";
  if (/squat|deadlift|lunge|glute/.test(id)) return "Lower Body";
  if (/bench|press|push|dip/.test(id)) return "Upper Body Power";
  if (/row|pull|curl/.test(id)) return "Pull Session";
  return "Full Body";
}

function Head({ children }: { children: React.ReactNode }) {
  return <div className="text-mono" style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", textAlign: "center", letterSpacing: "0.06em" }}>{children}</div>;
}

function SetRow({ n, s, usesWeight, onChange }: { n: number; s: LoggedSet; usesWeight: boolean; onChange: (p: Partial<LoggedSet>) => void }) {
  return (
    <>
      <div className="text-mono" style={{ textAlign: "center", color: s.done ? "#73fd9c" : "var(--color-text-secondary)", fontWeight: 600 }}>{n}</div>
      {usesWeight && <input className="input" inputMode="decimal" value={s.weight ?? ""} onChange={(e) => onChange({ weight: Number(e.target.value) || undefined })}
        style={{ padding: "9px 8px", textAlign: "center", fontFamily: "var(--font-mono)" }} />}
      <input className="input" inputMode="numeric" value={s.reps} onChange={(e) => onChange({ reps: Number(e.target.value) || 0 })}
        style={{ padding: "9px 8px", textAlign: "center", fontFamily: "var(--font-mono)" }} />
      <button onClick={() => onChange({ done: !s.done })} aria-label="Mark set done" style={{
        height: 38, borderRadius: 9, border: s.done ? "none" : "1px solid var(--color-text-muted)",
        background: s.done ? "var(--color-mint-active)" : "var(--color-surface-main)", color: "var(--color-on-primary)",
        display: "grid", placeItems: "center", transition: "all .15s",
      }}>
        {s.done && <IconCheck width={16} height={16} />}
      </button>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: "#73fd9c" }}>{value}</div>
      <div className="text-caption">{label}</div>
    </div>
  );
}

function SessionTimerCard({
  seconds,
  running,
  onToggle,
  onReset,
}: {
  seconds: number;
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <section className="card" style={{ marginBottom: 18, padding: 14, display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
      <div>
        <div className="uppercase-label">Routine Stopwatch</div>
        <div className="text-caption" style={{ marginTop: 3 }}>{running ? "Counting active session time" : "Paused"}</div>
      </div>
      <div className="row gap-xs" style={{ justifyContent: "flex-end" }}>
        <span className="text-mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--color-mint-active)", minWidth: 70, textAlign: "right" }}>
          {mm}:{ss}
        </span>
        <button className="icon-btn" onClick={onToggle} aria-label={running ? "Pause stopwatch" : "Start stopwatch"} title={running ? "Pause" : "Start"} style={{ width: 36, height: 36 }}>
          {running ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
        </button>
        <button className="btn btn-secondary" onClick={onReset} style={{ minHeight: 36, padding: "7px 10px", fontSize: 12 }}>
          Reset
        </button>
      </div>
    </section>
  );
}

function TimedRoutineCard({
  item,
  onToggle,
  onReset,
  onDone,
}: {
  item: TimedRoutineItem;
  onToggle: () => void;
  onReset: () => void;
  onDone: () => void;
}) {
  const mm = String(Math.floor(item.remaining / 60)).padStart(2, "0");
  const ss = String(item.remaining % 60).padStart(2, "0");
  const progress = item.duration > 0 ? ((item.duration - item.remaining) / item.duration) * 100 : 100;
  const color = item.type === "asana" ? "var(--color-yoga)" : "var(--color-train)";
  const href = item.type === "asana" ? `/library/yoga/${encodeURIComponent(item.refId)}` : `/library/breathe/${encodeURIComponent(item.refId)}`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 16 }}>
      <div className="row between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <Link href={href} style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, color: "inherit", textDecoration: "none" }}>
          {item.image ? (
            <span style={{ width: 48, height: 48, borderRadius: 12, background: "#fff", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </span>
          ) : (
            <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--color-surface-main)", color, display: "grid", placeItems: "center", flexShrink: 0 }}>
              {item.type === "asana" ? <IconYoga width={19} height={19} /> : <IconBreathe width={19} height={19} />}
            </span>
          )}
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 800, color }}>{item.name}</span>
            <div className="text-caption" style={{ marginTop: 2 }}>{item.type === "asana" ? "Pose hold timer" : "Breathing session timer"}</div>
          </span>
        </Link>
        <div className="text-mono" style={{ fontSize: 24, fontWeight: 800, color }}>
          {item.done ? "Done" : `${mm}:${ss}`}
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--color-surface-3)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: color, transition: "width .25s ease" }} />
      </div>
      <div className="row gap-sm">
        <button className="btn btn-primary" style={{ flex: 1, minHeight: 38 }} onClick={onToggle} disabled={item.done || item.remaining === 0}>
          {item.running ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
          {item.running ? "Pause" : "Start"}
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, minHeight: 38 }} onClick={onReset}>
          Reset
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, minHeight: 38 }} onClick={onDone}>
          {item.done ? "Undo" : "Done"}
        </button>
      </div>
    </motion.div>
  );
}

function FloatingRestTimer({
  timer,
  onToggle,
  onReset,
  onSkip,
}: {
  timer: { total: number; remaining: number; running: boolean; label: string };
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}) {
  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
  const ss = String(timer.remaining % 60).padStart(2, "0");
  const progress = timer.total > 0 ? ((timer.total - timer.remaining) / timer.total) * 100 : 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="glass"
      style={{
        position: "fixed",
        left: 14,
        right: 14,
        bottom: "calc(14px + env(safe-area-inset-bottom))",
        width: "auto",
        maxWidth: 520,
        margin: "0 auto",
        zIndex: 390,
        padding: 12,
        borderRadius: 16,
        boxShadow: "0 18px 46px rgba(0,0,0,0.42)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div className="row between" style={{ gap: 10, alignItems: "center" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-xs" style={{ minWidth: 0 }}>
            <IconTimer width={14} height={14} style={{ color: "var(--color-mint-active)", flexShrink: 0 }} />
            <span className="uppercase-label">Rest</span>
            <span className="text-caption" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {timer.label}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--color-surface-3)", overflow: "hidden", marginTop: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: "var(--color-mint-active)", transition: "width .25s ease" }} />
          </div>
        </div>
        <div className="text-mono" style={{ fontSize: 24, fontWeight: 850, color: timer.remaining === 0 ? "var(--color-mint-active)" : "var(--color-train)", minWidth: 72, textAlign: "right" }}>
          {timer.remaining === 0 ? "Ready" : `${mm}:${ss}`}
        </div>
      </div>
      <div className="row gap-xs" style={{ marginTop: 10 }}>
        <button className="btn btn-primary" style={{ flex: 1, minHeight: 34, padding: "6px 9px", fontSize: 12 }} onClick={onToggle} disabled={timer.remaining === 0}>
          {timer.running ? <IconPause width={14} height={14} /> : <IconPlay width={14} height={14} />}
          {timer.running ? "Pause" : "Resume"}
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, minHeight: 34, padding: "6px 9px", fontSize: 12 }} onClick={onReset}>
          Reset
        </button>
        <button className="btn btn-secondary" style={{ flex: 1, minHeight: 34, padding: "6px 9px", fontSize: 12 }} onClick={onSkip}>
          Skip
        </button>
      </div>
    </motion.section>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(4,8,6,0.6)", zIndex: 400 }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="glass" style={{ position: "fixed", inset: "auto 0 0 0", margin: "0 auto", width: "100%", maxWidth: 520, zIndex: 401,
          borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "10px 18px calc(24px + env(safe-area-inset-bottom))", borderBottom: "none" }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--color-surface-3)", margin: "6px auto 14px" }} />
        <h3 className="section-title" style={{ fontSize: 18 }}>{title}</h3>
        {children}
      </motion.div>
    </>
  );
}

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
        <div className="row between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
          <h3 className="section-title" style={{ fontSize: 18, margin: 0 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close discard dialog" style={{ width: 34, height: 34 }}>
            <IconClose width={15} height={15} />
          </button>
        </div>
        {children}
      </motion.div>
    </>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh", position: "fixed", inset: 0, zIndex: 300, overflowY: "auto",
  background: "var(--color-surface-main)",
};
