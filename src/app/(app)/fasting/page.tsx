"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackHeader } from "@/components/BackHeader";
import { useStore, uid } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconCheck, IconClose, IconTrash, IconTimer, IconFlame } from "@/components/Icons";
import { Timer, Zap, Utensils, Clock, Trophy, TrendingUp, Target, CalendarDays } from "lucide-react";
import type { FastingProtocol, FastingSession } from "@/lib/types";

/* ─── Accent color for fasting module ─── */
const FAST_COLOR = "var(--color-tertiary)";
const FAST_COLOR_RAW_DARK = "#fde095";
const FAST_COLOR_RAW_LIGHT = "#8a5c00";

/* ─── Protocol definitions ─── */
const PROTOCOLS: {
  id: FastingProtocol;
  label: string;
  fastHours: number;
  eatHours: number;
  desc: string;
  icon: React.FC<{ width?: number; height?: number; strokeWidth?: number }>;
}[] = [
  { id: "16:8", label: "16 : 8", fastHours: 16, eatHours: 8, desc: "Most popular beginner method", icon: Timer },
  { id: "18:6", label: "18 : 6", fastHours: 18, eatHours: 6, desc: "Advanced daily fasting", icon: Clock },
  { id: "20:4", label: "20 : 4", fastHours: 20, eatHours: 4, desc: "Warrior Diet style", icon: Zap },
  { id: "OMAD", label: "OMAD", fastHours: 23, eatHours: 1, desc: "One Meal A Day", icon: Utensils },
  { id: "5:2", label: "5 : 2", fastHours: 24, eatHours: 0, desc: "2 days restrict / 5 normal", icon: CalendarDays },
  { id: "custom", label: "Custom", fastHours: 0, eatHours: 0, desc: "Pick your own duration", icon: Target },
];

type FilterKey = "all" | "7" | "15" | "30";

