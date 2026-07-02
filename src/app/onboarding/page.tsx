"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { DOSHA_QUIZ, DOSHA_INFO } from "@/lib/seed";
import type { Dosha, Gender, HeightUnit, WeightUnit } from "@/lib/types";
import { IconArrowRight, IconCheck, IconSparkle } from "@/components/Icons";

const GOALS = [
  { id: "strength", label: "Get stronger", emoji: "💪" },
  { id: "flexible", label: "Get more flexible", emoji: "🧘" },
  { id: "stress", label: "Reduce stress & breathe better", emoji: "🌬️" },
  { id: "consistency", label: "Build consistency", emoji: "🔥" },
];

type Step = "intro" | "quiz" | "result" | "goals" | "personal" | "ready";

export default function Onboarding() {
  const router = useRouter();
  const setDosha = useStore((s) => s.setDosha);
  const setGoals = useStore((s) => s.setGoals);
  const setProfile = useStore((s) => s.setProfile);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const name = useStore((s) => s.profile.name);

  const [step, setStep] = useState<Step>("intro");
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Dosha[]>([]);
  const [goals, setLocalGoals] = useState<string[]>([]);
  const [isRetake, setIsRetake] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsRetake(new URLSearchParams(window.location.search).get("retake") === "true");
    }
  }, []);

  // Personal info state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [inputError, setInputError] = useState("");

  const STEPS_ORDER: Step[] = ["intro", "quiz", "result", "goals", "personal", "ready"];

  const result = useMemo(() => {
    const tally: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((d) => (tally[d] += 1));
    const total = answers.length || 1;
    const scores = {
      vata: Math.round((tally.vata / total) * 100),
      pitta: Math.round((tally.pitta / total) * 100),
      kapha: Math.round((tally.kapha / total) * 100),
    };
    const primary = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || "vata") as Dosha;
    return { scores, primary };
  }, [answers]);

  const answer = (d: Dosha) => {
    const next = [...answers, d];
    setAnswers(next);
    if (qi + 1 < DOSHA_QUIZ.length) setQi(qi + 1);
    else {
      const tally: Record<Dosha, number> = { vata: 0, pitta: 0, kapha: 0 };
      next.forEach((x) => (tally[x] += 1));
      const total = next.length;
      setDosha(
        {
          vata: Math.round((tally.vata / total) * 100),
          pitta: Math.round((tally.pitta / total) * 100),
          kapha: Math.round((tally.kapha / total) * 100),
        },
        (Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0]) as Dosha,
      );
      setStep("result");
    }
  };

  const skipQuiz = () => {
    if (isRetake) {
      router.replace("/home");
      return;
    }
    setDosha({ vata: 34, pitta: 33, kapha: 33 }, "tridoshic");
    setStep("goals");
  };

  const toggleGoal = (id: string) =>
    setLocalGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  const savePersonalInfo = () => {
    const profileUpdate: Parameters<typeof setProfile>[0] = {
      heightUnit,
      weightUnit,
    };
    if (age) profileUpdate.age = Math.min(parseInt(age, 10), LIMITS.age);
    if (gender) profileUpdate.gender = gender;
    if (heightUnit === "cm" && heightCm) {
      profileUpdate.heightCm = Math.min(parseFloat(heightCm), LIMITS.heightCm);
    } else if (heightUnit === "ft_in" && (heightFt || heightIn)) {
      const ft = Math.min(parseFloat(heightFt || "0"), LIMITS.heightFt);
      const inch = Math.min(parseFloat(heightIn || "0"), LIMITS.heightIn);
      profileUpdate.heightCm = Math.min(ft * 30.48 + inch * 2.54, LIMITS.heightCm);
    }
    if (weightUnit === "kg" && weightKg) {
      profileUpdate.weightKg = Math.min(parseFloat(weightKg), LIMITS.weightKg);
    } else if (weightUnit === "lbs" && weightLbs) {
      profileUpdate.weightKg = Math.min(parseFloat(weightLbs), LIMITS.weightLbs) * 0.453592;
    }
    setProfile(profileUpdate);
  };

  const finish = () => {
    savePersonalInfo();
    setGoals(goals);
    completeOnboarding();
    router.replace("/home");
  };

  const showLimit = (label: string, max: number, unit = "") => {
    setInputError(`${label} cannot be more than ${max}${unit ? ` ${unit}` : ""}.`);
  };

  const currentStepIndex = STEPS_ORDER.indexOf(step);
  const VISIBLE_STEPS = ["intro", "quiz", "result", "goals", "personal", "ready"];

  return (
    <main style={mainStyle}>
      <Ambient dim />
      <div style={frame}>
        {/* progress dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, zIndex: 1 }}>
          {VISIBLE_STEPS.map((s) => (
            <span
              key={s}
              style={{
                width: step === s ? 22 : 7,
                height: 7,
                borderRadius: 6,
                background: step === s ? "var(--color-mint-active)" : "var(--color-surface-3)",
                transition: "all .3s",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "intro" && (
            <Slide key="intro">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
                  <Logo size={82} withGlow />
                </motion.div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <InstallAppCard compact />
              </div>
              <h1 style={h1}>Hi{name ? `, ${name}` : " there"} 👋</h1>
              <p style={sub}>
                Tapas learns your constitution to personalise your yoga and movement practice.
                Take a quick 8-question check-in — or skip and explore.
              </p>
              <div className="stack gap-sm" style={{ marginTop: 26 }}>
                <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep("quiz")}>
                  Take the Dosha quiz <IconArrowRight width={18} height={18} />
                </button>
                <button className="btn btn-ghost" onClick={skipQuiz}>Skip for now</button>
              </div>
            </Slide>
          )}

          {step === "quiz" && (
            <Slide key="quiz">
              <div className="text-mono" style={{ color: "var(--color-text-muted)", fontSize: 12, letterSpacing: "0.2em", marginBottom: 10 }}>
                QUESTION {qi + 1} / {DOSHA_QUIZ.length}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, marginBottom: 24 }}>
                {DOSHA_QUIZ[qi].prompt}
              </h2>
              <div className="stack gap-sm">
                {DOSHA_QUIZ[qi].options.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => answer(o.dosha)}
                    className="card card-interactive"
                    style={{ textAlign: "left", padding: "16px 18px", fontSize: 15.5, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                  >
                    {o.label}
                    <IconArrowRight width={18} height={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={skipQuiz} style={{ margin: "18px auto 0", display: "block" }}>
                Skip the quiz
              </button>
            </Slide>
          )}

          {step === "result" && (
            <Slide key="result">
              <ResultCard scores={result.scores} primary={result.primary} />
              <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 24 }} onClick={() => isRetake ? router.replace("/home") : setStep("goals")}>
                {isRetake ? "Return to Home" : "Continue"} <IconArrowRight width={18} height={18} />
              </button>
            </Slide>
          )}

          {step === "goals" && (
            <Slide key="goals">
              <h2 style={h1}>What matters most right now?</h2>
              <p style={sub}>Pick any that apply — we&apos;ll shape your plan around them.</p>
              <div className="stack gap-sm" style={{ marginTop: 22 }}>
                {GOALS.map((g) => {
                  const on = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      className="card"
                      style={{
                        display: "flex", alignItems: "center", gap: 14, padding: "15px 16px",
                        border: on ? "1px solid rgba(115,253,156,0.5)" : "1px solid rgba(115,253,156,0.06)",
                        background: on ? "rgba(115,253,156,0.08)" : "var(--color-surface-2)",
                        transition: "all .2s",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{g.emoji}</span>
                      <span style={{ flex: 1, textAlign: "left", fontWeight: 600, fontSize: 15.5 }}>{g.label}</span>
                      <span style={{
                        width: 24, height: 24, borderRadius: 8, display: "grid", placeItems: "center",
                        background: on ? "var(--color-mint-active)" : "transparent",
                        border: on ? "none" : "1.5px solid var(--color-text-muted)",
                        color: "var(--color-on-primary)",
                      }}>
                        {on && <IconCheck width={15} height={15} />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 24 }} disabled={goals.length === 0} onClick={() => setStep("personal")}>
                Continue <IconArrowRight width={18} height={18} />
              </button>
            </Slide>
          )}

          {step === "personal" && (
            <Slide key="personal">
              <h2 style={h1}>A little about you</h2>
              <p style={sub}>Optional — helps personalise your experience.</p>
              {inputError && <LimitNotice message={inputError} />}

              <div className="stack gap-md" style={{ marginTop: 22 }}>
                {/* Age */}
                <div>
                  <label style={labelStyle}>Age</label>
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 28"
                    value={age}
                    min="10"
                    max={LIMITS.age}
                    onChange={(e) => setAge(clampNumericInput(e.target.value, LIMITS.age, { onLimit: () => showLimit("Age", LIMITS.age) }))}
                    style={{ marginTop: 6 }}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label style={labelStyle}>Gender</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
                    {(["male", "female", "prefer_not_to_say"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        style={{
                          padding: "10px 6px",
                          borderRadius: 10,
                          border: gender === g ? "1.5px solid rgba(115,253,156,0.6)" : "1.5px solid rgba(115,253,156,0.1)",
                          background: gender === g ? "rgba(115,253,156,0.1)" : "var(--color-surface-2)",
                          color: gender === g ? "var(--color-mint-active)" : "var(--color-text-secondary)",
                          fontWeight: 600,
                          fontSize: 12.5,
                          transition: "all .2s",
                        }}
                      >
                        {g === "prefer_not_to_say" ? "Prefer not" : g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={labelStyle}>Height</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["cm", "ft_in"] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => setHeightUnit(u)}
                          style={{
                            padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: heightUnit === u ? "var(--color-mint-active)" : "var(--color-surface-3)",
                            color: heightUnit === u ? "var(--color-on-primary)" : "var(--color-text-muted)",
                            border: "none", transition: "all .2s",
                          }}
                        >
                          {u === "ft_in" ? "ft / in" : "cm"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {heightUnit === "cm" ? (
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      placeholder="e.g. 175"
                      value={heightCm}
                      min="50"
                      max={LIMITS.heightCm}
                      onChange={(e) => setHeightCm(clampNumericInput(e.target.value, LIMITS.heightCm, { decimal: true, onLimit: () => showLimit("Height", LIMITS.heightCm, "cm") }))}
                    />
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input
                        className="input"
                        type="number"
                        inputMode="numeric"
                        placeholder="ft (e.g. 5)"
                        value={heightFt}
                        min="1"
                        max={LIMITS.heightFt}
                        onChange={(e) => setHeightFt(clampNumericInput(e.target.value, LIMITS.heightFt, { onLimit: () => showLimit("Height", LIMITS.heightFt, "ft") }))}
                      />
                      <input
                        className="input"
                        type="number"
                        inputMode="numeric"
                        placeholder="in (e.g. 9)"
                        value={heightIn}
                        min="0"
                        max={LIMITS.heightIn}
                        onChange={(e) => setHeightIn(clampNumericInput(e.target.value, LIMITS.heightIn, { onLimit: () => showLimit("Inches", LIMITS.heightIn, "in") }))}
                      />
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={labelStyle}>Weight</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["kg", "lbs"] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => setWeightUnit(u)}
                          style={{
                            padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: weightUnit === u ? "var(--color-mint-active)" : "var(--color-surface-3)",
                            color: weightUnit === u ? "var(--color-on-primary)" : "var(--color-text-muted)",
                            border: "none", transition: "all .2s",
                          }}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    className="input"
                    type="number"
                    inputMode="decimal"
                    placeholder={weightUnit === "kg" ? "e.g. 70" : "e.g. 154"}
                    value={weightUnit === "kg" ? weightKg : weightLbs}
                    min="1"
                    max={weightUnit === "kg" ? LIMITS.weightKg : LIMITS.weightLbs}
                    onChange={(e) => {
                      const max = weightUnit === "kg" ? LIMITS.weightKg : LIMITS.weightLbs;
                      const val = clampNumericInput(
                        e.target.value,
                        max,
                        { decimal: true, onLimit: () => showLimit("Weight", max, weightUnit) },
                      );
                      if (weightUnit === "kg") setWeightKg(val);
                      else setWeightLbs(val);
                    }}
                  />
                </div>
              </div>

              <div className="stack gap-sm" style={{ marginTop: 28 }}>
                <button className="btn btn-primary btn-block btn-lg" onClick={() => setStep("ready")}>
                  Continue <IconArrowRight width={18} height={18} />
                </button>
                <button className="btn btn-ghost" onClick={() => setStep("ready")}>Skip</button>
              </div>
            </Slide>
          )}

          {step === "ready" && (
            <Slide key="ready">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 140, damping: 12 }}>
                  <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(115,253,156,0.12)", display: "grid", placeItems: "center", boxShadow: "var(--glow-mint)" }}>
                    <IconSparkle width={44} height={44} style={{ color: "var(--color-mint-active)" }} />
                  </div>
                </motion.div>
              </div>
              <h1 style={h1}>You&apos;re all set! ✨</h1>
              <p style={sub}>
                Your personalised dashboard is ready. Start exploring your yoga, movement, and practice tracker.
              </p>
              <div className="stack gap-sm" style={{ marginTop: 26 }}>
                <button className="btn btn-primary btn-block btn-lg" onClick={finish}>
                  Explore my dashboard <IconArrowRight width={18} height={18} />
                </button>
              </div>
            </Slide>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: "relative", zIndex: 1, width: "100%" }}
    >
      {children}
    </motion.div>
  );
}

