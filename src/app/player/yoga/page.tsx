"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { flowById, asanaById, FLOWS } from "@/lib/seed";
import { PoseArt } from "@/components/PoseArt";
import { useStore, uid, todayISO } from "@/lib/store";
import { IconClose, IconPlay, IconPause, IconSkip, IconSound, IconMute, IconCheck } from "@/components/Icons";
import type { FlowStep } from "@/lib/types";

function YogaPlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const addYoga = useStore((s) => s.addYoga);
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const returnTo = params.get("return") || "/routine";

  // Session source: a full flow (?flow=) or a single pose (?asana=).
  const asanaParam = params.get("asana");
  const singleAsana = asanaParam ? asanaById(asanaParam) : undefined;

  const session = useMemo(() => {
    if (singleAsana) {
      const step: FlowStep = {
        asanaId: singleAsana.id,
        holdSeconds: singleAsana.holdSeconds.intermediate,
        side: "both",
        breathCue: "Breathe slow and steady. Soften with every exhale.",
      };
      return {
        id: `pose-${singleAsana.id}`,
        name: singleAsana.nameEnglish,
        durationMin: Math.max(1, Math.round(singleAsana.holdSeconds.intermediate / 60)),
        steps: [step],
      };
    }
    const flow = flowById(params.get("flow") || params.get("preset") || "") || FLOWS[0];
    return { id: flow.id, name: flow.name, durationMin: flow.durationMin, steps: flow.sequence };
  }, [singleAsana, params]);

  const steps = session.steps;

  const [idx, setIdx] = useState(0);
  const [remain, setRemain] = useState(steps[0]?.holdSeconds || 30);
  const [running, setRunning] = useState(true);
  const [transition, setTransition] = useState(false);
  const [done, setDone] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);
  const acc = useRef(0);

  const step = steps[idx];
  const asana = step ? asanaById(step.asanaId) : undefined;
  const next = steps[idx + 1];
  const nextAsana = next ? asanaById(next.asanaId) : undefined;

  const beep = useCallback(() => {
    if (!prefs.sound) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = 528; osc.type = "sine";
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      osc.start(); osc.stop(ctx.currentTime + 1);
      setTimeout(() => ctx.close(), 1100);
    } catch {}
  }, [prefs.sound]);

  const advance = useCallback(() => {
    if (idx + 1 >= steps.length) { setRunning(false); setDone(true); beep(); return; }
    setTransition(true);
    beep();
    setTimeout(() => {
      setIdx((i) => i + 1);
      setRemain(steps[idx + 1].holdSeconds);
      setTransition(false);
    }, 3000);
  }, [idx, steps, beep]);

  useEffect(() => {
    if (!running || transition) return;
    const tick = (t: number) => {
      if (!last.current) last.current = t;
      acc.current += (t - last.current) / 1000;
      last.current = t;
      if (acc.current >= 1) {
        acc.current -= 1;
        setRemain((r) => {
          if (r <= 1) { advance(); return 0; }
          return r - 1;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf.current); last.current = 0; };
  }, [running, transition, advance]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    }
    return () => { try { lock?.release(); } catch {} };
  }, []);

  const finish = () => {
    addYoga({ id: uid(), date: todayISO(), flowId: session.id, flowName: session.name, type: singleAsana ? "freestyle" : "flow", durationMin: session.durationMin, posesCount: steps.length });
    router.replace(returnTo);
  };

  const mm = String(Math.floor(remain / 60)).padStart(2, "0");
  const ss = String(Math.floor(remain % 60)).padStart(2, "0");
  const progress = ((idx + (transition ? 1 : 0)) / steps.length) * 100;

  if (done) {
    return (
      <main style={shell}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...col, justifyContent: "center", padding: 28 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 150, damping: 12 }}
            style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(46,229,181,0.14)", display: "grid", placeItems: "center", marginBottom: 22, boxShadow: "var(--glow-seafoam)" }}>
            <IconCheck width={42} height={42} style={{ color: "#2ee5b5" }} />
          </motion.div>
          <h2 style={{ fontSize: 26, fontWeight: 700 }}>Namaste 🙏</h2>
          <p className="secondary" style={{ textAlign: "center", marginTop: 8 }}>
            {singleAsana
              ? <>You held<br /><b style={{ color: "var(--color-text-primary)" }}>{session.name}</b></>
              : <>You flowed through {steps.length} poses of<br /><b style={{ color: "var(--color-text-primary)" }}>{session.name}</b> · {session.durationMin} min</>}
          </p>
          <button className="btn btn-primary btn-lg" style={{ marginTop: 26, minWidth: 220 }} onClick={finish}>Save session</button>
        </motion.div>
      </main>
    );
  }

  return (
    <main style={shell}>
      {/* ambient radial glow behind */}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 50% at 50% 42%, rgba(46,229,181,0.1), transparent 70%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 16px 0" }}>
        <button className="icon-btn" onClick={() => router.replace(returnTo)} aria-label="Close"><IconClose /></button>
        <div style={{ fontWeight: 700, color: "#2ee5b5", alignSelf: "center" }}>{session.name}</div>
        <button className="icon-btn" onClick={() => setPrefs({ sound: !prefs.sound })} aria-label="Sound">{prefs.sound ? <IconSound /> : <IconMute />}</button>
      </div>

      <div style={{ ...col, position: "relative", zIndex: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div key={idx + (transition ? "-t" : "")} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}
            style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", width: "100%" }}>
            {transition ? (
              <>
                <div className="uppercase-label" style={{ marginBottom: 18 }}>Next pose</div>
                <div style={{ color: "#2ee5b5", marginBottom: 12 }}><PoseArt asanaId={next?.asanaId} category={nextAsana?.category} size={120} /></div>
                <h2 style={{ fontSize: 26, fontWeight: 700, color: "#2ee5b5" }}>{nextAsana?.nameEnglish}</h2>
                <p className="text-mono seafoam" style={{ marginTop: 10, fontSize: 15 }}>Get ready…</p>
              </>
            ) : (
              <>
                <div style={{ color: "#2ee5b5", marginBottom: 8, opacity: 0.9 }}>
                  <PoseArt asanaId={step?.asanaId} category={asana?.category} size={128} />
                </div>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#2ee5b5", lineHeight: 1.15 }}>{asana?.nameEnglish}</h2>
                <p className="text-sanskrit secondary" style={{ fontSize: 15, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{asana?.nameSanskrit}{step?.side && step.side !== "both" ? ` · ${step.side}` : ""}</p>
                <div className="text-mono" style={{ fontSize: 68, fontWeight: 700, letterSpacing: "2px", margin: "20px 0 6px" }}>{mm}:{ss}</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* progress */}
        <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="text-mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Pose {idx + 1} of {steps.length}</span>
            <span className="text-mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{next ? `Next: ${nextAsana?.nameEnglish}` : "Final pose"}</span>
          </div>
          <div style={{ height: 5, borderRadius: 5, background: "var(--color-surface-3)", overflow: "hidden" }}>
            <motion.div animate={{ width: `${progress}%` }} style={{ height: "100%", background: "linear-gradient(90deg,#2ee5b5,#73fd9c)", borderRadius: 5 }} />
          </div>

          {/* controls */}
          <div className="row center gap-lg" style={{ margin: "22px 0" }}>
            <button className="icon-btn" onClick={() => setRunning((r) => !r)} style={{ background: "var(--color-surface-3)", width: 64, height: 64 }} aria-label={running ? "Pause" : "Play"}>
              {running ? <IconPause width={26} height={26} style={{ color: "#2ee5b5" }} /> : <IconPlay width={26} height={26} style={{ color: "#2ee5b5" }} />}
            </button>
            <button className="icon-btn" onClick={advance} aria-label="Skip pose"><IconSkip /></button>
          </div>
        </div>

        {/* breath cue */}
        {step?.breathCue && !transition && (
          <div className="glass" style={{ width: "100%", maxWidth: 520, padding: "16px 20px calc(16px + env(safe-area-inset-bottom))", borderRadius: "18px 18px 0 0", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(46,229,181,0.14)", display: "grid", placeItems: "center", color: "#2ee5b5", flexShrink: 0 }}>
              <IconPlay width={16} height={16} />
            </div>
            <div>
              <div className="uppercase-label" style={{ color: "#2ee5b5" }}>Breathing cue</div>
              <p style={{ fontSize: 14.5, marginTop: 2 }}>{step.breathCue}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const shell: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 300, minHeight: "100dvh",
  background: "radial-gradient(120% 80% at 50% 40%, #0f1c18 0%, #0e150f 72%)",
  display: "flex", flexDirection: "column", overflow: "hidden",
};
const col: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" };

export default function Page() {
  return (
    <Suspense fallback={<main style={shell} />}>
      <YogaPlayer />
    </Suspense>
  );
}
