"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchExerciseList, type ExerciseDbExercise } from "@/app/actions/exercise";
import { fetchYogaPoseMediaMap, type YogaPoseMedia } from "@/app/actions/yoga";
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
  image?: string;
  equipment?: string;
  usesWeight?: boolean;
  duration?: number;
};

const TABS: { id: TabKey; label: string; Icon: React.FC<{ width?: number; height?: number }> }[] = [
  { id: "train", label: "Train", Icon: IconDumbbell },
  { id: "yoga", label: "Yoga", Icon: IconYoga },
  { id: "breathe", label: "Breathe", Icon: IconPatterns },
];
const BODY_PARTS = ["all", "chest", "back", "shoulders", "biceps", "triceps", "abs", "quads", "hamstrings", "glutes", "calves", "forearms"];
const EQUIPMENT_OPTIONS = ["all", "bodyweight", "dumbbell", "kettlebell", "barbell", "band", "cable", "machine", "no_machine"];
const EQUIPMENT_LABELS: Record<string, string> = {
  all: "All equipment",
  bodyweight: "Bodyweight",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  barbell: "Barbell",
  band: "Resistance band",
  cable: "Cable",
  machine: "Machine",
  no_machine: "No machines",
};

const usesExternalWeight = (equipment?: string, name?: string) => {
  const text = `${equipment || ""} ${name || ""}`.toLowerCase();
  if (/body weight|bodyweight|none|assisted|band|resistance band/.test(text)) return false;
  if (/push[- ]?up|pull[- ]?up|chin[- ]?up|plank|crunch|sit[- ]?up|burpee|mountain climber/.test(text)) return false;
  return true;
};

