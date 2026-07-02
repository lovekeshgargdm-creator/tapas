"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchExerciseList, type ExerciseDbExercise } from "@/app/actions/exercise";
import { AppHeader } from "@/components/AppHeader";
import { ASANAS, TECHNIQUES } from "@/lib/seed";
import { uid, todayISO, useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconSearch, IconDumbbell, IconYoga, IconPatterns, IconArrowRight, IconPlus, IconCheck } from "@/components/Icons";
import type { DayOfWeek, RoutineItem, WeeklyRoutine } from "@/lib/types";

type TabKey = "train" | "yoga" | "breathe";
type RoutineCandidate = {
  kind: RoutineItem["type"];
  refId: string;
  name: string;
  duration?: number;
};

const TABS: { id: TabKey; label: string; Icon: React.FC<{ width?: number; height?: number }> }[] = [
  { id: "train", label: "Exercises", Icon: IconDumbbell },
  { id: "yoga", label: "Yoga Poses", Icon: IconYoga },
  { id: "breathe", label: "Pranayama", Icon: IconPatterns },
];

export default function LibraryPage() {
  const mounted = useMounted();
  const weeklyRoutines = useStore((s) => s.weeklyRoutines);
  const saveWeeklyRoutine = useStore((s) => s.saveWeeklyRoutine);
  const [tab, setTab] = useState<TabKey>("train");
  const [q, setQ] = useState("");
  const [routineItem, setRoutineItem] = useState<RoutineCandidate | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayRoutineDay());
  const [savedMessage, setSavedMessage] = useState("");

  // Dynamic exercises state
  const [trainList, setTrainList] = useState<ExerciseDbExercise[]>([]);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainCursor, setTrainCursor] = useState<string | null>(null);
  const [bodyPart, setBodyPart] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("tab");
    if (next === "train" || next === "yoga" || next === "breathe") setTab(next);
  }, []);

  useEffect(() => {
    let active = true;
    if (tab !== "train") return;
    
    setTrainLoading(true);
    fetchExerciseList(q, bodyPart).then(res => {
      if (active) {
        setTrainList(res.data);
        setTrainCursor(res.nextCursor);
        setTrainLoading(false);
      }
    });
    return () => { active = false; };
  }, [q, bodyPart, tab]);

  const loadMoreTrain = () => {
    if (!trainCursor || trainLoading) return;
    setTrainLoading(true);
    fetchExerciseList(q, bodyPart, trainCursor).then(res => {
      setTrainList(prev => [...prev, ...res.data]);
      setTrainCursor(res.nextCursor);
      setTrainLoading(false);
    });
  };

  const yogaList = ASANAS.filter(a => a.nameEnglish.toLowerCase().includes(q.toLowerCase()) || a.nameSanskrit.toLowerCase().includes(q.toLowerCase()));
  const breatheList = TECHNIQUES.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));

  const openRoutineSheet = (item: RoutineCandidate) => {
    setRoutineItem(item);
    setRoutineName(`${item.name} Routine`);
    setSelectedRoutineId(weeklyRoutines[0]?.id || "");
    setSelectedDay(todayRoutineDay());
    setSavedMessage("");
  };

  const itemToRoutineItem = (item: RoutineCandidate): RoutineItem => ({
    id: uid(),
    type: item.kind,
    refId: item.refId,
    name: item.name,
    sets: [{ id: uid(), duration: item.duration }],
    restTimer: 0,
  });

  const createRoutineFromItem = () => {
    if (!routineItem || !routineName.trim()) return;
    const days = Array.from({ length: 7 }, (_, i) => ({
      day: i as DayOfWeek,
      timeOfDay: "any" as const,
      enabled: i === selectedDay,
      items: i === selectedDay ? [itemToRoutineItem(routineItem)] : [],
    }));
    const routine: WeeklyRoutine = {
      id: uid(),
      name: routineName.trim(),
      module: routineItem.kind === "exercise" ? "train" : "yoga",
      days,
      createdAt: todayISO(),
      updatedAt: todayISO(),
    };
    saveWeeklyRoutine(routine);
    setSavedMessage("Routine created.");
  };

  const addToExistingRoutine = () => {
    if (!routineItem || !selectedRoutineId) return;
    const routine = weeklyRoutines.find((item) => item.id === selectedRoutineId);
    if (!routine) return;
    const nextItem = itemToRoutineItem(routineItem);
    const hasExercise = routineItem.kind === "exercise" || routine.days.some((day) => day.items.some((item) => item.type === "exercise"));
    const hasYoga = routineItem.kind !== "exercise" || routine.days.some((day) => day.items.some((item) => item.type !== "exercise"));
    saveWeeklyRoutine({
      ...routine,
      module: hasExercise && hasYoga ? "combined" : hasExercise ? "train" : "yoga",
      days: routine.days.map((day) =>
        day.day === selectedDay
          ? { ...day, enabled: true, items: [...day.items, nextItem] }
          : day,
      ),
      updatedAt: todayISO(),
    });
    setSavedMessage("Added to routine.");
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <AppHeader title="Library" subtitle="All movements and presets" />

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "var(--color-surface-main)", borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: "9px 0",
              borderRadius: 9,
              border: "none",
              fontWeight: 600,
              fontSize: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: tab === id ? "var(--color-surface-3)" : "transparent",
              color: tab === id ? "var(--color-mint-active)" : "var(--color-text-muted)",
              transition: "all .2s",
            }}
          >
            <Icon width={16} height={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input className="input input-with-icon" placeholder="Search library…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {tab === "train" && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, margin: "0 -20px", paddingLeft: 20, paddingRight: 20, scrollbarWidth: "none" }}>
          {["all", "chest", "back", "shoulders", "biceps", "triceps", "abs", "quads", "hamstrings", "glutes", "calves", "forearms"].map(bp => (
            <button 
              key={bp} 
              onClick={() => setBodyPart(bp)}
              style={{ 
                whiteSpace: "nowrap", 
                padding: "6px 14px", 
                borderRadius: 999, 
                border: "none",
                fontWeight: 600, 
                fontSize: 13,
                textTransform: "capitalize",
                background: bodyPart === bp ? "var(--color-mint-active)" : "var(--color-surface-3)",
                color: bodyPart === bp ? "#000" : "var(--color-text-primary)",
                transition: "all 0.2s"
              }}
            >
              {bp}
            </button>
          ))}
        </div>
      )}

      {/* Lists */}
      <div className="stack gap-sm">
        {tab === "train" && trainList.map(item => (
          <LibraryCard
            key={item.id}
            href={`/library/train/${encodeURIComponent(item.id)}`}
            title={item.name}
            subtitle={item.bodyPart}
            image={item.gifUrl}
            icon={<IconDumbbell width={20} height={20} />}
            color="#73fd9c"
            onAdd={() => openRoutineSheet({ kind: "exercise", refId: item.id, name: item.name })}
          />
        ))}
        {tab === "train" && trainList.length === 0 && !trainLoading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>No exercises found.</div>
        )}
        {tab === "train" && trainLoading && (
          <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>Loading...</div>
        )}
        {tab === "train" && trainCursor && !trainLoading && (
          <button onClick={loadMoreTrain} className="btn btn-secondary btn-block">Load More</button>
        )}
        
        {tab === "yoga" && yogaList.map(item => (
          <LibraryCard
            key={item.id}
            href={`/library/yoga/${encodeURIComponent(item.id)}`}
            title={item.nameEnglish}
            subtitle={item.nameSanskrit}
            icon={<IconYoga width={20} height={20} />}
            color="#2ee5b5"
            onAdd={() => openRoutineSheet({ kind: "asana", refId: item.id, name: item.nameEnglish, duration: item.holdSeconds.intermediate })}
          />
        ))}
        {tab === "breathe" && breatheList.map(item => (
          <LibraryCard
            key={item.id}
            href={`/library/breathe/${encodeURIComponent(item.id)}`}
            title={item.name}
            subtitle={`${item.ratio.inhale}:${item.ratio.holdIn}:${item.ratio.exhale} ratio`}
            icon={<IconPatterns width={20} height={20} />}
            color="#2ee5b5"
            onAdd={() => openRoutineSheet({ kind: "pranayama", refId: item.id, name: item.name, duration: 300 })}
          />
        ))}
      </div>
      {routineItem && (
        <RoutineSheet
          item={routineItem}
          routines={weeklyRoutines}
          routineName={routineName}
          setRoutineName={setRoutineName}
          selectedRoutineId={selectedRoutineId}
          setSelectedRoutineId={setSelectedRoutineId}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          savedMessage={savedMessage}
          onCreate={createRoutineFromItem}
          onAddExisting={addToExistingRoutine}
          onClose={() => setRoutineItem(null)}
        />
      )}
    </div>
  );
}

