"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchExerciseById, fetchExerciseDetails, type ExerciseDbExercise } from "@/app/actions/exercise";
import { fetchYogaPoseMediaMap, type YogaPoseMedia } from "@/app/actions/yoga";
import { BackHeader } from "@/components/BackHeader";
import { PoseArt } from "@/components/PoseArt";
import { asanaById, techniqueById } from "@/lib/seed";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { IconCheck, IconClose, IconDumbbell, IconPatterns, IconPause, IconPlay, IconYoga } from "@/components/Icons";
import type { Asana, PranayamaTechnique } from "@/lib/types";

const TRY_POSE_MAX_SECONDS = 120;
const TRY_PRANAYAM_MAX_MINUTES = 5;

const usesExternalWeight = (equipment?: string, name?: string) => {
  const text = `${equipment || ""} ${name || ""}`.toLowerCase();
  if (/body weight|bodyweight|none|assisted|band|resistance band/.test(text)) return false;
  if (/push[- ]?up|pull[- ]?up|chin[- ]?up|plank|crunch|sit[- ]?up|burpee|mountain climber/.test(text)) return false;
  return true;
};

export default function LibraryDetailPage() {
  const params = useParams();
  const type = String(params.type || "");
  const id = decodeURIComponent(String(params.id || ""));
  const [exercise, setExercise] = useState<ExerciseDbExercise | null>(null);
  const [loading, setLoading] = useState(type === "train");

  useEffect(() => {
    let active = true;
    if (type !== "train") return;
    setLoading(true);
    fetchExerciseById(id)
      .then((found) => found || fetchExerciseDetails(id))
      .then((found) => {
        if (active) {
          setExercise(found);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id, type]);

  if (type === "yoga") {
    const asana = asanaById(id);
    return <DetailShell title={asana?.nameEnglish || "Yoga Pose"} fallback="/library?tab=yoga">{asana ? <YogaDetail asana={asana} /> : <NotFound />}</DetailShell>;
  }

  if (type === "breathe") {
    const technique = techniqueById(id);
    return (
      <DetailShell title={technique?.name || "Breathing"} fallback="/library?tab=breathe">
        {technique ? <BreathDetail technique={technique} /> : <NotFound />}
      </DetailShell>
    );
  }

  return (
    <DetailShell title={exercise?.name || "Exercise"} fallback="/library?tab=train">
      {loading ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="text-caption">Loading...</p>
        </div>
      ) : exercise ? (
        <ExerciseDetail item={exercise} />
      ) : (
        <NotFound />
      )}
    </DetailShell>
  );
}

function DetailShell({ title, fallback, children }: { title: string; fallback: string; children: React.ReactNode }) {
  return (
    <div className="page">
      <BackHeader title={title} fallback={fallback} />
      {children}
    </div>
  );
}

function ExerciseDetail({ item }: { item: ExerciseDbExercise }) {
  const [frame, setFrame] = useState(0);
  const weighted = usesExternalWeight(item.equipment, item.name);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState(weighted ? "20" : "");
  const [trying, setTrying] = useState(false);
  const frames = item.images.length > 0 ? item.images : item.gifUrl ? [item.gifUrl] : [];

  useEffect(() => {
    if (frames.length < 2) return;
    const timer = setInterval(() => setFrame((current) => (current + 1) % frames.length), 900);
    return () => clearInterval(timer);
  }, [frames.length]);

  const count = Math.max(1, Math.min(20, parseInt(sets, 10) || 1));

  return (
    <div className="stack gap-md">
      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        {frames.length > 0 ? (
          <div
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              maxHeight: "min(62vh, 460px)",
              minHeight: 240,
              background: "#fff",
              position: "relative",
            }}
          >
            {frames.map((src, index) => (
              <img
                key={src}
                src={src}
                alt={item.name}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  opacity: index === frame ? 1 : 0,
                  transition: "opacity .35s ease",
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{ height: 160, display: "grid", placeItems: "center", color: "var(--color-mint-active)" }}>
            <IconDumbbell width={56} height={56} />
          </div>
        )}
        <div style={{ padding: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, textTransform: "capitalize", letterSpacing: 0 }}>{item.name}</h1>
          <p className="text-caption" style={{ marginTop: 4, textTransform: "capitalize" }}>
            {item.bodyPart} - {item.equipment}
          </p>
        </div>
      </section>

      <section className="card">
        <SectionTitle>Start Exercise</SectionTitle>
        <div className="stack gap-sm">
          <div style={{ display: "grid", gridTemplateColumns: weighted ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
            <NumberField label="Sets" value={sets} onChange={(value) => setSets(clampNumericInput(value, 20))} />
            <NumberField label="Reps" value={reps} onChange={(value) => setReps(clampNumericInput(value, LIMITS.reps))} />
            {weighted && (
              <NumberField label="KG" value={weight} onChange={(value) => setWeight(clampNumericInput(value, LIMITS.setWeight, { decimal: true }))} />
            )}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => setTrying(true)}>
            <IconPlay width={17} height={17} /> Start Exercise
          </button>
        </div>
      </section>
      {trying && (
        <ExerciseTryModal
          name={item.name}
          usesWeight={weighted}
          sets={count}
          reps={parseInt(reps, 10) || 10}
          weight={weighted ? parseFloat(weight) || undefined : undefined}
          onClose={() => setTrying(false)}
        />
      )}

      <section className="card">
        <SectionTitle>Target Muscles</SectionTitle>
        <div className="row gap-sm wrap">
          {item.target && <span className="pill pill-active">{item.target}</span>}
          {item.secondaryMuscles.map((muscle) => (
            <span className="pill" key={muscle}>
              {muscle}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <SectionTitle>How To</SectionTitle>
        {item.instructions.length > 0 ? (
          <ol style={{ paddingLeft: 20, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            {item.instructions.map((step, index) => (
              <li key={index} style={{ marginBottom: 10 }}>
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="secondary">Instructions unavailable. Move slowly and keep the target muscle engaged.</p>
        )}
      </section>
    </div>
  );
}

function YogaDetail({ asana }: { asana: Asana }) {
  const [holdSeconds, setHoldSeconds] = useState(String(Math.min(asana.holdSeconds.intermediate, TRY_POSE_MAX_SECONDS)));
  const hold = Math.min(TRY_POSE_MAX_SECONDS, parseInt(holdSeconds, 10) || asana.holdSeconds.intermediate);
  const [trying, setTrying] = useState(false);
  const [media, setMedia] = useState<YogaPoseMedia | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    fetchYogaPoseMediaMap().then((map) => {
      if (active) setMedia(map[asana.id] || null);
    });
    return () => {
      active = false;
    };
  }, [asana.id]);

  if (media === null) return <NotFound />;

  return (
    <div className="stack gap-md">
      <section className="card" style={{ textAlign: "center" }}>
        {media?.image ? (
          <div style={{ width: "100%", aspectRatio: "4 / 3", minHeight: 240, maxHeight: 430, borderRadius: 14, background: "#fff", overflow: "hidden", display: "grid", placeItems: "center", marginBottom: 16, padding: 12 }}>
            <img src={media.image} alt={asana.nameEnglish} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ display: "grid", placeItems: "center", color: "var(--color-yoga)", marginBottom: 12 }}>
            <PoseArt asanaId={asana.id} category={asana.category} size={128} />
          </div>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{asana.nameEnglish}</h1>
        <p className="text-sanskrit secondary" style={{ marginTop: 4 }}>
          {asana.nameDevanagari} - {asana.nameSanskrit}
        </p>
        <div className="row gap-sm wrap center" style={{ marginTop: 16 }}>
          <span className="pill">Hold {asana.holdSeconds.intermediate}s</span>
          <span className="pill" style={{ textTransform: "capitalize" }}>
            {asana.category.replace("_", " ")}
          </span>
        </div>
        <div style={{ marginTop: 20, textAlign: "left" }}>
          <DurationControl
            label="Hold Duration"
            value={holdSeconds}
            onChange={(value) => setHoldSeconds(clampNumericInput(value, TRY_POSE_MAX_SECONDS))}
            presets={[
              { label: "15s", value: "15" },
              { label: "30s", value: "30" },
              { label: "45s", value: "45" },
              { label: "1m", value: "60" },
            ]}
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => setTrying(true)}>
            <IconPlay width={17} height={17} /> Start Pose
          </button>
        </div>
      </section>
      {media?.attributionRequired && (
        <p className="text-caption" style={{ textAlign: "center", lineHeight: 1.45 }}>
          Pose image from Yoga API. Some Yoga API images require Flaticon attribution.
        </p>
      )}
      {trying && (
        <TimedTryModal
          title={asana.nameEnglish}
          subtitle={asana.nameSanskrit}
          seconds={hold}
          tone="var(--color-yoga)"
          icon={
            media?.image ? (
              <span style={{ width: 130, height: 130, borderRadius: 16, background: "#fff", display: "grid", placeItems: "center", padding: 8, overflow: "hidden" }}>
                <img src={media.image} alt={asana.nameEnglish} style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain" }} />
              </span>
            ) : (
              <PoseArt asanaId={asana.id} category={asana.category} size={96} />
            )
          }
          onClose={() => setTrying(false)}
        />
      )}

      <section className="card">
        <SectionTitle>Focus Areas</SectionTitle>
        <div className="row gap-sm wrap">
          {asana.focusArea.map((focus) => (
            <span className="pill pill-active" key={focus}>
              {focus}
            </span>
          ))}
        </div>
      </section>

      <InstructionCard title="How To" items={asana.instructions} />
      <InstructionCard title="Benefits" items={asana.benefits} />
      {asana.contraindications.length > 0 && <InstructionCard title="Precautions" items={asana.contraindications} warning />}
    </div>
  );
}

function BreathDetail({ technique }: { technique: PranayamaTechnique }) {
  const ratio = `${technique.ratio.inhale}:${technique.ratio.holdIn}:${technique.ratio.exhale}:${technique.ratio.holdOut}`;
  const [durationMin, setDurationMin] = useState("3");
  const duration = Math.max(1, Math.min(TRY_PRANAYAM_MAX_MINUTES, Math.round(parseFloat(durationMin) || 3)));
  const [trying, setTrying] = useState(false);

  return (
    <div className="stack gap-md">
      <section className="card" style={{ textAlign: "center" }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            margin: "0 auto 16px",
            display: "grid",
            placeItems: "center",
            background: "rgba(46,229,181,0.12)",
            color: "var(--color-mint-active)",
          }}
        >
          <IconPatterns width={38} height={38} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{technique.name}</h1>
        <p className="text-sanskrit secondary" style={{ marginTop: 4 }}>
          {technique.nameDevanagari} - {technique.nameSanskrit}
        </p>
        <div className="row gap-sm wrap center" style={{ marginTop: 16 }}>
          <span className="pill" style={{ textTransform: "capitalize" }}>
            {technique.category}
          </span>
          <span className="pill">Ratio {ratio}</span>
        </div>
        <div style={{ marginTop: 20, textAlign: "left" }}>
          <DurationControl
            label="Session Duration"
            value={durationMin}
            onChange={(value) => setDurationMin(clampNumericInput(value, TRY_PRANAYAM_MAX_MINUTES, { decimal: true }))}
            unit="min"
            presets={[
              { label: "1m", value: "1" },
              { label: "2m", value: "2" },
              { label: "3m", value: "3" },
              { label: "5m", value: "5" },
            ]}
          />
          <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => setTrying(true)}>
            <IconPlay width={17} height={17} /> Start Breathing
          </button>
        </div>
      </section>
      {trying && (
        <TimedTryModal
          title={technique.name}
          subtitle={`Ratio ${ratio}`}
          seconds={duration * 60}
          tone="var(--color-breathe)"
          icon={<IconPatterns width={48} height={48} />}
          onClose={() => setTrying(false)}
        />
      )}

      {technique.bestFor.length > 0 && (
        <section className="card">
          <SectionTitle>Best For</SectionTitle>
          <div className="row gap-sm wrap">
            {technique.bestFor.map((item) => (
              <span className="pill pill-active" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>
      )}

      <InstructionCard title="How To" items={technique.instructions} />
      <InstructionCard title="Benefits" items={technique.benefits} />
      {technique.contraindications.length > 0 && <InstructionCard title="Precautions" items={technique.contraindications} warning />}
    </div>
  );
}

function ExerciseTryModal({
  name,
  usesWeight,
  sets,
  reps,
  weight,
  onClose,
}: {
  name: string;
  usesWeight: boolean;
  sets: number;
  reps: number;
  weight?: number;
  onClose: () => void;
}) {
  const [done, setDone] = useState<boolean[]>(() => Array.from({ length: sets }, () => false));

  useEffect(() => {
    setDone(Array.from({ length: sets }, () => false));
  }, [sets]);

  return (
    <TryShell title="Start Exercise" subtitle={name} onClose={onClose}>
      <div className="stack gap-sm">
        <div className="pill" style={{ justifyContent: "center" }}>
          No session will be saved
        </div>
        <div style={{ display: "grid", gridTemplateColumns: usesWeight ? "40px 1fr 1fr 48px" : "40px 1fr 48px", gap: 8, alignItems: "center" }}>
          <HeadCell>Set</HeadCell>
          {usesWeight && <HeadCell>KG</HeadCell>}
          <HeadCell>Reps</HeadCell>
          <HeadCell>Done</HeadCell>
          {done.map((complete, index) => (
            <div key={index} style={{ display: "contents" }}>
              <div className="text-mono" style={{ textAlign: "center", fontWeight: 700 }}>{index + 1}</div>
              {usesWeight && <div className="input" style={{ minHeight: 38, padding: "8px", textAlign: "center" }}>{weight || "-"}</div>}
              <div className="input" style={{ minHeight: 38, padding: "8px", textAlign: "center" }}>{reps}</div>
              <button
                className="icon-btn"
                onClick={() => setDone((current) => current.map((item, itemIndex) => itemIndex === index ? !item : item))}
                aria-label={`Mark set ${index + 1} done`}
                style={{ width: 38, height: 38, background: complete ? "var(--color-mint-active)" : "var(--color-surface-3)", color: complete ? "#061014" : "var(--color-text-muted)" }}
              >
                {complete && <IconCheck width={16} height={16} />}
              </button>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Done
        </button>
      </div>
    </TryShell>
  );
}

function TimedTryModal({
  title,
  subtitle,
  seconds,
  tone,
  icon,
  onClose,
}: {
  title: string;
  subtitle: string;
  seconds: number;
  tone: string;
  icon: React.ReactNode;
  onClose: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const toggleRunning = () => {
    if (remaining === 0) {
      setRemaining(seconds);
      setRunning(true);
      return;
    }
    setRunning((value) => !value);
  };

  return (
    <TryShell title={`Start ${title}`} subtitle={subtitle} onClose={onClose}>
      <div className="stack gap-md" style={{ alignItems: "center", textAlign: "center" }}>
        <div style={{ color: tone }}>{icon}</div>
        <div className="text-mono" style={{ fontSize: 52, fontWeight: 800, color: tone }}>{mm}:{ss}</div>
        <p className="text-caption">This session is not saved.</p>
        <div className="row center gap-sm">
          <button className="btn btn-primary" onClick={toggleRunning}>
            {running ? <IconPause width={17} height={17} /> : <IconPlay width={17} height={17} />}
            {running ? "Pause" : remaining === 0 ? "Restart" : "Start"}
          </button>
          <button className="btn btn-secondary" onClick={() => { setRemaining(seconds); setRunning(false); }}>
            Reset
          </button>
        </div>
      </div>
    </TryShell>
  );
}

function TryShell({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 360, display: "grid", alignItems: "end", background: "rgba(4,8,6,0.68)" }} onClick={onClose}>
      <section className="glass" style={{ width: "min(520px, 100%)", margin: "0 auto", padding: "18px 20px calc(28px + env(safe-area-inset-bottom))", borderTopLeftRadius: 18, borderTopRightRadius: 18 }} onClick={(event) => event.stopPropagation()}>
        <div className="row between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800 }}>{title}</h2>
            <p className="text-caption" style={{ marginTop: 3 }}>{subtitle}</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close try popup" style={{ width: 38, height: 38 }}>
            <IconClose width={17} height={17} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function HeadCell({ children }: { children: React.ReactNode }) {
  return <div className="uppercase-label" style={{ textAlign: "center", fontSize: 10 }}>{children}</div>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="stack gap-xs">
      <span className="uppercase-label">{label}</span>
      <input className="input" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} style={{ textAlign: "center", fontFamily: "var(--font-mono)" }} />
    </label>
  );
}

function DurationControl({
  label,
  value,
  onChange,
  unit = "sec",
  presets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  presets: { label: string; value: string }[];
}) {
  return (
    <div className="stack gap-sm">
      <label className="stack gap-xs">
        <span className="uppercase-label">{label}</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
          <input className="input" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} style={{ fontFamily: "var(--font-mono)", textAlign: "center" }} />
          <span className="pill" style={{ minHeight: 48 }}>{unit}</span>
        </div>
      </label>
      <div className="row gap-xs wrap">
        {presets.map((preset) => (
          <button key={preset.value} className={`chip ${value === preset.value ? "active" : ""}`} onClick={() => onChange(preset.value)}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="uppercase-label" style={{ marginBottom: 12 }}>
      {children}
    </h2>
  );
}

function InstructionCard({ title, items, warning = false }: { title: string; items: string[]; warning?: boolean }) {
  return (
    <section className="card">
      <SectionTitle>{title}</SectionTitle>
      <ol style={{ paddingLeft: 20, color: warning ? "var(--color-status-error)" : "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`} style={{ marginBottom: 10 }}>
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}

function NotFound() {
  return (
    <section className="card" style={{ textAlign: "center" }}>
      <p className="text-caption" style={{ marginBottom: 16 }}>
        This library item could not be found.
      </p>
      <Link href="/library" className="btn btn-primary btn-block">
        Back to Library
      </Link>
    </section>
  );
}
