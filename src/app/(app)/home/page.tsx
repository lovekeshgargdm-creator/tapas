"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconArrowRight, IconPatterns, IconBody, IconChartBar } from "@/components/Icons";

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
  const s = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(15);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [mounted]);

  if (!mounted) return <div className="page" />;

  const firstName = (s.profile.name || "there").trim().split(/\s+/)[0] || "there";

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
  const activeTrainDates = new Set(s.workouts.map(w => localDayKey(w.date)));
  const activeYogaDates = new Set(s.yoga.map(y => localDayKey(y.date)));
  const activeBreathDates = new Set(s.breath.filter((b) => b.completed).map(b => localDayKey(b.date)));

  const trainCountByDay: Record<string, number> = {};
  const yogaCountByDay: Record<string, number> = {};
  const breathCountByDay: Record<string, number> = {};
  s.workouts.forEach(w => {
    const d = localDayKey(w.date);
    trainCountByDay[d] = (trainCountByDay[d] || 0) + 1;
  });
  s.yoga.forEach(y => {
    const d = localDayKey(y.date);
    yogaCountByDay[d] = (yogaCountByDay[d] || 0) + 1;
  });
  s.breath.filter((b) => b.completed).forEach(b => {
    const d = localDayKey(b.date);
    breathCountByDay[d] = (breathCountByDay[d] || 0) + 1;
  });
  const maxVal = Math.max(1, ...rangeKeys.map(d => Math.max(trainCountByDay[d] || 0, yogaCountByDay[d] || 0, breathCountByDay[d] || 0)));
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
  const weightEntries = [...s.body]
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
      <div style={{ marginBottom: 20 }}>
        <InstallAppCard compact placement={`home:${s.profile.email || "guest"}`} />
      </div>
      <RangeFilter value={rangeDays} onChange={setRangeDays} />

      {/* Calendar View */}
      <div style={{ marginTop: 20, marginBottom: 28 }}>
        <div className="row between" style={{ alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
          <h3 className="section-title" style={{ fontSize: 16, marginBottom: 0 }}>Your Progress</h3>
          <div className="text-caption" style={{ textAlign: "right" }}>{rangeLabel}</div>
        </div>
        <div
          ref={scrollRef}
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
            const isToday = i === 13;
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
          <div style={{ height: 178, position: "relative", overflowX: "auto", paddingBottom: 2 }}>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 12 + row * 46,
                  height: 1,
                  background: "rgba(134,148,135,0.16)",
                }}
              />
            ))}
            <div style={{ display: "flex", alignItems: "flex-end", height: 140, gap: 8, minWidth: Math.max(300, rangeDays * 34), position: "relative", zIndex: 1 }}>
              {rangeKeys.map((day) => {
                const isToday = day === localDayKey(new Date());
                return (
                  <div key={day} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3 }}>
                      {barSeries.map((series, index) => {
                        const count = series.counts[day] || 0;
                        const height = count ? Math.max(16, (count / maxVal) * 112) : 4;
                        const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                        return (
                          <motion.div
                            key={series.key}
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
                            title={`${dateLabel}: ${count} ${series.label} ${count === 1 ? "session" : "sessions"}`}
                            aria-label={`${dateLabel}: ${count} ${series.label} ${count === 1 ? "session" : "sessions"}`}
                            style={{
                              width: "28%",
                              maxWidth: 14,
                              minWidth: 6,
                              borderRadius: "6px 6px 3px 3px",
                              background: count ? series.color : "var(--color-surface-3)",
                              boxShadow: count ? `0 0 14px ${series.color}33` : "none",
                            }}
                          />
                        );
                      })}
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
          <Link href="/body" className="text-caption" style={{ color: "var(--color-text-secondary)", fontWeight: 700 }}>
            Log Weight
          </Link>
        </div>
        <div className="clay" style={{ padding: "16px 16px 14px" }}>
          <div className="row between" style={{ alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div>
              <div className="text-caption">Latest result</div>
              <div className="text-mono" style={{ fontSize: 28, fontWeight: 800, color: "var(--color-breathe)" }}>
                {latestWeight ? latestWeight.toFixed(1) : "-"}
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}> kg</span>
              </div>
            </div>
            {weightSeries.length > 1 && (
              <div className="pill" style={{ color: weightChange <= 0 ? "var(--color-mint-active)" : "var(--color-breathe)" }}>
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
      <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Continue Your Practice</h3>
      <div className="stack gap-sm">
        <QuickAction href="/report" title="Detailed Report" desc="Monthly activity, progress, and weight insights" Icon={IconChartBar} color="#2ee5b5" />
        <QuickAction href="/library" title="Library" desc="Explore exercises, poses, and pranayam" Icon={IconPatterns} color="#73fd9c" />
        <QuickAction href="/body" title="Log Weight" desc="Track weight and progress" Icon={IconBody} color="var(--color-breathe)" />
      </div>
      <div style={{ height: 100 }} />
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
        <path d={line} fill="none" stroke="var(--color-breathe)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x, y], index) => (
          <circle key={`${entries[index].date}-${index}`} cx={x} cy={y} r={index === points.length - 1 ? 4 : 3} fill="var(--color-breathe)" />
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
  href: string; title: string; desc: string; Icon: React.FC<{ width?: number; height?: number }>; color: string;
}) {
  return (
    <Link href={href} className="card card-interactive" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-sage-gray)", display: "grid", placeItems: "center", color, flexShrink: 0 }}>
        <Icon width={24} height={24} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 17 }}>{title}</div>
        <div className="text-caption">{desc}</div>
      </div>
      <IconArrowRight width={18} height={18} style={{ color: "var(--color-text-muted)" }} />
    </Link>
  );
}
