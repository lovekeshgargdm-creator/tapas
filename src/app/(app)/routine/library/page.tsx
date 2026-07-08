"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchExerciseList, type ExerciseDbExercise } from "@/app/actions/exercise";
import { fetchYogaPoseMediaMap, type YogaPoseMedia } from "@/app/actions/yoga";
import { BackHeader } from "@/components/BackHeader";
import {
  IconBreathe,
  IconCheck,
  IconDumbbell,
  IconPlus,
  IconSearch,
  IconYoga,
} from "@/components/Icons";
import { ASANAS, TECHNIQUES } from "@/lib/seed";
import { uid } from "@/lib/store";
import type { DayOfWeek, RoutineItem } from "@/lib/types";

type PickerTab = "exercise" | "asana" | "pranayama";
type Candidate = {
  key: string;
  type: PickerTab;
  refId: string;
  name: string;
  subtitle: string;
  image?: string;
  equipment?: string;
  usesWeight?: boolean;
  duration?: number;
};

const ROUTINE_SELECTION_KEY = "tapas-routine-library-selection";
const TABS: { id: PickerTab; label: string; Icon: React.FC<{ width?: number; height?: number }> }[] = [
  { id: "exercise", label: "Train", Icon: IconDumbbell },
  { id: "asana", label: "Yoga", Icon: IconYoga },
  { id: "pranayama", label: "Breathe", Icon: IconBreathe },
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

const formatDuration = (seconds?: number) => {
  const value = seconds || 0;
  if (value >= 60 && value % 60 === 0) return `${value / 60} min`;
  if (value >= 60) return `${Math.floor(value / 60)}m ${value % 60}s`;
  return `${value || 0}s`;
};

const makeRoutineItem = (candidate: Candidate): RoutineItem => ({
  id: uid(),
  type: candidate.type,
  refId: candidate.refId,
  name: candidate.name,
  image: candidate.image,
  equipment: candidate.equipment,
  usesWeight: candidate.usesWeight,
  sets:
    candidate.type === "exercise"
      ? [{ id: uid(), reps: 10, weight: undefined }]
      : [{ id: uid(), duration: candidate.duration }],
  restTimer: 0,
});

export default function RoutineLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const day = Number(searchParams.get("day") || 0) as DayOfWeek;
  const [tab, setTab] = useState<PickerTab>("exercise");
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("all");
  const [trainList, setTrainList] = useState<ExerciseDbExercise[]>([]);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainCursor, setTrainCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, Candidate>>({});
  const [showFilter, setShowFilter] = useState<"category" | "equipment" | null>(null);
  const [equipment, setEquipment] = useState("all");
  const [poseMedia, setPoseMedia] = useState<Record<string, YogaPoseMedia>>({});
  const [poseMediaLoaded, setPoseMediaLoaded] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "exercise" || mode === "asana" || mode === "pranayama") setTab(mode);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    if (tab !== "exercise") return;
    setTrainLoading(true);
    fetchExerciseList(query, bodyPart, "", 20, equipment).then((res) => {
      if (!active) return;
      setTrainList(res.data);
      setTrainCursor(res.nextCursor);
      setTrainLoading(false);
    });
    return () => {
      active = false;
    };
  }, [query, bodyPart, equipment, tab]);

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

  const exerciseCandidates = useMemo(
    () =>
      trainList.map((item) => {
        const weighted = usesExternalWeight(item.equipment, item.name);
        return {
          key: `exercise:${item.id}`,
          type: "exercise" as const,
          refId: item.id,
          name: item.name,
          subtitle: `${item.bodyPart || item.equipment} · ${weighted ? "weighted" : "bodyweight/no KG"}`,
          image: item.gifUrl,
          equipment: item.equipment,
          usesWeight: weighted,
        };
      }),
    [trainList],
  );

  const poseCandidates = useMemo(
    () =>
      ASANAS.filter((asana) =>
        poseMedia[asana.id]?.image &&
        `${asana.nameEnglish} ${asana.nameSanskrit}`.toLowerCase().includes(query.toLowerCase()),
      ).map((asana) => ({
        key: `asana:${asana.id}`,
        type: "asana" as const,
        refId: asana.id,
        name: asana.nameEnglish,
        subtitle: `${asana.nameSanskrit} · hold ${formatDuration(asana.holdSeconds.intermediate)}`,
        image: poseMedia[asana.id]?.image,
        duration: asana.holdSeconds.intermediate,
      })),
    [poseMedia, query],
  );

  const pranayamaCandidates = useMemo(
    () =>
      TECHNIQUES.filter((technique) =>
        `${technique.name} ${technique.nameSanskrit}`.toLowerCase().includes(query.toLowerCase()),
      ).map((technique) => ({
        key: `pranayama:${technique.id}`,
        type: "pranayama" as const,
        refId: technique.id,
        name: technique.name,
        subtitle: `${technique.nameSanskrit} · 5 min · ratio ${technique.ratio.inhale}:${technique.ratio.holdIn}:${technique.ratio.exhale}:${technique.ratio.holdOut}`,
        duration: 300,
      })),
    [query],
  );

  const candidates =
    tab === "exercise" ? exerciseCandidates : tab === "asana" ? poseCandidates : pranayamaCandidates;
  const selectedItems = Object.values(selected);

  const loadMoreTrain = () => {
    if (!trainCursor || trainLoading) return;
    setTrainLoading(true);
    fetchExerciseList(query, bodyPart, trainCursor, 20, equipment).then((res) => {
      setTrainList((prev) => [...prev, ...res.data]);
      setTrainCursor(res.nextCursor);
      setTrainLoading(false);
    });
  };

  const toggleSelected = (candidate: Candidate) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[candidate.key]) delete next[candidate.key];
      else next[candidate.key] = candidate;
      return next;
    });
  };

  const finishSelection = () => {
    if (selectedItems.length === 0 || typeof window === "undefined") return;
    window.sessionStorage.setItem(
      ROUTINE_SELECTION_KEY,
      JSON.stringify({
        day,
        items: selectedItems.map(makeRoutineItem),
      }),
    );
    router.replace("/routine?restore=routine-library");
  };

  return (
    <div className="page" style={{ paddingBottom: 220 }}>
      <BackHeader title="Select from Library" fallback="/routine?restore=routine-library" />

      <section className="clay" style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`chip ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
              style={{ minHeight: 48, padding: "8px 6px", justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}
            >
              <Icon width={15} height={15} /> {label}
            </button>
          ))}
        </div>
      </section>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input
          className="input input-with-icon"
          placeholder={`Search ${tab === "exercise" ? "training" : tab === "asana" ? "poses" : "breathing"}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {tab === "exercise" && (
        <div className="clay" style={{ padding: 12, marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button className="card card-interactive" onClick={() => setShowFilter("category")} style={{ padding: "10px 12px", textAlign: "left", minWidth: 0 }}>
            <span className="uppercase-label">Category</span>
            <span style={{ display: "block", fontWeight: 750, textTransform: "capitalize", marginTop: 3, color: "var(--color-mint-active)" }}>{bodyPart}</span>
          </button>
          <button className="card card-interactive" onClick={() => setShowFilter("equipment")} style={{ padding: "10px 12px", textAlign: "left", minWidth: 0 }}>
            <span className="uppercase-label">Equipment</span>
            <span style={{ display: "block", fontWeight: 750, marginTop: 3, color: "var(--color-mint-active)" }}>{EQUIPMENT_LABELS[equipment]}</span>
          </button>
        </div>
      )}

      <div className="stack gap-sm">
        {candidates.map((candidate) => (
          <SelectableLibraryRow
            key={candidate.key}
            item={candidate}
            selected={Boolean(selected[candidate.key])}
            onToggle={() => toggleSelected(candidate)}
          />
        ))}
        {tab === "exercise" && trainLoading && (
          <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>Loading...</div>
        )}
        {tab === "asana" && !poseMediaLoaded && (
          <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>Loading poses...</div>
        )}
        {tab === "exercise" && trainCursor && !trainLoading && (
          <button className="btn btn-secondary btn-block" onClick={loadMoreTrain}>
            Load More
          </button>
        )}
        {candidates.length === 0 && !trainLoading && (
          <section className="card" style={{ textAlign: "center" }}>
            <p className="text-caption">No library items match this search.</p>
          </section>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(96px + env(safe-area-inset-bottom))",
          zIndex: 120,
          padding: "12px 20px calc(18px + env(safe-area-inset-bottom))",
          background: "linear-gradient(180deg, rgba(14,21,15,0), var(--color-background) 24%)",
        }}
      >
        <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
          <div className="clay" style={{ padding: "10px 12px" }}>
            <div style={{ fontWeight: 800 }}>{selectedItems.length} selected</div>
            <div className="text-caption">Add multiple items to this routine day</div>
          </div>
          <button className="btn btn-primary" onClick={finishSelection} disabled={selectedItems.length === 0} style={{ minHeight: 48, paddingInline: 18 }}>
            <IconPlus width={17} height={17} /> Add
          </button>
        </div>
      </div>
      {showFilter === "category" && (
        <FilterSheet
          title="Exercise Category"
          value={bodyPart}
          options={BODY_PARTS}
          getLabel={(part) => part}
          onPick={(next) => {
            setBodyPart(next);
            setShowFilter(null);
          }}
          onClose={() => setShowFilter(null)}
        />
      )}
      {showFilter === "equipment" && (
        <FilterSheet
          title="Equipment"
          value={equipment}
          options={EQUIPMENT_OPTIONS}
          getLabel={(item) => EQUIPMENT_LABELS[item] || item}
          onPick={(next) => {
            setEquipment(next);
            setShowFilter(null);
          }}
          onClose={() => setShowFilter(null)}
        />
      )}
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

function SelectableLibraryRow({
  item,
  selected,
  onToggle,
}: {
  item: Candidate;
  selected: boolean;
  onToggle: () => void;
}) {
  const color = item.type === "exercise" ? "var(--color-train)" : item.type === "asana" ? "var(--color-yoga)" : "var(--color-train)";
  return (
    <button
      className="card card-interactive"
      onClick={onToggle}
      aria-pressed={selected}
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: 12,
        textAlign: "left",
        border: selected ? "1px solid rgba(115,253,156,0.62)" : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {item.image ? (
        <div style={{ width: 54, height: 54, borderRadius: 10, background: "#fff", overflow: "hidden", display: "grid", placeItems: "center" }}>
          <img src={item.image} alt={item.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : (
        <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--color-surface-main)", color, display: "grid", placeItems: "center" }}>
          {item.type === "exercise" ? <IconDumbbell width={20} height={20} /> : item.type === "asana" ? <IconYoga width={20} height={20} /> : <IconBreathe width={20} height={20} />}
        </div>
      )}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 750, textTransform: item.type === "exercise" ? "capitalize" : "none" }}>{item.name}</span>
        <span className="text-caption" style={{ display: "block", marginTop: 3, textTransform: item.type === "exercise" ? "capitalize" : "none" }}>{item.subtitle}</span>
      </span>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: selected ? "var(--color-mint-active)" : "var(--color-surface-3)",
          color: selected ? "#061014" : "var(--color-text-muted)",
          flexShrink: 0,
        }}
      >
        {selected ? <IconCheck width={16} height={16} /> : <IconPlus width={16} height={16} />}
      </span>
    </button>
  );
}