function todayRoutineDay() {
  return ((new Date().getDay() + 6) % 7) as DayOfWeek;
}

function LibraryCard({ href, title, subtitle, icon, color, image, onAdd }: { href: string; title: string; subtitle?: string; icon: React.ReactNode; color: string; image?: string; onAdd: () => void }) {
  return (
    <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, textAlign: "left", width: "100%", padding: 12 }}>
      <Link href={href} style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, color: "inherit", textDecoration: "none", flex: 1 }}>
        {image ? (
          <div style={{ width: 54, height: 54, borderRadius: 12, background: "#fff", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center" }}>
            <img src={image} alt={title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-surface-main)", display: "grid", placeItems: "center", color, flexShrink: 0 }}>
            {icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15.5, textTransform: "capitalize" }}>{title}</div>
          {subtitle && <div className="text-caption" style={{ marginTop: 2, textTransform: "capitalize" }}>{subtitle}</div>}
        </div>
      </Link>
      <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 6 }}>
        <button
          className="icon-btn"
          onClick={onAdd}
          aria-label={`Add ${title} to routine`}
          title="Add to routine"
          style={{ width: 36, height: 36, flexShrink: 0, color: "var(--color-mint-active)", background: "rgba(115,253,156,0.1)" }}
        >
          <IconPlus width={17} height={17} />
        </button>
        <Link href={href} className="icon-btn" aria-label={`View ${title} details`} title="View details" style={{ width: 36, height: 36, flexShrink: 0 }}>
          <IconArrowRight width={16} height={16} />
        </Link>
      </div>
    </div>
  );
}

