"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "@/components/AppHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconDumbbell, IconYoga, IconArrowRight, IconRoutine, IconBody, IconBreathe } from "@/components/Icons";

const TRAIN_COLOR = "#73fd9c";
const YOGA_COLOR = "#2ee5b5";
const BREATH_COLOR = "#8fd4ff";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [mounted]);

  if (!mounted) return <div className="page" />;

  const firstName = (s.profile.name || "there").trim().split(/\s+/)[0] || "there";

  // Generate last 14 days for the calendar
  const today = new Date();
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    return d;
  });

  // Get days where user did train or yoga
  const activeTrainDates = new Set(s.workouts.map(w => localDayKey(w.date)));
  const activeYogaDates = new Set(s.yoga.map(y => localDayKey(y.date)));
  const activeBreathDates = new Set(s.breath.filter((b) => b.completed).map(b => localDayKey(b.date)));

  // Generate last 7 days for the graph
  const graphDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return localDayKey(d);
  });

  const trainCountByDay: Record<string, number> = {};
  const yogaCountByDay: Record<string, number> = {};
  s.workouts.forEach(w => {
    const d = localDayKey(w.date);
    trainCountByDay[d] = (trainCountByDay[d] || 0) + 1;
  });
  s.yoga.forEach(y => {
    const d = localDayKey(y.date);
    yogaCountByDay[d] = (yogaCountByDay[d] || 0) + 1;
  });
  const breathCountByDay: Record<string, number> = {};
  s.breath.filter((b) => b.completed).forEach(b => {
    const d = localDayKey(b.date);
    breathCountByDay[d] = (breathCountByDay[d] || 0) + 1;
  });

  const maxVal = Math.max(1, ...graphDays.map(d => Math.max(trainCountByDay[d] || 0, yogaCountByDay[d] || 0, breathCountByDay[d] || 0)));
  const hasGraphData = graphDays.some(d => (trainCountByDay[d] || 0) + (yogaCountByDay[d] || 0) + (breathCountByDay[d] || 0) > 0);

  return (
    <div className="page">
      <AppHeader title="Home" subtitle={`${greeting()}, ${firstName}`} />
      <div style={{ marginBottom: 20 }}>
        <InstallAppCard compact />
      </div>

      {/* Calendar View */}
      <div style={{ marginTop: 20, marginBottom: 28 }}>
        <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Your Progress</h3>
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
            const didTrain = activeTrainDates.has(dateString);
            const didYoga = activeYogaDates.has(dateString);
            const didBreath = activeBreathDates.has(dateString);
            const isActive = didTrain || didYoga || didBreath;
            const isToday = i === 13;

            return (
              <div
                key={dateString}
                className="clay"
                style={{
                  minWidth: 52,
                  padding: "10px 4px",
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
                <div style={{ display: "flex", gap: 3, height: 6 }}>
                  {didTrain && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: TRAIN_COLOR }}
                    />
                  )}
                  {didYoga && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: YOGA_COLOR }}
                    />
                  )}
                  {didBreath && (
                    <motion.div
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1 }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: BREATH_COLOR }}
                    />
                  )}
                  {!isActive && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-surface-3)" }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Graph */}
      <div style={{ marginBottom: 28 }}>
        <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Activity Overview</h3>
        <div className="clay" style={{ padding: "18px 16px 14px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-end", height: 150, gap: 10 }}>
            {graphDays.map(d => {
              const tCount = trainCountByDay[d] || 0;
              const yCount = yogaCountByDay[d] || 0;
              const bCount = breathCountByDay[d] || 0;
              const tHeight = (tCount / maxVal) * 100;
              const yHeight = (yCount / maxVal) * 100;
              const bHeight = (bCount / maxVal) * 100;
              const isToday = d === localDayKey(new Date());
              return (
                <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%", gap: 8 }}>
                  {/* Grouped bars: Train + Yoga side by side */}
                  <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", gap: 4 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: tCount > 0 ? `${tHeight}%` : 3 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{ width: 12, background: tCount > 0 ? TRAIN_COLOR : "var(--color-surface-3)", borderRadius: 4, minHeight: 3 }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: yCount > 0 ? `${yHeight}%` : 3 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                      style={{ width: 12, background: yCount > 0 ? YOGA_COLOR : "var(--color-surface-3)", borderRadius: 4, minHeight: 3 }}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: bCount > 0 ? `${bHeight}%` : 3 }}
                      transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                      style={{ width: 12, background: bCount > 0 ? BREATH_COLOR : "var(--color-surface-3)", borderRadius: 4, minHeight: 3 }}
                    />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "var(--color-mint-active)" : "var(--color-text-muted)" }}>
                    {new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
                  </div>
                </div>
              );
            })}
          </div>
          {!hasGraphData && (
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--color-text-muted)", fontSize: 13, pointerEvents: "none" }}>
              Log a session to see your week
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 12, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: TRAIN_COLOR }} /> Train
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: YOGA_COLOR }} /> Yoga
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)" }}>
            <div style={{ width: 11, height: 11, borderRadius: 3, background: BREATH_COLOR }} /> Breath
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Jump back in</h3>
      <div className="stack gap-sm">
        <QuickAction href="/routine" title="Routine" desc="Plan training and yoga together" Icon={IconRoutine} color="#73fd9c" />
        <QuickAction href="/library?tab=train" title="Training Exercises" desc="Browse strength movements" Icon={IconDumbbell} color="#73fd9c" />
        <QuickAction href="/library?tab=yoga" title="Yoga Asanas" desc="Browse poses and practice" Icon={IconYoga} color="#2ee5b5" />
        <QuickAction href="/library?tab=breathe" title="Pranayama" desc="Browse breathing practices" Icon={IconBreathe} color="#8fd4ff" />
        <QuickAction href="/body" title="Log Weight" desc="Track weight and progress" Icon={IconBody} color="#8fd4ff" />
      </div>
      <div style={{ height: 100 }} />
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
