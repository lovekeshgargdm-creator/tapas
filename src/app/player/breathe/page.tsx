"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { techniqueById, TECHNIQUES } from "@/lib/seed";
import { useStore, uid, todayISO } from "@/lib/store";
import { IconClose, IconPlay, IconPause, IconSound, IconMute, IconSettings, IconCheck } from "@/components/Icons";

type Phase = "inhale" | "holdIn" | "exhale" | "holdOut";
const PHASE_LABEL: Record<Phase, string> = { inhale: "Inhale", holdIn: "Hold", exhale: "Exhale", holdOut: "Hold" };
const MOODS = ["😞", "😕", "😐", "🙂", "😄"];

function BreathePlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const addBreath = useStore((s) => s.addBreath);
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);

  const techId = params.get("technique") || "box";
  const tech = techniqueById(techId) || TECHNIQUES[0];
  const durationMin = Number(params.get("duration") || 5);
  const fromOnboarding = params.get("from") === "onboarding";
  const returnTo = fromOnboarding ? "/home" : params.get("return") || "/library?tab=breathe";

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseRemain, setPhaseRemain] = useState(tech.ratio.inhale);
  const [scale, setScale] = useState(0.55);
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState<"ready" | "run" | "pre" | "done">("ready");
  const [preMood, setPreMood] = useState<number | null>(null);
  const [postMood, setPostMood] = useState<number | null>(null);

  const raf = useRef(0);
  const last = useRef(0);
  const phaseTime = useRef(0);
  const phaseIdx = useRef(0);
  const sessionRemain = useRef(durationMin * 60);

  // Build the active phase sequence (skip zero-length phases)
  const seq: { phase: Phase; dur: number }[] = (
    [
      { phase: "inhale" as Phase, dur: tech.ratio.inhale },
      { phase: "holdIn" as Phase, dur: tech.ratio.holdIn },
      { phase: "exhale" as Phase, dur: tech.ratio.exhale },
      { phase: "holdOut" as Phase, dur: tech.ratio.holdOut },
    ]
  ).filter((p) => p.dur > 0);

  const targetScale = (ph: Phase) => (ph === "inhale" || ph === "holdIn" ? 1 : 0.55);

  const beep = useCallback(() => {
    if (!prefs.sound) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 432;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      setTimeout(() => ctx.close(), 800);
    } catch {}
  }, [prefs.sound]);

  const vibrate = useCallback(() => {
    if (prefs.haptics && "vibrate" in navigator) navigator.vibrate(30);
  }, [prefs.haptics]);

  // Animation loop
  useEffect(() => {
    if (!running) return;
    const tick = (t: number) => {
      if (!last.current) last.current = t;
      const dt = (t - last.current) / 1000;
      last.current = t;

      phaseTime.current += dt;
      sessionRemain.current -= dt;
      setElapsed((e) => e + dt);

      const cur = seq[phaseIdx.current % seq.length];
      const remain = Math.max(0, cur.dur - phaseTime.current);
      setPhaseRemain(remain);

      // interpolate scale toward target over the phase
      const from = cur.phase === "inhale" ? 0.55 : cur.phase === "exhale" ? 1 : targetScale(cur.phase);
      const to = targetScale(cur.phase);
      const prog = Math.min(phaseTime.current / cur.dur, 1);
      const eased = cur.phase === "holdIn" || cur.phase === "holdOut" ? prog : 0.5 - Math.cos(prog * Math.PI) / 2;
      setScale(from + (to - from) * eased);

      if (phaseTime.current >= cur.dur) {
        phaseTime.current = 0;
        phaseIdx.current += 1;
        const next = seq[phaseIdx.current % seq.length];
        setPhase(next.phase);
        beep();
        vibrate();
      }

      if (sessionRemain.current <= 0) {
        setRunning(false);
        setStage("done");
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [running, seq, beep, vibrate]);

  // Wake lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if (running && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    }
    return () => { try { lock?.release(); } catch {} };
  }, [running]);

  const begin = () => {
    setStage("run");
    phaseIdx.current = 0;
    phaseTime.current = 0;
    sessionRemain.current = durationMin * 60;
    last.current = 0;
    setPhase(seq[0].phase);
    setRunning(true);
  };

  const finishAndLog = () => {
    addBreath({
      id: uid(),
      date: todayISO(),
      techniqueId: tech.id,
      techniqueName: tech.name,
      durationSec: Math.round(elapsed),
      preMood: preMood ?? undefined,
      postMood: postMood ?? undefined,
      completed: elapsed > 20,
    });
    router.replace(returnTo);
  };

  const exit = () => router.replace(returnTo);

  const mm = Math.floor(sessionRemain.current / 60);
  const ss = Math.max(0, Math.floor(sessionRemain.current % 60));
  const totalLabel = `${durationMin} min session`;

  return (
    <main style={shell}>
      {/* header */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 16px 0" }}>
        <button className="icon-btn" onClick={exit} aria-label="Close"><IconClose /></button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, color: "var(--color-train)" }}>{tech.name}</div>
          <div className="text-mono" style={{ fontSize: 11, letterSpacing: "0.18em", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            {totalLabel} · {tech.ratio.inhale}-{tech.ratio.holdIn}-{tech.ratio.exhale}-{tech.ratio.holdOut} rhythm
          </div>
        </div>
        <button className="icon-btn" onClick={() => setPrefs({ sound: !prefs.sound })} aria-label="Sound">
          {prefs.sound ? <IconSound /> : <IconMute />}
        </button>
      </div>

      {/* ambient */}
      <div aria-hidden style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", zIndex: 0 }}>
        <motion.div animate={{ scale }} transition={{ duration: 0.12, ease: "linear" }} style={{
          width: 460, height: 460, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,229,181,0.16), transparent 70%)", filter: "blur(20px)",
        }} />
      </div>

      <AnimatePresence mode="wait">
        {stage === "ready" && (
          <PreMoodOrStart key="ready" tech={tech} onStart={(mood) => { setPreMood(mood); begin(); }} preMood={preMood} setPreMood={setPreMood} />
        )}

        {stage === "run" && (
          <motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={center}>
            {/* Circle */}
            <div style={{ position: "relative", display: "grid", placeItems: "center", flex: 1 }}>
              <motion.div
                style={{
                  width: 260, height: 260, borderRadius: "50%",
                  transform: `scale(${scale})`,
                  background: "radial-gradient(circle at 50% 40%, rgba(46,229,181,0.22), rgba(115,253,156,0.06) 65%, transparent)",
                  border: "2px solid rgba(46,229,181,0.5)",
                  boxShadow: phase === "inhale" || phase === "holdIn" ? "0 0 60px rgba(115,253,156,0.25)" : "0 0 24px rgba(46,229,181,0.12)",
                  display: "grid", placeItems: "center",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 30, fontWeight: 600 }}>{PHASE_LABEL[phase]}</div>
                  <div className="text-mono seafoam" style={{ fontSize: 15, marginTop: 4 }}>{Math.ceil(phaseRemain)}s</div>
                </div>
              </motion.div>
            </div>

            {/* controls */}
            <div style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 420 }}>
              <div className="text-mono" style={{ textAlign: "center", fontSize: 15, color: "var(--color-text-muted)", marginBottom: 16 }}>
                {mm}:{String(ss).padStart(2, "0")} remaining
              </div>
              <div className="row center gap-lg">
                <button className="icon-btn" onClick={() => { setStage("done"); setRunning(false); }} aria-label="Finish"><IconCheck /></button>
                <button onClick={() => setRunning((r) => !r)} className="btn btn-primary" style={{ width: 72, height: 72, borderRadius: "50%", padding: 0 }} aria-label={running ? "Pause" : "Resume"}>
                  {running ? <IconPause width={26} height={26} /> : <IconPlay width={26} height={26} />}
                </button>
                <button className="icon-btn" onClick={() => setPrefs({ sound: !prefs.sound })} aria-label="Sound">
                  {prefs.sound ? <IconSound /> : <IconMute />}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...center, justifyContent: "center", padding: 24, zIndex: 3 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 12 }}
              style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(115,253,156,0.14)", display: "grid", placeItems: "center", boxShadow: "var(--glow-mint)", marginBottom: 20 }}>
              <IconCheck width={40} height={40} style={{ color: "#73fd9c" }} />
            </motion.div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Beautifully done.</h2>
            <p className="secondary" style={{ marginTop: 8, textAlign: "center" }}>How do you feel right now?</p>
            <div className="row center gap-sm" style={{ margin: "20px 0" }}>
              {MOODS.map((m, i) => (
                <button key={i} onClick={() => setPostMood(i + 1)} style={{
                  fontSize: 30, background: "none", border: "none", padding: 6, borderRadius: 12,
                  transform: postMood === i + 1 ? "scale(1.25)" : "scale(1)",
                  filter: postMood != null && postMood !== i + 1 ? "grayscale(0.7) opacity(0.5)" : "none",
                  transition: "all .2s",
                }}>{m}</button>
              ))}
            </div>
            {preMood != null && postMood != null && postMood > preMood && (
              <p className="mint" style={{ marginBottom: 16, fontWeight: 600 }}>Your mood improved from {preMood} to {postMood} 🌟</p>
            )}
            <button className="btn btn-primary btn-lg" style={{ minWidth: 200 }} onClick={finishAndLog}>Save session</button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function PreMoodOrStart({ tech, onStart, preMood, setPreMood }: {
  tech: { name: string; nameSanskrit: string; bestTime: string; instructions: string[] };
  onStart: (mood: number | null) => void; preMood: number | null; setPreMood: (m: number) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ ...center, justifyContent: "center", padding: 24, zIndex: 3 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <p className="secondary" style={{ marginBottom: 6 }}>{tech.bestTime}</p>
        <div className="clay" style={{ padding: 16, textAlign: "left", marginBottom: 24 }}>
          {tech.instructions.slice(0, 3).map((ins, i) => (
            <div key={i} className="row gap-sm" style={{ marginBottom: i < 2 ? 10 : 0, alignItems: "flex-start" }}>
              <span className="text-mono" style={{ color: "#73fd9c", fontSize: 13 }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, color: "var(--color-text-secondary)" }}>{ins}</span>
            </div>
          ))}
        </div>
        <p className="text-caption" style={{ marginBottom: 10 }}>How do you feel right now?</p>
        <div className="row center gap-sm" style={{ marginBottom: 26 }}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => setPreMood(i + 1)} style={{
              fontSize: 28, background: "none", border: "none", padding: 4, borderRadius: 10,
              transform: preMood === i + 1 ? "scale(1.2)" : "scale(1)",
              filter: preMood != null && preMood !== i + 1 ? "grayscale(0.7) opacity(0.5)" : "none",
              transition: "all .2s",
            }}>{m}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" style={{ minWidth: 220 }} onClick={() => onStart(preMood)}>
          <IconPlay width={20} height={20} /> Begin
        </button>
      </div>
    </motion.div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh", position: "fixed", inset: 0, zIndex: 300,
  background: "radial-gradient(120% 80% at 50% 45%, #12311f 0%, #0e150f 70%)",
  display: "flex", flexDirection: "column", overflow: "hidden",
};
const center: React.CSSProperties = {
  position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column",
  alignItems: "center", width: "100%",
};

export default function Page() {
  return (
    <Suspense fallback={<main style={shell} />}>
      <BreathePlayer />
    </Suspense>
  );
}