function RoutineSheet({
  item,
  routines,
  routineName,
  setRoutineName,
  selectedRoutineId,
  setSelectedRoutineId,
  selectedDay,
  setSelectedDay,
  savedMessage,
  onCreate,
  onAddExisting,
  onClose,
}: {
  item: RoutineCandidate;
  routines: WeeklyRoutine[];
  routineName: string;
  setRoutineName: (value: string) => void;
  selectedRoutineId: string;
  setSelectedRoutineId: (value: string) => void;
  selectedDay: DayOfWeek;
  setSelectedDay: (value: DayOfWeek) => void;
  savedMessage: string;
  onCreate: () => void;
  onAddExisting: () => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "grid", alignItems: "end", background: "rgba(4,8,6,0.65)" }} onClick={onClose}>
      <section className="glass" style={{ width: "min(520px, 100%)", margin: "0 auto", padding: "18px 20px calc(28px + env(safe-area-inset-bottom))", borderTopLeftRadius: 18, borderTopRightRadius: 18 }} onClick={(event) => event.stopPropagation()}>
        <div className="row between" style={{ gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add to Routine</h2>
            <p className="text-caption" style={{ marginTop: 2 }}>{item.name}</p>
          </div>
          {savedMessage && (
            <span className="pill pill-active">
              <IconCheck width={13} height={13} /> {savedMessage}
            </span>
          )}
        </div>

        <div className="stack gap-md">
          <section className="card">
            <h3 className="uppercase-label" style={{ marginBottom: 10 }}>Create new routine</h3>
            <input className="input" value={routineName} onChange={(event) => setRoutineName(event.target.value)} />
            <DayPicker selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
            <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onCreate} disabled={!routineName.trim()}>
              Create Routine
            </button>
          </section>

          <section className="card">
            <h3 className="uppercase-label" style={{ marginBottom: 10 }}>Add to existing</h3>
            {routines.length > 0 ? (
              <>
                <select className="input" value={selectedRoutineId} onChange={(event) => setSelectedRoutineId(event.target.value)}>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>{routine.name}</option>
                  ))}
                </select>
                <DayPicker selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
                <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={onAddExisting} disabled={!selectedRoutineId}>
                  Add to Routine
                </button>
              </>
            ) : (
              <p className="text-caption">No existing routines yet.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function DayPicker({ selectedDay, setSelectedDay }: { selectedDay: DayOfWeek; setSelectedDay: (value: DayOfWeek) => void }) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginTop: 12 }}>
      {labels.map((label, index) => (
        <button
          key={label}
          className={`chip ${selectedDay === index ? "active" : ""}`}
          onClick={() => setSelectedDay(index as DayOfWeek)}
          style={{ justifyContent: "center", paddingInline: 0 }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
