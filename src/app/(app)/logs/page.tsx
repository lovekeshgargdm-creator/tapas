"use client";

import { useState } from "react";
import { BackHeader } from "@/components/BackHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconTrash, IconTimer, IconDumbbell } from "@/components/Icons";

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
              onChange={(e) => setSpecificDate(e.target.value)}
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
                setSpecificDate("");
                setRangeDays(option.value);
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
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
            <div style={{ fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>No completed routines.</div>
            <div className="text-caption">Complete a workout to see your logs here.</div>
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
                
                <div className="row gap-md" style={{ marginBottom: 14 }}>
                  <div className="row gap-xs" style={{ color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600 }}>
                    <IconTimer width={14} height={14} />
                    {w.durationMin} min
                  </div>
                  <div className="row gap-xs" style={{ color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 600 }}>
                    <IconDumbbell width={14} height={14} />
                    {w.volume.toLocaleString()} kg
                  </div>
                </div>

                <div style={{ padding: "12px 14px", background: "var(--color-surface-3)", borderRadius: 12 }}>
                  <div className="text-caption" style={{ fontWeight: 700, marginBottom: 8, color: "var(--color-text-secondary)" }}>
                    Exercises ({w.exercises.length})
                  </div>
                  <div className="stack gap-xs">
                    {w.exercises.slice(0, 3).map((ex, i) => (
                      <div key={i} className="row between" style={{ fontSize: 13 }}>
                        <span style={{ color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ex.name}
                        </span>
                        <span className="text-mono" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {ex.sets.length} sets
                        </span>
                      </div>
                    ))}
                    {w.exercises.length > 3 && (
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, fontStyle: "italic" }}>
                        + {w.exercises.length - 3} more
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
