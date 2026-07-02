"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetchExerciseById, fetchExerciseDetails, fetchExerciseList } from "@/app/actions/exercise";
import { useStore, uid, todayISO } from "@/lib/store";
import { IconClose, IconPlus, IconCheck, IconTrend, IconTimer } from "@/components/Icons";
import type { LoggedExercise, LoggedSet } from "@/lib/types";

const DEFAULT_IDS = ["push up", "plank"];

export default function ActiveWorkout() {
  const router = useRouter();
  const draft = useStore((s) => s.draftExercises);
  const clearDraft = useStore((s) => s.clearDraft);
  const addWorkout = useStore((s) => s.addWorkout);
  const prevWorkouts = useStore((s) => s.workouts);

  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const startRef = useRef(0);

  // Build the session from draft (or a sensible default)
  useEffect(() => {
    let active = true;
    const loadDraft = async () => {
      const ids = draft.length ? draft : DEFAULT_IDS;
      const loaded: LoggedExercise[] = [];
      for (const id of ids) {
        let ex = await fetchExerciseById(id);
        if (!ex) ex = await fetchExerciseDetails(id);
        loaded.push({
          exerciseId: ex?.id || id,
          name: ex?.name || id,
          targetMuscles: ex?.target || "",
          sets: [{ reps: 10, weight: 20, done: false }],
        });
      }
      if (active) setExercises(loaded);
    };
    loadDraft();
    startRef.current = Date.now();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

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

  const update = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    setExercises((prev) => prev.map((e, i) => i === ei ? { ...e, sets: e.sets.map((s, j) => j === si ? { ...s, ...patch } : s) } : e));

  const addSet = (ei: number) =>
    setExercises((prev) => prev.map((e, i) => {
      if (i !== ei) return e;
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { reps: last?.reps ?? 10, weight: last?.weight ?? 20, done: false }] };
    }));

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
    setExercises((prev) => [...prev, {
      exerciseId: ex.id, name: ex.name, targetMuscles: ex.target || "",
      sets: [{ reps: 10, weight: 20, done: false }],
    }]);
    setShowAdd(false);
  };

  const volume = exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).reduce((b, s) => b + s.reps * s.weight, 0), 0);
  const completedSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);

  const finish = () => {
    addWorkout({
      id: uid(), date: todayISO(), name: workoutName(exercises), durationMin: Math.max(1, Math.round(seconds / 60)),
      rpe: 7, volume, exercises: exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })).filter((e) => e.sets.length),
    });
    clearDraft();
    router.replace("/home");
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const overload = lastFor[exercises[0]?.exerciseId];

  return (
    <main style={shell}>
      {/* header */}
      <header className="glass" style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "calc(12px + env(safe-area-inset-top)) 16px 12px", borderBottom: "1px solid rgba(115,253,156,0.08)" }}>
        <button className="icon-btn" onClick={() => router.replace("/routine")} aria-label="Close"><IconClose /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700 }}>Active Workout</div>
          <div className="text-mono seafoam row center gap-xs" style={{ fontSize: 13 }}><IconTimer width={13} height={13} />{mm}:{ss}</div>
        </div>
        <button className="btn btn-primary" style={{ minHeight: 38, padding: "8px 16px", fontSize: 14 }} onClick={() => setDone(true)}>Finish</button>
      </header>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 16px 40px", width: "100%" }}>
        {/* progressive overload */}
        {overload && (
          <div className="card" style={{ marginBottom: 18, display: "flex", gap: 12, background: "linear-gradient(135deg, rgba(253,185,116,0.1), transparent)", border: "1px solid rgba(253,185,116,0.22)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(253,185,116,0.18)", display: "grid", placeItems: "center", color: "#fdb974", flexShrink: 0 }}>
              <IconTrend width={20} height={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fdb974" }}>Progressive Overload</div>
              <p className="secondary" style={{ fontSize: 13.5, marginTop: 2, lineHeight: 1.5 }}>
                Last time on {exercises[0]?.name}: <b style={{ color: "var(--color-text-primary)" }}>{overload.weight}kg × {overload.reps}</b>.
                Try {(overload.weight + 2.5).toFixed(1)}kg today, or an extra rep.
              </p>
            </div>
          </div>
        )}

        {/* exercises */}
        <div className="stack gap-md">
          {exercises.map((ex, ei) => (
            <motion.div key={ei} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg,#73fd9c,#2ee5b5)" }} />
              <div style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{ex.name}</div>
                <div className="text-caption" style={{ marginBottom: 12 }}>Target: {ex.targetMuscles}</div>

                <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 48px", gap: 8, alignItems: "center" }}>
                  <Head>Set</Head><Head>KG</Head><Head>Reps</Head><Head>✓</Head>
                  {ex.sets.map((s, si) => (
                    <SetRow key={si} n={si + 1} s={s} onChange={(p) => update(ei, si, p)} />
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
          <span className="text-mono" style={{ fontWeight: 700 }}>{volume.toLocaleString()} kg · {completedSets} sets</span>
        </div>
      </div>

      {/* Add exercise sheet */}
      <AnimatePresence>
        {showAdd && (
          <Sheet onClose={() => setShowAdd(false)} title="Add exercise">
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
          <Sheet onClose={() => setDone(false)} title="Workout complete">
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 12 }}
                style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(115,253,156,0.14)", display: "grid", placeItems: "center", margin: "0 auto 16px", boxShadow: "var(--glow-mint)" }}>
                <IconCheck width={36} height={36} style={{ color: "#73fd9c" }} />
              </motion.div>
              <div className="row" style={{ justifyContent: "space-around", margin: "16px 0" }}>
                <Metric label="Duration" value={`${Math.max(1, Math.round(seconds/60))}m`} />
                <Metric label="Volume" value={`${volume.toLocaleString()}kg`} />
                <Metric label="Sets" value={`${completedSets}`} />
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={finish}>Save workout</button>
            </div>
          </Sheet>
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

function SetRow({ n, s, onChange }: { n: number; s: LoggedSet; onChange: (p: Partial<LoggedSet>) => void }) {
  return (
    <>
      <div className="text-mono" style={{ textAlign: "center", color: s.done ? "#73fd9c" : "var(--color-text-secondary)", fontWeight: 600 }}>{n}</div>
      <input className="input" inputMode="decimal" value={s.weight} onChange={(e) => onChange({ weight: Number(e.target.value) || 0 })}
        style={{ padding: "9px 8px", textAlign: "center", fontFamily: "var(--font-mono)" }} />
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

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(4,8,6,0.6)", zIndex: 400 }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="glass" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 0, width: "min(520px,100%)", zIndex: 401,
          borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "10px 18px calc(24px + env(safe-area-inset-bottom))", borderBottom: "none" }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--color-surface-3)", margin: "6px auto 14px" }} />
        <h3 className="section-title" style={{ fontSize: 18 }}>{title}</h3>
        {children}
      </motion.div>
    </>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh", position: "fixed", inset: 0, zIndex: 300, overflowY: "auto",
  background: "var(--color-surface-main)",
};
