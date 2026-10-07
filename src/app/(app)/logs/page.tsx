"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BackHeader } from "@/components/BackHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconTrash, IconTimer, IconDumbbell, IconActivity, IconYoga, IconBreathe, IconRepeat, IconMove } from "@/components/Icons";

type RangeDays = 7 | 15 | 30;

const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: "7 Days" },
  { value: 15, label: "15 Days" },
  { value: 30, label: "30 Days" },
];

export default function LogsPage() {
  const mounted = useMounted();
  const workouts = useStore((s) => s.workouts);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const [rangeDays, setRangeDays] = useState<RangeDays>(15);
  const [specificDate, setSpecificDate] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const queryRange = urlParams.get("range");
      if (queryRange === "7" || queryRange === "15" || queryRange === "30") {
        setRangeDays(parseInt(queryRange, 10) as RangeDays);
      }
      const queryDate = urlParams.get("date");
      if (queryDate) {
        setSpecificDate(queryDate);
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

  const handleSetSpecificDate = (date: string) => {
    setSpecificDate(date);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (date) {
        url.searchParams.set("date", date);
      } else {
        url.searchParams.delete("date");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  if (!mounted) return <div className="page" />;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - rangeDays);
  cutoffDate.setHours(0, 0, 0, 0);

  const filteredWorkouts = workouts.filter((w) => {
    if (specificDate) {
      return w.date.startsWith(specificDate);
    }
    const d = new Date(w.date);
    return d >= cutoffDate;
  });

  return (
    <div className="page">
      <BackHeader 
        title="Exercise Logs" 
        subtitle="Your completed routines" 
        fallback="/home" 
      />
      
      <section className="clay" style={{ padding: "14px 12px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div className="text-caption" style={{ fontWeight: 600, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Specific Date</div>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            {!specificDate && (
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none", fontSize: 16 }}>
                Select date...
              </div>
            )}
            <input 
              type="date" 
              className="input" 
              value={specificDate} 
              onChange={(e) => handleSetSpecificDate(e.target.value)}
              style={{ 
                display: "block",
                width: "100%", 
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "10px 16px",
                minHeight: 44,
                color: specificDate ? "var(--color-text-primary)" : "rgba(0,0,0,0)",
                appearance: "none",
                WebkitAppearance: "none",
                margin: 0
              }} 
            />
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`chip ${!specificDate && rangeDays === option.value ? "active" : ""}`}
              onClick={() => {
                handleSetSpecificDate("");
                handleSetRangeDays(option.value);
              }}
              style={{ justifyContent: "center", minHeight: 44, paddingInline: 8 }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className="stack gap-sm" style={{ paddingBottom: 100 }}>
        {filteredWorkouts.length === 0 ? (
          <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-surface-3)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "var(--color-text-muted)" }}>
              <IconActivity width={24} height={24} />
            </div>
            <p className="text-caption" style={{ fontSize: 14, marginBottom: 20 }}>Not found</p>
            <Link href="/report" className="btn btn-primary" style={{ display: "inline-flex" }}>
              View full report
            </Link>
          </div>
        ) : (
          filteredWorkouts.map((w) => {
            const dateStr = new Date(w.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            });
            const totalItems = w.exercises.length + (w.timedItems?.length || 0);
            const completedSets = w.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
            const completedAsanas = w.timedItems?.filter(i => i.type === "asana").length || 0;
            const completedBreaths = w.timedItems?.filter(i => i.type === "pranayama").length || 0;
            
            return (
              <div key={w.id} className="card" style={{ padding: 16 }}>
                <div className="row between" style={{ alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: "var(--color-train)", marginBottom: 2 }}>
                      {w.name}
                    </div>
                    <div className="text-caption" style={{ textTransform: "capitalize" }}>
                      {dateStr}
                    </div>
                  </div>
                  <button 
                    className="icon-btn" 
                    onClick={() => {
                      if (window.confirm("Delete this log?")) {
                        deleteWorkout(w.id);
                      }
                    }}
                    aria-label="Delete log"
                    title="Delete"
                    style={{ color: "var(--color-error, #ff6b6b)", width: 36, height: 36 }}
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
                
                <div style={{ padding: "12px 14px", background: "var(--color-surface-3)", borderRadius: 12 }}>
                  <div className="text-caption" style={{ fontWeight: 700, marginBottom: 8, color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between" }}>
                    <span>Items ({totalItems})</span>
                    <span><IconTimer width={12} height={12} style={{marginRight: 4, verticalAlign: "-2px"}}/>{w.durationMin} min</span>
                  </div>
                  <div className="stack gap-xs">
                    {w.exercises.map((ex, i) => (
                      <div key={i} className="row between" style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ex.name}
                        </span>
                        <span className="text-mono" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {ex.sets.length} sets
                        </span>
                      </div>
                    ))}
                    {w.timedItems?.map((item, i) => (
                      <div key={`t-${i}`} className="row between" style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </span>
                        <span className="text-mono" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {Math.round(item.duration)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 24, padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="text-caption uppercase-label" style={{ textAlign: "center", color: "var(--color-text-muted)", letterSpacing: "1.5px", fontSize: 11 }}>Session Summary</div>
                  <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: "center", overflowX: "auto", gap: 12, paddingBottom: 8, WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
                    {w.exercises.length > 0 && (
                      <>
                        <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", background: "var(--color-background)", borderRadius: 16, gap: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ color: "var(--color-train)", background: "color-mix(in srgb, var(--color-train) 12%, transparent)", padding: 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconDumbbell width={20} height={20} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span className="text-mono" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--color-text-primary)" }}>{w.volume.toLocaleString()}</span>
                            <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>kg</span>
                          </div>
                        </div>
                        <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", background: "var(--color-background)", borderRadius: 16, gap: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ color: "var(--color-train)", background: "color-mix(in srgb, var(--color-train) 12%, transparent)", padding: 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconRepeat width={20} height={20} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span className="text-mono" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--color-text-primary)" }}>{completedSets}</span>
                            <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{completedSets === 1 ? 'set' : 'sets'}</span>
                          </div>
                        </div>
                        <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", background: "var(--color-background)", borderRadius: 16, gap: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ color: "var(--color-train)", background: "color-mix(in srgb, var(--color-train) 12%, transparent)", padding: 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <IconMove width={20} height={20} />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                            <span className="text-mono" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--color-text-primary)" }}>{w.exercises.length}</span>
                            <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{w.exercises.length === 1 ? 'exercise' : 'exercises'}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {completedAsanas > 0 && (
                      <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", background: "var(--color-background)", borderRadius: 16, gap: 10, position: "relative", overflow: "hidden" }}>
                        <div style={{ color: "var(--color-yoga)", background: "color-mix(in srgb, var(--color-yoga) 12%, transparent)", padding: 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconYoga width={20} height={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <span className="text-mono" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--color-text-primary)" }}>{completedAsanas}</span>
                          <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{completedAsanas === 1 ? 'pose' : 'poses'}</span>
                        </div>
                      </div>
                    )}
                    {completedBreaths > 0 && (
                      <div style={{ flex: "0 0 auto", minWidth: 80, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", background: "var(--color-background)", borderRadius: 16, gap: 10, position: "relative", overflow: "hidden" }}>
                        <div style={{ color: "var(--color-breathe)", background: "color-mix(in srgb, var(--color-breathe) 12%, transparent)", padding: 10, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconBreathe width={20} height={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <span className="text-mono" style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--color-text-primary)" }}>{completedBreaths}</span>
                          <span style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>{completedBreaths === 1 ? 'breath' : 'breaths'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