export default function LibraryPage() {
  const mounted = useMounted();
  const weeklyRoutines = useStore((s) => s.weeklyRoutines);
  const saveWeeklyRoutine = useStore((s) => s.saveWeeklyRoutine);
  const [tab, setTab] = useState<TabKey>("train");
  const [q, setQ] = useState("");
  const [routineItem, setRoutineItem] = useState<RoutineCandidate | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState("");
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([todayRoutineDay()]);
  const [savedMessage, setSavedMessage] = useState("");
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false);

  // Dynamic exercises state
  const [trainList, setTrainList] = useState<ExerciseDbExercise[]>([]);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainCursor, setTrainCursor] = useState<string | null>(null);
  const [bodyPart, setBodyPart] = useState("all");
  const [equipment, setEquipment] = useState("all");
  const [poseMedia, setPoseMedia] = useState<Record<string, YogaPoseMedia>>({});
  const [poseMediaLoaded, setPoseMediaLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("tab");
    if (next === "train" || next === "yoga" || next === "breathe") setTab(next);
  }, []);

  const switchTab = (next: TabKey) => {
    setTab(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  useEffect(() => {
    let active = true;
    if (tab !== "train") return;
    
    setTrainLoading(true);
    fetchExerciseList(q, bodyPart, "", 20, equipment).then(res => {
      if (active) {
        setTrainList(res.data);
        setTrainCursor(res.nextCursor);
        setTrainLoading(false);
      }
    });
    return () => { active = false; };
  }, [q, bodyPart, equipment, tab]);

  const loadMoreTrain = () => {
    if (!trainCursor || trainLoading) return;
    setTrainLoading(true);
    fetchExerciseList(q, bodyPart, trainCursor, 20, equipment).then(res => {
      setTrainList(prev => [...prev, ...res.data]);
      setTrainCursor(res.nextCursor);
      setTrainLoading(false);
    });
  };

  useEffect(() => {
    let active = true;
    fetchYogaPoseMediaMap().then((media) => {
      if (active) {
        setPoseMedia(media);
        setPoseMediaLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const yogaList = ASANAS
    .filter((a) => poseMedia[a.id]?.image)
    .filter(a => a.nameEnglish.toLowerCase().includes(q.toLowerCase()) || a.nameSanskrit.toLowerCase().includes(q.toLowerCase()));
  const breatheList = TECHNIQUES.filter(t => t.name.toLowerCase().includes(q.toLowerCase()));

  const openRoutineSheet = (item: RoutineCandidate) => {
    setRoutineItem(item);
    setSelectedRoutineId(weeklyRoutines[0]?.id || "");
    setSelectedDays([todayRoutineDay()]);
    setSavedMessage("");
  };

  const itemToRoutineItem = (item: RoutineCandidate): RoutineItem => ({
    id: uid(),
    type: item.kind,
    refId: item.refId,
    name: item.name,
    image: item.image,
    equipment: item.equipment,
    usesWeight: item.usesWeight,
    sets:
      item.kind === "exercise"
        ? [{ id: uid(), reps: 10, weight: undefined }]
        : [{ id: uid(), duration: item.duration }],
    restTimer: 0,
  });

  const addToExistingRoutine = () => {
    if (!routineItem || !selectedRoutineId) return;
    const routine = weeklyRoutines.find((item) => item.id === selectedRoutineId);
    if (!routine) return;
    if (selectedDays.length === 0) return;
    const hasExercise = routineItem.kind === "exercise" || routine.days.some((day) => day.items.some((item) => item.type === "exercise"));
    const hasYoga = routineItem.kind !== "exercise" || routine.days.some((day) => day.items.some((item) => item.type !== "exercise"));
    const selected = new Set<DayOfWeek>(selectedDays);
    saveWeeklyRoutine({
      ...routine,
      module: hasExercise && hasYoga ? "combined" : hasExercise ? "train" : "yoga",
      days: routine.days.map((day) =>
        selected.has(day.day)
          ? { ...day, enabled: true, items: [...day.items, itemToRoutineItem(routineItem)] }
          : day,
      ),
      updatedAt: todayISO(),
    });
    setSavedMessage(`Added to ${selectedDays.length} day${selectedDays.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <AppHeader title="Library" subtitle="Train, yoga, and breathing" />

      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "var(--color-surface-main)", borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
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
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="input input-with-icon" placeholder="Search library…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {tab === "train" && (
        <div className="clay" style={{ padding: 12, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button className="card card-interactive" onClick={() => setShowCategoryFilter(true)} style={{ padding: "10px 12px", textAlign: "left", minWidth: 0 }}>
            <span className="uppercase-label">Category</span>
            <span style={{ display: "block", fontWeight: 750, textTransform: "capitalize", marginTop: 3 }}>{bodyPart}</span>
          </button>
          <button className="card card-interactive" onClick={() => setShowEquipmentFilter(true)} style={{ padding: "10px 12px", textAlign: "left", minWidth: 0 }}>
            <span className="uppercase-label">Equipment</span>
            <span style={{ display: "block", fontWeight: 750, marginTop: 3 }}>{EQUIPMENT_LABELS[equipment]}</span>
          </button>
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
            color="var(--color-train)"
            onAdd={() => openRoutineSheet({ kind: "exercise", refId: item.id, name: item.name, image: item.gifUrl, equipment: item.equipment, usesWeight: usesExternalWeight(item.equipment, item.name) })}
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
            image={poseMedia[item.id]?.image}
            icon={<IconYoga width={20} height={20} />}
            color="var(--color-yoga)"
            onAdd={() => openRoutineSheet({ kind: "asana", refId: item.id, name: item.nameEnglish, image: poseMedia[item.id]?.image, duration: item.holdSeconds.intermediate })}
          />
        ))}
        {tab === "yoga" && !poseMediaLoaded && (
          <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>Loading poses…</div>
        )}
        {tab === "yoga" && poseMediaLoaded && yogaList.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>No poses found.</div>
        )}
        {tab === "breathe" && breatheList.map(item => (
          <LibraryCard
            key={item.id}
            href={`/library/breathe/${encodeURIComponent(item.id)}`}
            title={item.name}
            subtitle={`${item.ratio.inhale}:${item.ratio.holdIn}:${item.ratio.exhale} ratio`}
            icon={<IconPatterns width={20} height={20} />}
            color="var(--color-breathe)"
            onAdd={() => openRoutineSheet({ kind: "pranayama", refId: item.id, name: item.name, duration: 300 })}
          />
        ))}
      </div>
      {routineItem && (
        <RoutineSheet
          item={routineItem}
          routines={weeklyRoutines}
          selectedRoutineId={selectedRoutineId}
          setSelectedRoutineId={setSelectedRoutineId}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          savedMessage={savedMessage}
          onAddExisting={addToExistingRoutine}
          onClose={() => setRoutineItem(null)}
        />
      )}
      {showCategoryFilter && (
        <FilterSheet
          title="Exercise Category"
          value={bodyPart}
          options={BODY_PARTS}
          getLabel={(part) => part}
          onPick={(next) => {
            setBodyPart(next);
            setShowCategoryFilter(false);
          }}
          onClose={() => setShowCategoryFilter(false)}
        />
      )}
      {showEquipmentFilter && (
        <FilterSheet
          title="Equipment"
          value={equipment}
          options={EQUIPMENT_OPTIONS}
          getLabel={(item) => EQUIPMENT_LABELS[item] || item}
          onPick={(next) => {
            setEquipment(next);
            setShowEquipmentFilter(false);
          }}
          onClose={() => setShowEquipmentFilter(false)}
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
            <img src={image} alt={title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, minWidth: 148 }}>
        <Link href={href} className="btn btn-secondary" aria-label={`View ${title} details`} title="View details" style={{ minHeight: 32, padding: "6px 9px", fontSize: 12, justifyContent: "center" }}>
          View <IconArrowRight width={13} height={13} />
        </Link>
        <button
          className="btn btn-primary"
          onClick={onAdd}
          aria-label={`Add ${title} to routine`}
          title="Add to routine"
          style={{ minHeight: 32, padding: "6px 9px", fontSize: 12, justifyContent: "center" }}
        >
          Routine <IconPlus width={13} height={13} />
        </button>
      </div>
    </div>
  );
}

function RoutineSheet({
  item,
  routines,
  selectedRoutineId,
  setSelectedRoutineId,
  selectedDays,
  setSelectedDays,
  savedMessage,
  onAddExisting,
  onClose,
}: {
  item: RoutineCandidate;
  routines: WeeklyRoutine[];
  selectedRoutineId: string;
  setSelectedRoutineId: (value: string) => void;
  selectedDays: DayOfWeek[];
  setSelectedDays: (value: DayOfWeek[]) => void;
  savedMessage: string;
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
            <h3 className="uppercase-label" style={{ marginBottom: 10 }}>Existing routine only</h3>
            {routines.length > 0 ? (
              <>
                <select className="input" value={selectedRoutineId} onChange={(event) => setSelectedRoutineId(event.target.value)}>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>{routine.name}</option>
                  ))}
                </select>
                <DayPicker selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
                <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }} onClick={onAddExisting} disabled={!selectedRoutineId || selectedDays.length === 0}>
                  Add to Routine
                </button>
              </>
            ) : (
              <div>
                <p className="text-caption" style={{ marginBottom: 12 }}>
                  No existing routines yet. Build a full routine from the Routine tab first, then add library items here.
                </p>
                <Link href="/routine" className="btn btn-primary btn-block" onClick={onClose}>
                  Go to Routine
                </Link>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function FilterSheet({ title, value, options, getLabel, onPick, onClose }: { title: string; value: string; options: string[]; getLabel: (value: string) => string; onPick: (value: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "grid", alignItems: "end", background: "rgba(4,8,6,0.65)" }} onClick={onClose}>
      <section className="glass" style={{ width: "min(520px, 100%)", margin: "0 auto", padding: "18px 20px calc(28px + env(safe-area-inset-bottom))", borderTopLeftRadius: 18, borderTopRightRadius: 18 }} onClick={(event) => event.stopPropagation()}>
        <div className="row between" style={{ gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
            <p className="text-caption" style={{ marginTop: 2 }}>Choose one filter</p>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ minHeight: 34, padding: "6px 12px", fontSize: 13 }}>
            Done
          </button>
        </div>
        <div className="stack gap-xs" style={{ maxHeight: "56vh", overflowY: "auto" }}>
          {options.map((part) => (
            <button
              key={part}
              className={`card card-interactive ${value === part ? "pill-active" : ""}`}
              onClick={() => onPick(part)}
              style={{
                width: "100%",
                minHeight: 48,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                textTransform: "capitalize",
                border: value === part ? "1px solid rgba(115,253,156,0.55)" : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ fontWeight: 700 }}>{getLabel(part)}</span>
              {value === part && <IconCheck width={17} height={17} style={{ color: "var(--color-mint-active)" }} />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function DayPicker({ selectedDays, setSelectedDays }: { selectedDays: DayOfWeek[]; setSelectedDays: (value: DayOfWeek[]) => void }) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const allDays = labels.map((_, index) => index as DayOfWeek);
  const allSelected = selectedDays.length === 7;
  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(
      selectedDays.includes(day)
        ? selectedDays.filter((item) => item !== day)
        : [...selectedDays, day].sort((a, b) => a - b),
    );
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className={`chip ${allSelected ? "active" : ""}`}
        onClick={() => setSelectedDays(allSelected ? [] : allDays)}
        style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}
      >
        All 7 Days
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
        {labels.map((label, index) => {
          const day = index as DayOfWeek;
          return (
        <button
          key={label}
          className={`chip ${selectedDays.includes(day) ? "active" : ""}`}
          onClick={() => toggleDay(day)}
          style={{ justifyContent: "center", paddingInline: 0 }}
        >
          {label}
        </button>
          );
        })}
      </div>
    </div>
  );
}
