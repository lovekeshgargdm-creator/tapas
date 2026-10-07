"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BackHeader } from "@/components/BackHeader";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconBody, IconBreathe, IconChartBar, IconDumbbell, IconYoga } from "@/components/Icons";

const TRAIN_COLOR = "var(--color-train)";
const YOGA_COLOR = "var(--color-yoga)";
const BREATH_COLOR = "var(--color-mint-active)";
type RangeDays = 7 | 15 | 30;

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 Days" },
  { value: 15, label: "15 Days" },
  { value: 30, label: "30 Days" },
];

const localDayKey = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export default function ReportPage() {
  const mounted = useMounted();
  const workouts = useStore((s) => s.workouts);
  const yoga = useStore((s) => s.yoga);
  const breath = useStore((s) => s.breath);
  const body = useStore((s) => s.body);
  const accountLogs = useStore((s) => s.accountLogs);
  
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialRange = searchParams ? (parseInt(searchParams.get("range") || "30", 10) as RangeDays) : 30;
  const [rangeDays, setRangeDaysState] = useState<RangeDays>(initialRange);

  const setRangeDays = (val: RangeDays) => {
    setRangeDaysState(val);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("range", val.toString());
      window.history.replaceState({}, "", url.toString());
    }
  };

  const report = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: rangeDays }).map((_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (rangeDays - 1 - index));
      return d;
    });
    const dayKeys = days.map(localDayKey);
    const daySet = new Set(dayKeys);
    const trainByDay: Record<string, number> = {};
    const yogaByDay: Record<string, number> = {};
    const breathByDay: Record<string, number> = {};
    const trainMinutesByDay: Record<string, number> = {};
    const yogaMinutesByDay: Record<string, number> = {};
    const breathMinutesByDay: Record<string, number> = {};

    workouts.forEach((workout) => {
      const key = localDayKey(workout.date);
      trainByDay[key] = (trainByDay[key] || 0) + 1;
      trainMinutesByDay[key] = (trainMinutesByDay[key] || 0) + workout.durationMin;
    });
    yoga.forEach((session) => {
      const key = localDayKey(session.date);
      yogaByDay[key] = (yogaByDay[key] || 0) + 1;
      yogaMinutesByDay[key] = (yogaMinutesByDay[key] || 0) + session.durationMin;
    });
    breath.filter((session) => session.completed).forEach((session) => {
      const key = localDayKey(session.date);
      breathByDay[key] = (breathByDay[key] || 0) + 1;
      breathMinutesByDay[key] = (breathMinutesByDay[key] || 0) + Math.round(session.durationSec / 60);
    });

    const rangeWorkouts = workouts.filter((item) => daySet.has(localDayKey(item.date)));
    const rangeYoga = yoga.filter((item) => daySet.has(localDayKey(item.date)));
    const rangeBreath = breath.filter((item) => item.completed && daySet.has(localDayKey(item.date)));
    const rangeWeights = body
      .filter((entry) => daySet.has(localDayKey(entry.date)) && typeof entry.weight === "number" && entry.weight > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const activeDays = dayKeys.filter((key) => (trainByDay[key] || 0) + (yogaByDay[key] || 0) + (breathByDay[key] || 0) > 0);
    const trainingVolume = rangeWorkouts.reduce((sum, workout) => sum + workout.volume, 0);
    const trainMinutes = rangeWorkouts.reduce((sum, workout) => sum + workout.durationMin, 0);
    const yogaMinutes = rangeYoga.reduce((sum, session) => sum + session.durationMin, 0);
    const breathMinutes = rangeBreath.reduce((sum, session) => sum + Math.round(session.durationSec / 60), 0);
    const totalSessions = rangeWorkouts.length + rangeYoga.length + rangeBreath.length;
    const weights = rangeWeights.map((entry) => entry.weight || 0);
    const weightChange = weights.length > 1 ? weights[weights.length - 1] - weights[0] : 0;
    const allDates = [
      ...accountLogs.map((item) => item.date),
      ...workouts.map((item) => item.date),
      ...yoga.map((item) => item.date),
      ...breath.map((item) => item.date),
      ...body.map((item) => item.date),
    ].filter(Boolean);
    const accountStart = allDates.length
      ? new Date(Math.min(...allDates.map((date) => new Date(date).getTime())))
      : today;
    const accountAgeDays = Math.max(1, Math.floor((new Date(localDayKey(today)).getTime() - new Date(localDayKey(accountStart)).getTime()) / 86400000) + 1);
    const monthReports = buildMonthReports(dayKeys, trainByDay, yogaByDay, breathByDay, rangeWeights);

    return {
      days,
      dayKeys,
      trainByDay,
      yogaByDay,
      breathByDay,
      trainMinutesByDay,
      yogaMinutesByDay,
      breathMinutesByDay,
      activeDays,
      rangeWorkouts,
      rangeYoga,
      rangeBreath,
      rangeWeights,
      totalSessions,
      trainingVolume,
      trainMinutes,
      yogaMinutes,
      breathMinutes,
      weightChange,
      accountAgeDays,
      monthReports,
      noData: totalSessions === 0 && rangeWeights.length === 0,
    };
  }, [rangeDays, workouts, yoga, breath, body, accountLogs]);

  if (!mounted) return <div className="page" />;

  const rangeLabel = rangeDays === 30 ? "Last 30 days" : `Last ${rangeDays} days`;
  const enoughHistory = report.accountAgeDays >= 7;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <BackHeader
        title="Detailed Report"
        fallback="/home"
      />

      <RangeFilter value={rangeDays} onChange={setRangeDays} />

      {(!enoughHistory || report.noData) && (
        <section className="card" style={{ marginBottom: 18, border: "1px solid rgba(115,253,156,0.28)", background: "var(--color-surface-3)" }}>
          <div style={{ fontWeight: 800, color: "var(--color-mint-active)", marginBottom: 6 }}>
            {report.noData ? "No data available" : "Report warming up"}
          </div>
          <p className="text-caption" style={{ lineHeight: 1.55 }}>
            Minimum 7 days of data is needed since account creation for a reliable report.
            Your account history currently has {report.accountAgeDays} day{report.accountAgeDays === 1 ? "" : "s"}.
          </p>
        </section>
      )}

      <section className="clay" style={{ padding: 16, marginBottom: 18 }}>
        <div className="text-caption" style={{ marginBottom: 12 }}>{rangeLabel} summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <MetricCard label="Active Days" value={`${report.activeDays.length}/${rangeDays}`} sub={`${Math.round((report.activeDays.length / rangeDays) * 100)}% consistency`} color="var(--color-mint-active)" />
          <MetricCard label="Sessions" value={`${report.totalSessions}`} sub={`${report.rangeWorkouts.length} train · ${report.rangeYoga.length} yoga · ${report.rangeBreath.length} breath`} color="var(--color-mint-active)" />
          <MetricCard label="Practice Time" value={formatDuration(report.trainMinutes + report.yogaMinutes + report.breathMinutes)} sub={`${formatDuration(report.trainMinutes)} train · ${formatDuration(report.yogaMinutes + report.breathMinutes)} mindful`} color="var(--color-mint-active)" />
          <MetricCard label="Weight" value={report.rangeWeights.length ? `${report.rangeWeights[report.rangeWeights.length - 1].weight?.toFixed(1)} kg` : "-"} sub={report.rangeWeights.length > 1 ? `${report.weightChange > 0 ? "+" : ""}${report.weightChange.toFixed(1)} kg change` : "Need 2 logs"} color="var(--color-mint-active)" />
        </div>
      </section>

      <ReportSection title="Progress Calendar" caption="Inactive days only in the selected period">
        <ProgressGrid days={report.dayKeys} activeDays={report.activeDays} />
      </ReportSection>

      <ReportSection title="Activity Overview" caption="Daily Train, Yoga, and Breathe sessions">
        <DailyActivityChart days={report.dayKeys} train={report.trainByDay} yoga={report.yogaByDay} breath={report.breathByDay} />
        <Legend />
      </ReportSection>

      <ReportSection title="Time Breakdown" caption="Minutes spent in each practice type">
        <BreakdownBars
          items={[
            { label: "Train", value: report.trainMinutes, color: TRAIN_COLOR, Icon: IconDumbbell },
            { label: "Yoga", value: report.yogaMinutes, color: YOGA_COLOR, Icon: IconYoga },
            { label: "Breath", value: report.breathMinutes, color: BREATH_COLOR, Icon: IconBreathe },
          ]}
        />
      </ReportSection>

      <ReportSection title="Weight Trend" caption="Filtered weight logs">
        {report.rangeWeights.length > 1 ? (
          <WeightTrendChart entries={report.rangeWeights} />
        ) : (
          <EmptyChart icon={<IconBody width={26} height={26} />} text="No weight chart yet. Log at least two weights in this range." />
        )}
      </ReportSection>

      <section style={{ marginBottom: 24 }}>
        <h2 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Month Wise Report</h2>
        <div className="stack gap-sm">
          {report.monthReports.map((month) => {
            const sessions = month.train + month.yoga + month.breath;
            const weightChange = month.weights.length > 1 ? (month.weights[month.weights.length - 1].weight || 0) - (month.weights[0].weight || 0) : 0;
            return (
              <div className="card" key={month.key} style={{ padding: 14 }}>
                <div className="row between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{month.label}</div>
                    <div className="text-caption" style={{ marginTop: 2 }}>{month.activeDays}/{month.days.length} active days</div>
                  </div>
                  <span className="pill">{sessions} sessions</span>
                </div>
                <BreakdownBars
                  compact
                  items={[
                    { label: "Train", value: month.train, color: TRAIN_COLOR, Icon: IconDumbbell },
                    { label: "Yoga", value: month.yoga, color: YOGA_COLOR, Icon: IconYoga },
                    { label: "Breath", value: month.breath, color: BREATH_COLOR, Icon: IconBreathe },
                  ]}
                />
                <div className="text-caption" style={{ marginTop: 10 }}>
                  Weight: {month.weights.length > 1 ? `${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : `${month.weights.length} log${month.weights.length === 1 ? "" : "s"}`}
                </div>
                <div style={{ marginTop: 14 }}>
                  <Link href={`/report/${month.key}`} className="btn btn-primary btn-block" style={{ minHeight: 40, fontSize: 14 }}>
                    View full report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RangeFilter({ value, onChange }: { value: RangeDays; onChange: (value: RangeDays) => void }) {
  return (
    <section className="clay" style={{ padding: 8, marginBottom: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {RANGE_OPTIONS.map((option) => (
          <button key={option.value} className={`chip ${value === option.value ? "active" : ""}`} onClick={() => onChange(option.value)} style={{ justifyContent: "center" }}>
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card" style={{ padding: 12, minWidth: 0 }}>
      <div className="text-caption">{label}</div>
      <div className="text-mono" style={{ color, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
      <div className="text-caption" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}

function ReportSection({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ marginBottom: 18, padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800 }}>{title}</h2>
        <div className="text-caption" style={{ marginTop: 2 }}>{caption}</div>
      </div>
      {children}
    </section>
  );
}

function ProgressGrid({ days, activeDays }: { days: string[]; activeDays: string[] }) {
  const active = new Set(activeDays);
  const inactiveDays = days.filter((day) => !active.has(day));
  const inactiveGroups = groupConsecutiveDays(inactiveDays);

  if (inactiveDays.length === 0) {
    return (
      <div style={{ minHeight: 96, display: "grid", placeItems: "center", textAlign: "center", color: "var(--color-text-secondary)" }}>
        <div>
          <div style={{ fontWeight: 800, color: "var(--color-mint-active)", marginBottom: 4 }}>No inactive days</div>
          <div className="text-caption">Every day in this range has logged activity.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row between" style={{ gap: 10, marginBottom: 10 }}>
        <span className="pill">{inactiveDays.length} inactive day{inactiveDays.length === 1 ? "" : "s"}</span>
        <span className="text-caption">{inactiveGroups.length} gap{inactiveGroups.length === 1 ? "" : "s"}</span>
      </div>
      <div className="stack gap-xs" style={{ maxHeight: 168, overflowY: "auto", paddingRight: 2 }}>
        {inactiveGroups.map((group) => {
          const start = new Date(`${group[0]}T12:00:00`);
          const end = new Date(`${group[group.length - 1]}T12:00:00`);
          const startLabel = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const endLabel = end.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const label = group.length === 1 ? startLabel : `${startLabel} - ${endLabel}`;
        return (
          <div
            key={group[0]}
            title={label}
            aria-label={`${label}: inactive ${group.length === 1 ? "day" : "range"}`}
            style={{
              minHeight: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              background: "var(--color-surface-main)",
              color: "var(--color-text-muted)",
              padding: "9px 11px",
              border: "1px solid var(--color-outline-muted)",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--color-text-secondary)" }}>{label}</span>
            <span className="text-caption" style={{ flexShrink: 0 }}>{group.length} day{group.length === 1 ? "" : "s"}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function groupConsecutiveDays(days: string[]) {
  return days.reduce<string[][]>((groups, day) => {
    const lastGroup = groups[groups.length - 1];
    const previous = lastGroup?.[lastGroup.length - 1];
    const isNext =
      previous &&
      (new Date(`${day}T12:00:00`).getTime() - new Date(`${previous}T12:00:00`).getTime()) / 86400000 === 1;
    if (lastGroup && isNext) lastGroup.push(day);
    else groups.push([day]);
    return groups;
  }, []);
}

function DailyActivityChart({ days, train, yoga, breath }: { days: string[]; train: Record<string, number>; yoga: Record<string, number>; breath: Record<string, number> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [days]);
  const max = Math.max(1, ...days.map((day) => (train[day] || 0) + (yoga[day] || 0) + (breath[day] || 0)));
  return (
    <div ref={scrollRef} style={{ position: "relative", overflowX: "auto", paddingBottom: 2, paddingTop: 10 }}>
      <div style={{ height: 140, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: 8, minWidth: Math.max(300, days.length * 34), position: "relative", zIndex: 1 }}>
          {days.map((day) => {
            const isToday = day === localDayKey(new Date());
            const total = (train[day] || 0) + (yoga[day] || 0) + (breath[day] || 0);
            const height = total ? Math.max(22, (total / max) * 112) : 8;
            const dateLabel = new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            return (
              <div key={day} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: "100%", gap: 3 }}>
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
                    {total > 0 && [
                      { key: 'breath', value: breath[day] || 0, color: BREATH_COLOR },
                      { key: 'yoga', value: yoga[day] || 0, color: YOGA_COLOR },
                      { key: 'train', value: train[day] || 0, color: TRAIN_COLOR }
                    ].map((series) => {
                      if (!series.value) return null;
                      return (
                        <div 
                          key={series.key} 
                          style={{ 
                            height: `${Math.max(12, (series.value / total) * 100)}%`, 
                            background: series.color 
                          }} 
                        />
                      );
                    })}
                  </motion.div>
                </div>
                <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: isToday ? "var(--color-mint-active)" : "var(--color-text-muted)" }}>
                  {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="row center gap-sm" style={{ marginTop: 4, flexWrap: "wrap" }}>
      <LegendItem label="Train" color={TRAIN_COLOR} />
      <LegendItem label="Yoga" color={YOGA_COLOR} />
      <LegendItem label="Breath" color={BREATH_COLOR} />
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-caption row gap-xs">
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {label}
    </span>
  );
}

function BreakdownBars({
  items,
  compact = false,
}: {
  items: { label: string; value: number; color: string; Icon: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }> }[];
  compact?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div style={{ display: "grid", gap: compact ? 8 : 12 }}>
      {items.map(({ label, value, color, Icon }) => (
        <div key={label} style={{ display: "grid", gridTemplateColumns: compact ? "64px 1fr 34px" : "86px 1fr 46px", gap: 8, alignItems: "center" }}>
          <span className="text-caption row gap-xs" style={{ minWidth: 0 }}>
            <Icon width={14} height={14} style={{ color }} /> {label}
          </span>
          <div style={{ height: compact ? 8 : 11, borderRadius: 999, background: "var(--color-surface-3)", overflow: "hidden" }}>
            <div style={{ width: `${value ? Math.max(5, (value / max) * 100) : 0}%`, height: "100%", background: color, borderRadius: 999 }} />
          </div>
          <span className="text-caption text-mono" style={{ textAlign: "right" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function WeightTrendChart({ entries }: { entries: { date: string; weight?: number }[] }) {
  const width = 320;
  const height = 136;
  const padding = 14;
  const values = entries.map((entry) => entry.weight || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => {
    const x = padding + (index / (entries.length - 1)) * (width - padding * 2);
    const y = padding + ((max - value) / range) * (height - padding * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weight trend chart" style={{ width: "100%", height: 150, display: "block" }}>
      {[0, 1, 2].map((row) => (
        <line key={row} x1={padding} x2={width - padding} y1={padding + row * ((height - padding * 2) / 2)} y2={padding + row * ((height - padding * 2) / 2)} stroke="rgba(134,148,135,0.18)" />
      ))}
      <path d={line} fill="none" stroke="var(--color-mint-active)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={index === points.length - 1 ? 4 : 3} fill="var(--color-mint-active)" />)}
    </svg>
  );
}

function EmptyChart({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ minHeight: 128, display: "grid", placeItems: "center", textAlign: "center", color: "var(--color-text-muted)" }}>
      <div>
        <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}>{icon}</div>
        <div className="text-caption">{text}</div>
      </div>
    </div>
  );
}

function buildMonthReports(
  days: string[],
  trainByDay: Record<string, number>,
  yogaByDay: Record<string, number>,
  breathByDay: Record<string, number>,
  weights: { date: string; weight?: number }[],
) {
  const reports = new Map<string, { key: string; label: string; days: string[]; activeDays: number; train: number; yoga: number; breath: number; weights: { date: string; weight?: number }[] }>();
  days.forEach((day) => {
    const date = new Date(`${day}T12:00:00`);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = reports.get(key) || {
      key,
      label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      days: [],
      activeDays: 0,
      train: 0,
      yoga: 0,
      breath: 0,
      weights: [],
    };
    current.days.push(day);
    current.train += trainByDay[day] || 0;
    current.yoga += yogaByDay[day] || 0;
    current.breath += breathByDay[day] || 0;
    if ((trainByDay[day] || 0) + (yogaByDay[day] || 0) + (breathByDay[day] || 0) > 0) current.activeDays += 1;
    reports.set(key, current);
  });
  weights.forEach((entry) => {
    const date = new Date(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    reports.get(key)?.weights.push(entry);
  });
  return Array.from(reports.values());
}
