"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchExerciseById, fetchExerciseDetails, type ExerciseDbExercise } from "@/app/actions/exercise";
import { BackHeader } from "@/components/BackHeader";
import { PoseArt } from "@/components/PoseArt";
import { asanaById, techniqueById } from "@/lib/seed";
import { IconDumbbell, IconPatterns, IconPlay, IconYoga } from "@/components/Icons";
import type { Asana, PranayamaTechnique } from "@/lib/types";

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
    return <DetailShell title={asana?.nameEnglish || "Yoga Pose"}>{asana ? <YogaDetail asana={asana} /> : <NotFound />}</DetailShell>;
  }

  if (type === "breathe") {
    const technique = techniqueById(id);
    return (
      <DetailShell title={technique?.name || "Pranayama"}>
        {technique ? <BreathDetail technique={technique} /> : <NotFound />}
      </DetailShell>
    );
  }

  return (
    <DetailShell title={exercise?.name || "Exercise"}>
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

function DetailShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page">
      <BackHeader title={title} fallback="/library" />
      {children}
    </div>
  );
}

function ExerciseDetail({ item }: { item: ExerciseDbExercise }) {
  const [frame, setFrame] = useState(0);
  const frames = item.images.length > 0 ? item.images : item.gifUrl ? [item.gifUrl] : [];

  useEffect(() => {
    if (frames.length < 2) return;
    const timer = setInterval(() => setFrame((current) => (current + 1) % frames.length), 900);
    return () => clearInterval(timer);
  }, [frames.length]);

  return (
    <div className="stack gap-md">
      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        {frames.length > 0 ? (
          <div style={{ width: "100%", height: 260, background: "#fff", position: "relative" }}>
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
                  objectFit: "cover",
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
  return (
    <div className="stack gap-md">
      <section className="card" style={{ textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", color: "#2ee5b5", marginBottom: 12 }}>
          <PoseArt asanaId={asana.id} category={asana.category} size={128} />
        </div>
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
        <Link href={`/player/yoga?asana=${asana.id}`} className="btn btn-primary btn-block" style={{ marginTop: 20 }}>
          <IconPlay width={17} height={17} /> Practice this pose
        </Link>
      </section>

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
      {asana.contraindications.length > 0 && <InstructionCard title="Take Care" items={asana.contraindications} warning />}
    </div>
  );
}

function BreathDetail({ technique }: { technique: PranayamaTechnique }) {
  const ratio = `${technique.ratio.inhale}:${technique.ratio.holdIn}:${technique.ratio.exhale}:${technique.ratio.holdOut}`;

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
        <Link
          href={`/player/breathe?technique=${technique.id}&duration=5&return=/library`}
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
        >
          <IconPlay width={17} height={17} /> Start session
        </Link>
      </section>

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
      {technique.contraindications.length > 0 && <InstructionCard title="Take Care" items={technique.contraindications} warning />}
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
