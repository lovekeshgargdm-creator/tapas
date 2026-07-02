"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchExerciseList } from "@/app/actions/exercise";
import { AppHeader } from "@/components/AppHeader";
import { ASANAS, TECHNIQUES } from "@/lib/seed";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useStore, uid, todayISO } from "@/lib/store";
import {
  IconSearch, IconPlus,
  IconDumbbell,
  IconTrash, IconClose, IconPlay,
} from "@/components/Icons";
import type { WeeklyRoutine, DayRoutine, DayOfWeek, RoutineItem } from "@/lib/types";

const DAYS_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const todayRoutineDay = () => ((new Date().getDay() + 6) % 7) as DayOfWeek;

function cloneRoutineItem(item: RoutineItem): RoutineItem {
  return {
    ...item,
    id: uid(),
    sets: item.sets.map((set) => ({ ...set, id: uid() })),
  };
}

export default function TrainPage() {
  const router = useRouter();
  const setDraft = useStore((s) => s.setDraft);
  const weeklyRoutines = useStore((s) => s.weeklyRoutines);
  const saveWeeklyRoutine = useStore((s) => s.saveWeeklyRoutine);
  const deleteWeeklyRoutine = useStore((s) => s.deleteWeeklyRoutine);

  const [routineSearch, setRoutineSearch] = useState("");

  // Routine builder
  const [buildingRoutine, setBuildingRoutine] = useState(false);
  const [routineName, setRoutineName] = useState("My Routine");
  const [allSameDay, setAllSameDay] = useState(false);
  const [dayRoutines, setDayRoutines] = useState<DayRoutine[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day: i as DayOfWeek,
      timeOfDay: "any",
      items: [],
      enabled: i < 5,
    }))
  );
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [addItemMode, setAddItemMode] = useState<"exercise" | "asana" | "pranayama" | null>(null);

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

  const addItemToDay = (day: DayOfWeek, item: RoutineItem) => {
    if (allSameDay) {
      setDayRoutines((prev) => prev.map((dr) => dr.day === day ? { ...dr, items: [...dr.items, item] } : dr));
    } else {
      setDayRoutines((prev) => prev.map((dr) => dr.day === day ? { ...dr, items: [...dr.items, item] } : dr));
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
    const routine: WeeklyRoutine = {
      id: uid(),
      name: routineName,
      module: "combined",
      days,
      createdAt: todayISO(),
      updatedAt: todayISO(),
    };
    saveWeeklyRoutine(routine);
    setBuildingRoutine(false);
    setDayRoutines(Array.from({ length: 7 }, (_, i) => ({ day: i as DayOfWeek, timeOfDay: "any", items: [], enabled: i < 5 })));
    setRoutineName("My Routine");
    setEditingDay(null);
    setAddItemMode(null);
  };

  const useRoutine = (routine: WeeklyRoutine) => {
    const today = todayRoutineDay();
    const plan = routine.days.find((day) => day.enabled && day.day === today) || routine.days.find((day) => day.enabled);
    if (!plan || plan.items.length === 0) return;
    const exerciseIds = plan.items.filter((item) => item.type === "exercise").map((item) => item.refId);
    if (exerciseIds.length > 0) {
      setDraft(exerciseIds);
      router.push("/workout/active");
      return;
    }
    const firstAsana = plan.items.find((item) => item.type === "asana");
    if (firstAsana) {
      router.push(`/player/yoga?asana=${encodeURIComponent(firstAsana.refId)}&return=/routine`);
      return;
    }
    const firstPranayama = plan.items.find((item) => item.type === "pranayama");
    if (firstPranayama) {
      router.push(`/player/breathe?technique=${encodeURIComponent(firstPranayama.refId)}&duration=5&return=/routine`);
    }
  };

  const visibleRoutines = weeklyRoutines
    .filter((r) => r.module === "train" || r.module === "combined" || r.module === "yoga")
    .filter((r) => r.name.toLowerCase().includes(routineSearch.toLowerCase()));


  return (
    <div className="page">
      <AppHeader title="Routine" subtitle="Build training and yoga together" accent="#73fd9c" />

        <div>
          {!buildingRoutine ? (
            <>
              <button
                className="btn btn-primary btn-block"
                style={{ marginBottom: 20 }}
                onClick={() => setBuildingRoutine(true)}
              >
                <IconPlus width={18} height={18} /> Create Routine
              </button>

              {weeklyRoutines.length > 5 && (
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input className="input input-with-icon" placeholder="Search routines..." value={routineSearch} onChange={(event) => setRoutineSearch(event.target.value)} />
                </div>
              )}

              {visibleRoutines.length === 0 ? (
                <div className="clay" style={{ padding: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>🏋️</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>No routines yet</div>
                  <div className="text-caption">Build a weekly training schedule — different workouts per day or the same plan all week. You can also include yoga sessions!</div>
                </div>
              ) : (
                <div className="stack gap-md">
                  {visibleRoutines.map((r) => (
                    <TrainRoutineCard key={r.id} routine={r} onUse={() => useRoutine(r)} onDelete={() => deleteWeeklyRoutine(r.id)} />
                  ))}
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
              onAddItem={addItemToDay}
              onRemoveItem={removeItemFromDay}
              editingDay={editingDay}
              setEditingDay={setEditingDay}
              addItemMode={addItemMode}
              setAddItemMode={setAddItemMode}
              onSave={saveRoutine}
              onCancel={() => { setBuildingRoutine(false); setEditingDay(null); setAddItemMode(null); }}
            />
          )}
        </div>

    </div>
  );
}

// ─── Train Routine Builder ───
function TrainRoutineBuilder({
  name, setName, allSame, setAllSame,
  dayRoutines, onToggleDay, onUpdateItem,
  onAddItem, onRemoveItem,
  editingDay, setEditingDay,
  addItemMode, setAddItemMode,
  onSave, onCancel,
}: {
  name: string; setName: (s: string) => void;
  allSame: boolean; setAllSame: (b: boolean) => void;
  dayRoutines: DayRoutine[];
  onToggleDay: (d: DayOfWeek) => void;
  onUpdateItem: (d: DayOfWeek, id: string, updates: Partial<RoutineItem>) => void;
  onAddItem: (d: DayOfWeek, item: RoutineItem) => void;
  onRemoveItem: (d: DayOfWeek, id: string) => void;
  editingDay: DayOfWeek | null; setEditingDay: (d: DayOfWeek | null) => void;
  addItemMode: "exercise" | "asana" | "pranayama" | null; setAddItemMode: (t: "exercise" | "asana" | "pranayama" | null) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const [addQ, setAddQ] = useState("");
  const [addYogaQ, setAddYogaQ] = useState("");
  const [addBp, setAddBp] = useState("all");
  const [addList, setAddList] = useState<any[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addCursor, setAddCursor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (addItemMode !== "exercise") return;
    setAddLoading(true);
    fetchExerciseList(addQ, addBp).then(res => {
      if (active) {
        setAddList(res.data);
        setAddCursor(res.nextCursor);
        setAddLoading(false);
      }
    });
    return () => { active = false; };
  }, [addItemMode, addQ, addBp]);

  const loadMoreAdd = () => {
    if (!addCursor || addLoading) return;
    setAddLoading(true);
    fetchExerciseList(addQ, addBp, addCursor).then(res => {
      setAddList(prev => [...prev, ...res.data]);
      setAddCursor(res.nextCursor);
      setAddLoading(false);
    });
  };

  const asanaList = ASANAS.filter((asana) =>
    `${asana.nameEnglish} ${asana.nameSanskrit}`.toLowerCase().includes(addYogaQ.toLowerCase()),
  ).slice(0, 16);
  const pranayamaList = TECHNIQUES.filter((technique) =>
    `${technique.name} ${technique.nameSanskrit}`.toLowerCase().includes(addYogaQ.toLowerCase()),
  );

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{allSame ? "All Days" : DAYS_LABELS[dr.day]}</div>
          </div>

          {dr.items.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {dr.items.map((item) => (
                <div key={item.id} className="card" style={{ marginBottom: 10, padding: 12, background: "var(--color-surface-main)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(115,253,156,0.1)", color: "var(--color-mint-active)", display: "grid", placeItems: "center" }}>
                        {item.type === "exercise" ? <IconDumbbell width={18} height={18} /> : "🧘"}
                      </div>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{item.name}</span>
                    </div>
                    <button onClick={() => onRemoveItem(dr.day, item.id)} style={{ background: "none", border: "none", color: "var(--color-status-error)", cursor: "pointer", padding: 4 }}>
                      <IconClose width={16} height={16} />
                    </button>
                  </div>

                  {item.type === "exercise" ? (
                    <div>
                      {/* Sets Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr", gap: 8, fontSize: 10.5, color: "var(--color-text-muted)", fontWeight: 700, marginBottom: 6, padding: "0 4px" }}>
                        <div style={{ textAlign: "center" }}>SET</div>
                        <div style={{ textAlign: "center" }}>KG</div>
                        <div style={{ textAlign: "center" }}>REPS</div>
                      </div>
                      {/* Sets Rows */}
                      {item.sets.map((set, sIdx) => (
                        <div key={set.id} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "6px 0" }}>{sIdx + 1}</div>
                          <input className="input" style={{ padding: "6px", fontSize: 13, textAlign: "center", minHeight: 32, background: "var(--color-surface-3)", border: "none" }} placeholder="-" type="number" value={set.weight || ""} 
                            onChange={e => {
                              const newSets = [...item.sets];
                              newSets[sIdx] = { ...set, weight: parseInt(clampNumericInput(e.target.value, LIMITS.setWeight), 10) || undefined };
                              onUpdateItem(dr.day, item.id, { sets: newSets });
                            }} />
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
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <input className="input" style={{ flex: 1, padding: "8px", fontSize: 13, textAlign: "center", minHeight: 36, background: "var(--color-surface-3)", border: "none" }} placeholder="Duration (Secs)" type="number" 
                        value={item.sets[0]?.duration || ""} 
                        onChange={e => {
                          const newSets = [{ id: item.sets[0]?.id || uid(), duration: parseInt(clampNumericInput(e.target.value, LIMITS.durationSec), 10) || undefined }];
                          onUpdateItem(dr.day, item.id, { sets: newSets });
                        }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {editingDay === dr.day ? (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto" }}>
                <button className={`chip ${addItemMode === "exercise" ? "active" : ""}`} onClick={() => setAddItemMode("exercise")}>Exercises</button>
                <button className={`chip ${addItemMode === "asana" ? "active" : ""}`} onClick={() => setAddItemMode("asana")}>Asanas</button>
                <button className={`chip ${addItemMode === "pranayama" ? "active" : ""}`} onClick={() => setAddItemMode("pranayama")}>Pranayama</button>
                <button className="chip" onClick={() => { setEditingDay(null); setAddItemMode(null); }}>Done</button>
              </div>
              {addItemMode === "exercise" && (
                <div style={{ paddingBottom: 10 }}>
                  <input className="input" placeholder="Search exercises..." value={addQ} onChange={e => setAddQ(e.target.value)} style={{ width: "100%", marginBottom: 10, fontSize: 13, padding: "8px 12px", minHeight: 32 }} />
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                    {["all", "chest", "back", "shoulders", "upper arms", "lower arms", "waist", "upper legs", "lower legs", "cardio"].map(bp => (
                      <button key={bp} onClick={() => setAddBp(bp)} style={{ whiteSpace: "nowrap", padding: "4px 10px", borderRadius: 999, border: "none", fontSize: 11, fontWeight: 600, textTransform: "capitalize", background: addBp === bp ? "var(--color-mint-active)" : "var(--color-surface-3)", color: addBp === bp ? "#000" : "var(--color-text-primary)" }}>{bp}</button>
                    ))}
                  </div>
                  <div className="stack gap-xs" style={{ maxHeight: 240, overflowY: "auto" }}>
                    {addList.map((e) => (
                      <button key={e.id} onClick={() => onAddItem(dr.day, { id: uid(), type: "exercise", refId: e.id, name: e.name, sets: [{ id: uid() }], restTimer: 0 })}
                        className="card card-interactive"
                        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, textAlign: "left", padding: 10, fontSize: 13.5, textTransform: "capitalize" }}>
                        <span>
                          <span style={{ display: "block", fontWeight: 700 }}>{e.name}</span>
                          <span className="text-caption">{e.bodyPart || e.equipment}</span>
                        </span>
                        <IconPlus width={15} height={15} />
                      </button>
                    ))}
                    {addLoading && <div style={{ padding: 10, textAlign: "center", fontSize: 12, color: "var(--color-text-muted)" }}>Loading...</div>}
                    {addCursor && !addLoading && <button onClick={loadMoreAdd} className="btn btn-secondary btn-block" style={{ minHeight: 36, fontSize: 12 }}>Load More</button>}
                  </div>
                </div>
              )}
              {(addItemMode === "asana" || addItemMode === "pranayama") && (
                <div>
                  <input className="input" placeholder={`Search ${addItemMode === "asana" ? "asanas" : "pranayama"}...`} value={addYogaQ} onChange={e => setAddYogaQ(e.target.value)} style={{ width: "100%", marginBottom: 10, fontSize: 13, padding: "8px 12px", minHeight: 32 }} />
                  <div className="stack gap-xs" style={{ maxHeight: 240, overflowY: "auto" }}>
                    {addItemMode === "asana" && asanaList.map((a) => (
                      <button key={a.id} onClick={() => onAddItem(dr.day, { id: uid(), type: "asana", refId: a.id, name: a.nameEnglish, sets: [{ id: uid(), duration: a.holdSeconds.intermediate }], restTimer: 0 })}
                        className="card card-interactive"
                        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, textAlign: "left", padding: 10, fontSize: 13.5 }}>
                        <span>
                          <span style={{ display: "block", fontWeight: 700 }}>{a.nameEnglish}</span>
                          <span className="text-caption">{a.nameSanskrit} · {a.holdSeconds.intermediate}s</span>
                        </span>
                        <IconPlus width={15} height={15} />
                      </button>
                    ))}
                    {addItemMode === "pranayama" && pranayamaList.map((t) => (
                      <button key={t.id} onClick={() => onAddItem(dr.day, { id: uid(), type: "pranayama", refId: t.id, name: t.name, sets: [{ id: uid(), duration: 300 }], restTimer: 0 })}
                        className="card card-interactive"
                        style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, textAlign: "left", padding: 10, fontSize: 13.5 }}>
                        <span>
                          <span style={{ display: "block", fontWeight: 700 }}>{t.name}</span>
                          <span className="text-caption">{t.nameSanskrit} · {t.ratio.inhale}:{t.ratio.holdIn}:{t.ratio.exhale}</span>
                        </span>
                        <IconPlus width={15} height={15} />
                      </button>
                    ))}
                    {((addItemMode === "asana" && asanaList.length === 0) || (addItemMode === "pranayama" && pranayamaList.length === 0)) && (
                      <p className="text-caption" style={{ textAlign: "center", padding: 12 }}>No matches found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px", width: "100%" }}
              onClick={() => { setEditingDay(dr.day); setAddItemMode("exercise"); }}>
              <IconPlus width={14} height={14} /> Add exercise, asana, or pranayama
            </button>
          )}
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave}>Save Routine</button>
      </div>
    </div>
  );
}

function TrainRoutineCard({ routine, onUse, onDelete }: { routine: WeeklyRoutine; onUse: () => void; onDelete: () => void }) {
  const enabledDays = routine.days.filter((d) => d.enabled);
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{routine.name}</div>
          <div className="text-caption" style={{ marginTop: 2 }}>{enabledDays.length} active days · {routine.module === "combined" ? "Yoga + Train" : "Training"}</div>
        </div>
        <button className="icon-btn" onClick={onDelete} style={{ width: 32, height: 32, color: "var(--color-status-error)" }}>
          <IconTrash width={15} height={15} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {DAYS_LABELS.map((label, i) => {
          const dr = routine.days.find((d) => d.day === i);
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 8, fontSize: 10, fontWeight: 700,
              background: dr?.enabled ? "rgba(115,253,156,0.15)" : "var(--color-surface-main)",
              color: dr?.enabled ? "var(--color-mint-active)" : "var(--color-text-muted)" }}>
              {label}
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onUse}>
        <IconPlay width={16} height={16} /> Use Today
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)",
  textTransform: "uppercase", letterSpacing: "0.08em",
};