export default function FastingPage() {
  const mounted = useMounted();
  const fasting = useStore((s) => s.fasting || []);
  const startFast = useStore((s) => s.startFast);
  const endFast = useStore((s) => s.endFast);
  const deleteFast = useStore((s) => s.deleteFast);

  const [confirmProtocol, setConfirmProtocol] = useState<FastingProtocol | null>(null);
  const [customHours, setCustomHours] = useState("16");
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endNotes, setEndNotes] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [now, setNow] = useState(Date.now());

  const activeFast = useMemo(
    () => fasting.find((f) => !f.endedAt),
    [fasting],
  );

  // Live timer tick - only run if there is an active fast
  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const completedFasts = useMemo(
    () => fasting.filter((f) => f.endedAt).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [fasting],
  );

  const filteredFasts = useMemo(() => {
    if (filter === "all") return completedFasts;
    const days = parseInt(filter, 10);
    const cutoff = Date.now() - days * 86400000;
    return completedFasts.filter((f) => new Date(f.date).getTime() >= cutoff);
  }, [completedFasts, filter]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const completed = completedFasts.filter((f) => f.completed);
    const total = completedFasts.length;
    const totalCompleted = completed.length;
    const longestFast = completedFasts.reduce((max, f) => Math.max(max, f.actualHours || 0), 0);
    const avgHours = total > 0 ? completedFasts.reduce((sum, f) => sum + (f.actualHours || 0), 0) / total : 0;
    const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

    // Streak calculation
    let streak = 0;
    const sorted = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(sorted[i].date); d.setHours(0, 0, 0, 0);
      const expectedDay = new Date(today); expectedDay.setDate(today.getDate() - i);
      expectedDay.setHours(0, 0, 0, 0);
      if (d.getTime() === expectedDay.getTime()) streak++;
      else break;
    }

    return { total, totalCompleted, longestFast, avgHours, completionRate, streak };
  }, [completedFasts]);

  const handleStartFast = useCallback(
    (protocol: FastingProtocol, hours: number) => {
      startFast(protocol, hours);
      setConfirmProtocol(null);
      setCustomHours("16");
    },
    [startFast],
  );

  const handleEndFast = useCallback(() => {
    if (!endingId) return;
    endFast(endingId, endNotes || undefined);
    setEndingId(null);
    setEndNotes("");
  }, [endingId, endNotes, endFast]);

  if (!mounted) return <div className="page" />;

  /* ─── Active fast elapsed ─── */
  const elapsedMs = activeFast ? now - new Date(activeFast.startedAt).getTime() : 0;
  const elapsedHours = elapsedMs / 3600000;
  const elapsedH = Math.floor(elapsedHours);
  const elapsedM = Math.floor((elapsedMs % 3600000) / 60000);
  const elapsedS = Math.floor((elapsedMs % 60000) / 1000);
  const progress = activeFast ? Math.min(elapsedHours / activeFast.targetHours, 1) : 0;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <BackHeader title="Fasting" subtitle="Intermittent fasting tracker" fallback="/home" />

      {/* ═══════ Active Fast Banner ═══════ */}
      <AnimatePresence>
        {activeFast && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="card"
            style={{
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
              border: `1px solid color-mix(in srgb, ${FAST_COLOR} 30%, transparent)`,
            }}
          >
            {/* Ambient glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${FAST_COLOR} 12%, transparent) 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="pill pill-active" style={{
                  background: `color-mix(in srgb, ${FAST_COLOR} 14%, transparent)`,
                  color: FAST_COLOR,
                  borderColor: `color-mix(in srgb, ${FAST_COLOR} 28%, transparent)`,
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: FAST_COLOR }}
                  />
                  Fasting Active
                </div>
                <span className="text-caption">{activeFast.protocol}</span>
              </div>

              {/* Circular progress ring */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", width: 160, height: 160 }}>
                  <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, transform: "rotate(-90deg)" }}>
                    {/* Track */}
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
                    {/* Progress arc */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke={FAST_COLOR}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - progress)}
                      style={{ filter: `drop-shadow(0 0 8px ${FAST_COLOR_RAW_DARK})` }}
                    />
                  </svg>
                  {/* Center label */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <div className="text-mono" style={{ fontSize: 28, fontWeight: 800, color: FAST_COLOR, letterSpacing: "-0.5px" }}>
                      {String(elapsedH).padStart(2, "0")}:{String(elapsedM).padStart(2, "0")}
                    </div>
                    <div className="text-mono" style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                      :{String(elapsedS).padStart(2, "0")}
                    </div>
                    <div className="text-caption" style={{ marginTop: 4 }}>
                      of {activeFast.targetHours}h target
                    </div>
                  </div>
                </div>

                {/* Progress info */}
                <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div className="text-caption">Elapsed</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{elapsedHours.toFixed(1)}h</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="text-caption">Remaining</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {Math.max(0, activeFast.targetHours - elapsedHours).toFixed(1)}h
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div className="text-caption">Progress</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: FAST_COLOR }}>
                      {Math.round(progress * 100)}%
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => { setEndingId(activeFast.id); setEndNotes(""); }}
                  style={{ width: "100%", maxWidth: 280, background: FAST_COLOR, color: "var(--color-on-tertiary)" }}
                >
                  <IconTimer width={18} height={18} /> End Fast
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════ Start a New Fast — Protocol Picker ═══════ */}
      {!activeFast && (
        <section style={{ marginBottom: 28 }}>
          <h2 className="section-title" style={{ fontSize: 16, marginBottom: 14 }}>Start a Fast</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {PROTOCOLS.map((p) => {
              const Icon = p.icon;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  className="card card-interactive"
                  onClick={() => setConfirmProtocol(p.id)}
                  style={{
                    textAlign: "left",
                    padding: 0,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Gradient overlay */}
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(135deg, color-mix(in srgb, ${FAST_COLOR} 8%, transparent) 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />
                  <div style={{ padding: "18px 16px", position: "relative", zIndex: 1 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: `color-mix(in srgb, ${FAST_COLOR} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${FAST_COLOR} 15%, transparent)`,
                      display: "grid",
                      placeItems: "center",
                      color: FAST_COLOR,
                      marginBottom: 12,
                    }}>
                      <Icon width={21} height={21} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px", marginBottom: 2 }}>
                      {p.label}
                    </div>
                    {p.id !== "custom" && p.id !== "5:2" && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: FAST_COLOR, marginBottom: 4 }}>
                        {p.fastHours}h fast · {p.eatHours}h eat
                      </div>
                    )}
                    {p.id === "5:2" && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: FAST_COLOR, marginBottom: 4 }}>
                        24h fasting day
                      </div>
                    )}
                    <div className="text-caption" style={{ fontSize: 12, lineHeight: 1.3 }}>{p.desc}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════ Stats Summary ═══════ */}
      <section style={{ marginBottom: 28 }}>
        <h2 className="section-title" style={{ fontSize: 16, marginBottom: 14 }}>Fasting Stats</h2>
        <div className="card" style={{ padding: "20px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <StatItem icon={<Trophy width={18} height={18} />} label="Completed" value={String(stats.totalCompleted)} color={FAST_COLOR} />
            <StatItem icon={<IconFlame width={18} height={18} />} label="Streak" value={`${stats.streak}d`} color={FAST_COLOR} />
            <StatItem icon={<TrendingUp width={18} height={18} />} label="Longest" value={`${stats.longestFast.toFixed(1)}h`} color={FAST_COLOR} />
          </div>
          <div style={{ height: 1, background: "var(--color-outline-muted)", margin: "16px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <StatItem icon={<Clock width={18} height={18} />} label="Avg Duration" value={`${stats.avgHours.toFixed(1)}h`} color={FAST_COLOR} />
            <StatItem icon={<Target width={18} height={18} />} label="Completion" value={`${stats.completionRate}%`} color={FAST_COLOR} />
          </div>
        </div>
      </section>

      {/* ═══════ Fasting History ═══════ */}
      <section>
        <div className="row between" style={{ marginBottom: 12, gap: 12 }}>
          <h2 className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>History</h2>
          <div className="row gap-xs" style={{ flexShrink: 0 }}>
            {(["all", "7", "15", "30"] as FilterKey[]).map((id) => (
              <button
                key={id}
                className={`chip ${filter === id ? "active" : ""}`}
                onClick={() => setFilter(id)}
                style={{ minHeight: 30, padding: "5px 9px", fontSize: 11 }}
              >
                {id === "all" ? "All" : `${id}d`}
              </button>
            ))}
          </div>
        </div>
        {filteredFasts.length > 0 ? (
          <div className="card" style={{ padding: "4px 16px" }}>
            {filteredFasts.map((f, i) => (
              <FastingLogRow key={f.id} fast={f} onDelete={deleteFast} isLast={i === filteredFasts.length - 1} accentColor={FAST_COLOR} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--color-surface-3)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              color: "var(--color-text-muted)",
            }}>
              <Timer width={24} height={24} />
            </div>
            <p className="text-caption" style={{ fontSize: 14 }}>No fasting sessions yet</p>
          </div>
        )}
      </section>

      {/* ═══════ Confirm Start Modal ═══════ */}
      <AnimatePresence>
        {confirmProtocol && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 20,
            }}
            onClick={() => setConfirmProtocol(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 24,
                background: "var(--color-surface-main)",
                border: `1px solid color-mix(in srgb, ${FAST_COLOR} 25%, var(--color-outline))`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              {(() => {
                const p = PROTOCOLS.find((x) => x.id === confirmProtocol)!;
                const isCustom = confirmProtocol === "custom";
                const hours = isCustom ? parseFloat(customHours) || 16 : p.fastHours;
                return (
                  <>
                    <div className="row gap-sm" style={{ marginBottom: 16 }}>
                      <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `color-mix(in srgb, ${FAST_COLOR} 10%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${FAST_COLOR} 15%, transparent)`,
                        display: "grid",
                        placeItems: "center",
                        color: FAST_COLOR,
                        flexShrink: 0,
                      }}>
                        <p.icon width={21} height={21} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)" }}>
                          {p.label} Fast
                        </h3>
                        <p className="text-caption">{p.desc}</p>
                      </div>
                    </div>
                    {isCustom && (
                      <div style={{ marginBottom: 16 }}>
                        <label className="text-caption" style={{ display: "block", marginBottom: 6 }}>
                          Fasting duration (hours)
                        </label>
                        <input
                          type="number"
                          className="input"
                          min="1"
                          max="72"
                          value={customHours}
                          onChange={(e) => setCustomHours(e.target.value)}
                          inputMode="decimal"
                          style={{ textAlign: "center", fontSize: 20, fontWeight: 700 }}
                        />
                      </div>
                    )}
                    {!isCustom && (
                      <div className="clay" style={{ padding: 14, marginBottom: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: FAST_COLOR }}>{hours}h</div>
                        <div className="text-caption">fasting window</div>
                      </div>
                    )}
                    <div className="row gap-sm">
                      <button
                        className="btn btn-ghost"
                        style={{ flex: 1 }}
                        onClick={() => setConfirmProtocol(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, background: FAST_COLOR, color: "var(--color-on-tertiary)" }}
                        onClick={() => handleStartFast(confirmProtocol, hours)}
                        disabled={isCustom && (!hours || hours < 1 || hours > 72)}
                      >
                        Start Fast
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ End Fast Modal ═══════ */}
      <AnimatePresence>
        {endingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.6)",
              display: "grid",
              placeItems: "center",
              padding: 20,
            }}
            onClick={() => setEndingId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="card"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 360,
                padding: 24,
                background: "var(--color-surface-main)",
                border: `1px solid color-mix(in srgb, ${FAST_COLOR} 25%, var(--color-outline))`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--color-text-primary)" }}>
                End Fast?
              </h3>
              <p className="text-caption" style={{ marginBottom: 8, fontSize: 14 }}>
                You&apos;ve been fasting for <strong style={{ color: FAST_COLOR }}>{elapsedHours.toFixed(1)}h</strong>.
                {progress >= 1 ? (
                  <span style={{ color: "var(--color-status-success)" }}> You&apos;ve reached your target! 🎉</span>
                ) : (
                  <span> Target is {activeFast?.targetHours}h ({Math.round(progress * 100)}% done).</span>
                )}
              </p>
              <textarea
                className="input"
                placeholder="Add a note (optional)..."
                rows={2}
                value={endNotes}
                onChange={(e) => setEndNotes(e.target.value)}
                style={{ marginBottom: 16, resize: "vertical" }}
              />
              <div className="row gap-sm">
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEndingId(null)}>
                  Keep Going
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, background: FAST_COLOR, color: "var(--color-on-tertiary)" }}
                  onClick={handleEndFast}
                >
                  <IconCheck width={18} height={18} /> End Fast
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────── Sub-components ─────── */

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 12%, transparent)`,
        display: "grid",
        placeItems: "center",
        color,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
        {value}
      </div>
      <div className="text-caption" style={{ fontSize: 11 }}>{label}</div>
    </div>
  );
}

function FastingLogRow({
  fast,
  onDelete,
  isLast,
  accentColor,
}: {
  fast: FastingSession;
  onDelete: (id: string) => void;
  isLast: boolean;
  accentColor: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const dateLabel = new Date(fast.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ padding: "14px 0", borderBottom: isLast ? "none" : "1px solid var(--color-outline-muted)" }}>
      <div className="row between" style={{ gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-sm" style={{ marginBottom: 4 }}>
            <span className="pill" style={{
              background: fast.completed
                ? "rgba(115,253,156,0.12)"
                : "var(--color-warning-soft-bg)",
              color: fast.completed
                ? "var(--color-status-success)"
                : "var(--color-warning-soft)",
              fontSize: 11,
              padding: "3px 8px",
              borderColor: fast.completed ? "rgba(115,253,156,0.25)" : "var(--color-warning-soft-border)",
              border: `1px solid ${fast.completed ? "rgba(115,253,156,0.25)" : "var(--color-warning-soft-border)"}`,
            }}>
              {fast.completed ? "✓ Complete" : "⚡ Early"}
            </span>
            <span className="pill" style={{ fontSize: 11, padding: "3px 8px" }}>{fast.protocol}</span>
          </div>
          <div className="text-caption" style={{ marginBottom: 2 }}>{dateLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: accentColor }}>{fast.actualHours?.toFixed(1)}h</span>
            <span className="muted"> / {fast.targetHours}h target</span>
          </div>
          {fast.notes && (
            <div className="text-caption" style={{ marginTop: 4, fontStyle: "italic", fontSize: 12 }}>
              {fast.notes}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {showConfirm ? (
            <div className="row gap-xs">
              <button
                className="icon-btn"
                aria-label="Confirm delete"
                onClick={() => onDelete(fast.id)}
                style={{ width: 34, height: 34, color: "var(--color-status-error)" }}
              >
                <IconCheck width={16} height={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Cancel delete"
                onClick={() => setShowConfirm(false)}
                style={{ width: 34, height: 34 }}
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
          ) : (
            <button
              className="icon-btn"
              aria-label="Delete fast"
              onClick={() => setShowConfirm(true)}
              style={{ width: 34, height: 34, color: "var(--color-text-muted)" }}
            >
              <IconTrash width={15} height={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