function ResultCard({ scores, primary }: { scores: Record<Dosha, number>; primary: Dosha }) {
  const info = DOSHA_INFO[primary];
  const bars: Dosha[] = ["vata", "pitta", "kapha"];
  return (
    <div style={{ textAlign: "center" }}>
      <div className="text-caption" style={{ letterSpacing: "0.2em", textTransform: "uppercase" }}>Your constitution</div>
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: "6px 0", color: info.color }}>{info.name}</h1>
      <p className="text-caption" style={{ marginBottom: 4 }}>{info.element}</p>
      <p style={{ ...sub, marginTop: 10 }}>{info.blurb}</p>
      <div className="clay" style={{ padding: 18, marginTop: 22, textAlign: "left" }}>
        {bars.map((d) => (
          <div key={d} style={{ marginBottom: 12 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{d}</span>
              <span className="text-mono" style={{ color: DOSHA_INFO[d].color }}>{scores[d]}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: "var(--color-surface-main)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${scores[d]}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ height: "100%", borderRadius: 8, background: DOSHA_INFO[d].color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitNotice({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: "14px 0 0",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(239,140,140,0.36)",
        background: "rgba(239,140,140,0.1)",
        color: "#efb0b0",
        fontSize: 13,
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100dvh",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  background: "radial-gradient(130% 90% at 50% 0%, #12311f 0%, #0e150f 55%)",
};
const frame: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: 460,
  margin: "0 auto",
  padding: "calc(28px + env(safe-area-inset-top)) 22px 40px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 700, letterSpacing: 0, textAlign: "center" };
const sub: React.CSSProperties = { color: "var(--color-text-secondary)", fontSize: 15.5, lineHeight: 1.55, textAlign: "center", marginTop: 10 };
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" };
