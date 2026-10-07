"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconArrowRight } from "@/components/Icons";
import { Footprints, FileChartLine, BookOpenText, ReceiptText, Timer } from "lucide-react";
import { ROUTINE_PRESETS } from "@/lib/seed/routinePresets";

const TRAIN_COLOR = "var(--color-train)";
const YOGA_COLOR = "var(--color-yoga)";
const BREATH_COLOR = "var(--color-breathe)";
type RangeDays = 7 | 15 | 30;

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 Days" },
  { value: 15, label: "15 Days" },
  { value: 30, label: "30 Days" },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const localDayKey = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function HomePage() {
  const mounted = useMounted();
  const workouts = useStore((s) => s.workouts);
  const yoga = useStore((s) => s.yoga);
  const breath = useStore((s) => s.breath);
  const body = useStore((s) => s.body);
  const profile = useStore((s) => s.profile);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [presetToAdd, setPresetToAdd] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(15);
  const progressScrollRef = useRef<HTMLDivElement>(null);
  const activityScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryRange = new URLSearchParams(window.location.search).get("range");
      if (queryRange === "7" || queryRange === "15" || queryRange === "30") {
        setRangeDays(parseInt(queryRange, 10) as RangeDays);
      }
    }
  }, []);

  const handleSetRangeDays = (days: RangeDays) => {
    setRangeDays(days);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("range", days.toString());
      window.history.replaceState(null, "", url.toString());
    }
  };

  useEffect(() => {
    if (!mounted) return;
    // Delay slightly to ensure children are fully rendered and laid out
    const timer = setTimeout(() => {
      if (progressScrollRef.current) progressScrollRef.current.scrollLeft = progressScrollRef.current.scrollWidth;
      if (activityScrollRef.current) activityScrollRef.current.scrollLeft = activityScrollRef.current.scrollWidth;
    }, 10);
    return () => clearTimeout(timer);
  }, [mounted, rangeDays, workouts.length, yoga.length, breath.length]);

  if (!mounted) return <div className="page" />;

  const firstName = (profile.name || "there").trim().split(/\s+/)[0] || "there";

  const today = new Date();
  const days = Array.from({ length: rangeDays }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (rangeDays - 1 - i));
    return d;
  });
  const rangeKeys = days.map(localDayKey);
  const rangeKeySet = new Set(rangeKeys);
  const rangeLabel = `Last ${rangeDays} days`;

  // Get days where user did train or yoga
  const activeTrainDates = new Set(workouts.map(w => localDayKey(w.date)));
  const activeYogaDates = new Set(yoga.map(y => localDayKey(y.date)));
  const activeBreathDates = new Set(breath.filter((b) => b.completed).map(b => localDayKey(b.date)));

  const trainCountByDay: Record<string, number> = {};
  const yogaCountByDay: Record<string, number> = {};
  const breathCountByDay: Record<string, number> = {};
  workouts.forEach(w => {
    const d = localDayKey(w.date);
    trainCountByDay[d] = (trainCountByDay[d] || 0) + 1;
  });
  yoga.forEach(y => {
    const d = localDayKey(y.date);
    yogaCountByDay[d] = (yogaCountByDay[d] || 0) + 1;
  });
  breath.filter((b) => b.completed).forEach(b => {
    const d = localDayKey(b.date);
    breathCountByDay[d] = (breathCountByDay[d] || 0) + 1;
  });
  const maxVal = Math.max(1, ...rangeKeys.map(d => (trainCountByDay[d] || 0) + (yogaCountByDay[d] || 0) + (breathCountByDay[d] || 0)));
  const hasGraphData = rangeKeys.some(d => (trainCountByDay[d] || 0) + (yogaCountByDay[d] || 0) + (breathCountByDay[d] || 0) > 0);
  const rangeTrain = rangeKeys.reduce((sum, d) => sum + (trainCountByDay[d] || 0), 0);
  const rangeYoga = rangeKeys.reduce((sum, d) => sum + (yogaCountByDay[d] || 0), 0);
  const rangeBreath = rangeKeys.reduce((sum, d) => sum + (breathCountByDay[d] || 0), 0);
  const activeDayCount = rangeKeys.filter((d) => (trainCountByDay[d] || 0) + (yogaCountByDay[d] || 0) + (breathCountByDay[d] || 0) > 0).length;
  const barSeries = [
    { key: "train", label: "Train", short: "T", color: TRAIN_COLOR, counts: trainCountByDay },
    { key: "yoga", label: "Yoga", short: "Y", color: YOGA_COLOR, counts: yogaCountByDay },
    { key: "breath", label: "Breathe", short: "B", color: BREATH_COLOR, counts: breathCountByDay },
  ] as const;
  const weightEntries = [...body]
    .filter((entry) => typeof entry.weight === "number" && entry.weight > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rangeWeightEntries = weightEntries.filter((entry) => rangeKeySet.has(localDayKey(entry.date)));
  const weightSeries = rangeWeightEntries.map((entry) => entry.weight || 0);
  const latestWeight = weightSeries[weightSeries.length - 1];
  const firstWeight = weightSeries[0];
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  return (
    <div className="page">
      <AppHeader title="Home" subtitle={`${greeting()}, ${firstName}`} />
      <RangeFilter value={rangeDays} onChange={handleSetRangeDays} />

      {/* Calendar View */}
      <div style={{ marginTop: 20, marginBottom: 28 }}>
        <div className="row between" style={{ alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
          <h3 className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>Your Progress</h3>
          <div className="text-caption" style={{ textAlign: "right" }}>{rangeLabel}</div>
        </div>
        <div
          ref={progressScrollRef}
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 10,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="hide-scrollbar"
        >
          {days.map((date, i) => {
            const dateString = localDayKey(date);
            const isActive = activeTrainDates.has(dateString) || activeYogaDates.has(dateString) || activeBreathDates.has(dateString);
            const isToday = i === rangeDays - 1;
            const tooltip = `${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}: ${
              isActive ? "activity logged" : "no activity logged"
            }`;

            return (
              <div
                key={dateString}
                className="clay"
                title={tooltip}
                aria-label={tooltip}
                style={{
                  minWidth: 58,
                  padding: "10px 5px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  border: isToday ? "1px solid var(--color-mint-active)" : "1px solid rgba(255,255,255,0.05)",
                  background: isToday ? "rgba(115,253,156,0.08)" : "var(--color-surface-main)",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? "var(--color-mint-active)" : "var(--color-text-primary)" }}>
                  {date.getDate()}
                </div>
                <div style={{ display: "flex", minHeight: 18, alignItems: "center", justifyContent: "center" }}>
                  {isActive ? (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 0.86, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "var(--color-mint-active)",
                        boxShadow: "0 0 10px rgba(115,253,156,0.5)",
                      }}
                    />
                  ) : (
                    <div
                      title="No activity logged"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--color-surface-3)",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-mint-active)", boxShadow: "0 0 10px rgba(115,253,156,0.4)" }} />
            Active day
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-surface-3)" }} />
            No activity
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      <div style={{ marginBottom: 28 }}>
        <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Activity Overview</h3>
        <div className="clay" style={{ padding: "18px 16px 14px", position: "relative" }}>
          <div style={{ marginBottom: 14 }}>
            <div className="text-caption">{rangeLabel} from your real logs</div>
          </div>
          <div ref={activityScrollRef} style={{ height: 178, position: "relative", overflowX: "auto", paddingBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "flex-end", height: 140, gap: 8, minWidth: Math.max(300, rangeDays * 34), position: "relative", zIndex: 1 }}>
              {rangeKeys.map((day) => {
                const isToday = day === localDayKey(new Date());
                return (
                  <div key={day} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: "100%", gap: 3 }}>
                      {(() => {
                        const total = (trainCountByDay[day] || 0) + (yogaCountByDay[day] || 0) + (breathCountByDay[day] || 0);
                        const height = total ? Math.max(22, (total / maxVal) * 112) : 8;
                        const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                        
                        return (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            title={`${dateLabel}: ${total} total sessions`}
                            style={{
                              width: "80%",
                              maxWidth: 24,
                              minWidth: 14,
                              borderRadius: 8,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "flex-end",
                              background: "var(--color-surface-3)",
                            }}
                          >
                            {total > 0 && [...barSeries].reverse().map((series) => {
                              const count = series.counts[day] || 0;
                              if (!count) return null;
                              return (
                                <div 
                                  key={series.key} 
                                  style={{ 
                                    height: `${Math.max(12, (count / total) * 100)}%`, 
                                    background: series.color 
                                  }} 
                                />
                              );
                            })}
                          </motion.div>
                        );
                      })()}
                    </div>
                    <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: isToday ? "var(--color-mint-active)" : "var(--color-text-muted)" }}>
                      {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${rangeDays}, 1fr)`, gap: 4 }}>
              {rangeKeys.map((d) => <div key={d} />)}
            </div>
          </div>
          {!hasGraphData && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--color-text-muted)", fontSize: 13, pointerEvents: "none", background: "rgba(14,21,15,0.2)" }}>
              Log a session to see your week
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 4, background: TRAIN_COLOR }} /> Train
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 4, background: YOGA_COLOR }} /> Yoga
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 4, background: BREATH_COLOR }} /> Breathe
          </div>
        </div>
      </div>

      {/* Weight Graph */}
      <div style={{ marginBottom: 28 }}>
        <div className="row between" style={{ alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
          <h3 className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>Weight Trend</h3>
        </div>
        <div className="clay" style={{ padding: "16px 16px 14px" }}>
          <div className="row between" style={{ alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div>
              <div className="text-caption">Latest result</div>
              <div className="text-mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--color-seafoam-calm)" }}>
                {latestWeight ? latestWeight.toFixed(1) : "-"}
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}> kg</span>
              </div>
            </div>
            {weightSeries.length > 1 && (
              <div className="pill" style={{ color: weightChange <= 0 ? "var(--color-mint-active)" : "var(--color-seafoam-calm)" }}>
                {weightChange === 0 ? "No change" : `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg`}
              </div>
            )}
          </div>
          {weightSeries.length > 1 ? (
            <WeightTrendChart entries={rangeWeightEntries} />
          ) : (
            <div style={{ minHeight: 136, display: "grid", placeItems: "center", textAlign: "center", color: "var(--color-text-muted)" }}>
              <div>
                <div style={{ fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 4 }}>No weight logged yet.</div>
                <div className="text-caption">Log at least two weights to see your chart.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Tools & Insights</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <QuickAction href="/report" title="Detailed Report" desc="Monthly activity and progress" Icon={FileChartLine} color="var(--color-mint-active)" />
        <QuickAction href="/library" title="Library" desc="Explore exercises and poses" Icon={BookOpenText} color="var(--color-mint-active)" />
        <QuickAction href="/fasting" title="Fasting" desc="Intermittent fasting timer" Icon={Timer} color="var(--color-tertiary)" />
        <QuickAction href="/logs" title="Exercise Logs" desc="View your completed routines" Icon={ReceiptText} color="var(--color-mint-active)" />
        <QuickAction href="/body" title="Weight Logs" desc="Track weight and progress" Icon={Footprints} color="var(--color-mint-active)" />
      </div>

      <h3 className="section-title" style={{ fontSize: 16, marginTop: 32, marginBottom: 12 }}>Routine Presets</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {ROUTINE_PRESETS.map((preset) => (
          <div
            key={preset.id}
            onClick={() => {
              setPresetToAdd(preset.id);
            }}
            className="card card-interactive"
            style={{
              padding: 0,
              position: "relative",
              overflow: "hidden",
              cursor: "pointer"
            }}
          >
            {preset.image && (
              <>
                <div style={{ position: "absolute", top: 0, right: 0, width: "65%", height: "100%", backgroundImage: `url(${preset.image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, pointerEvents: "none", WebkitMaskImage: "linear-gradient(to right, transparent, black 80%)", maskImage: "linear-gradient(to right, transparent, black 80%)" }} />
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(135deg, color-mix(in srgb, ${preset.accent} 10%, transparent) 0%, transparent 70%)`, pointerEvents: "none" }} />
              </>
            )}
            <div style={{ padding: 16, position: "relative", zIndex: 1, minHeight: 110, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ marginBottom: 6 }}>
                <span className="pill" style={{ color: preset.accent, borderColor: `color-mix(in srgb, ${preset.accent} 25%, transparent)`, background: `color-mix(in srgb, ${preset.accent} 8%, transparent)`, display: "inline-block" }}>{preset.category}</span>
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "var(--color-text-primary)", letterSpacing: "-0.2px" }}>{preset.name}</h4>
              
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 100 }} />

      {presetToAdd && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "grid", placeItems: "center", padding: 20 }}>
          <div className="card" style={{ width: "100%", maxWidth: 360, padding: 24, background: "var(--color-surface-main)", border: "1px solid var(--color-outline-main)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--color-text-primary)" }}>Add to Routine?</h3>
            <p className="text-caption" style={{ marginBottom: 24, fontSize: 14 }}>Do you want to add this preset to your weekly routine?</p>
            <div className="row gap-sm" style={{ justifyContent: "flex-end", alignItems: "center" }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPresetToAdd(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { router.push(`/routine?tab=presets&preset=${presetToAdd}`); setPresetToAdd(null); }}>Yes, Add it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RangeFilter({ value, onChange }: { value: RangeDays; onChange: (value: RangeDays) => void }) {
  return (
    <section className="clay" style={{ padding: 8, marginBottom: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`chip ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
            style={{ justifyContent: "center", minHeight: 38, paddingInline: 8 }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function WeightTrendChart({ entries, compact = false }: { entries: { date: string; weight?: number }[]; compact?: boolean }) {
  const width = 320;
  const height = compact ? 88 : 136;
  const padding = 14;
  const values = entries.map((entry) => entry.weight || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = entries.length === 1 ? width / 2 : padding + (index / (entries.length - 1)) * (width - padding * 2);
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - padding} L${points[0][0].toFixed(1)},${height - padding} Z`;
  const firstDate = new Date(entries[0].date);
  const lastDate = new Date(entries[entries.length - 1].date);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Logged weight trend chart" style={{ width: "100%", height: compact ? 96 : 150, display: "block" }}>
        {[0, 1, 2].map((row) => (
          <line
            key={row}
            x1={padding}
            x2={width - padding}
            y1={padding + row * ((height - padding * 2) / 2)}
            y2={padding + row * ((height - padding * 2) / 2)}
            stroke="rgba(134,148,135,0.18)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="rgba(143,212,255,0.12)" />
        <path d={line} fill="none" stroke="var(--color-mint-active)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], index) => (
          <circle key={`${entries[index].date}-${index}`} cx={x} cy={y} r={index === points.length - 1 ? 4 : 3} fill="var(--color-mint-active)" />
        ))}
      </svg>
      {!compact && (
        <div className="row between" style={{ marginTop: 4 }}>
          <span className="text-caption">{firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <span className="text-caption">{entries.length} logs</span>
          <span className="text-caption">{lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      )}
    </div>
  );
}

function QuickAction({ href, title, desc, Icon, color }: {
  href: string; title: string; desc: string; Icon: React.FC<{ width?: number; height?: number; strokeWidth?: number }>; color: string;
}) {
  return (
    <Link href={href} className="card card-interactive stack" style={{ padding: "18px 16px", minWidth: 0, justifyContent: "flex-start", gap: 12, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(135deg, color-mix(in srgb, ${color} 8%, transparent) 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`, display: "grid", placeItems: "center", color, flexShrink: 0 }}>
          <Icon width={22} height={22} strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.2px", color: "var(--color-text-primary)" }}>{title}</div>
          <div className="text-caption" style={{ fontSize: 13, lineHeight: 1.4, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {desc}
          </div>
        </div>
      </div>
    </Link>
  );
}
