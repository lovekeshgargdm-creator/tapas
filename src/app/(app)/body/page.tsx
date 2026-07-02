"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Sparkline } from "@/components/Sparkline";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useStore, uid, todayISO } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconCheck } from "@/components/Icons";

export default function BodyPage() {
  const mounted = useMounted();
  const body = useStore((s) => s.body);
  const addBody = useStore((s) => s.addBody);
  const [weight, setWeight] = useState("");
  const [inputError, setInputError] = useState("");
  const [saved, setSaved] = useState(false);

  const weightEntries = mounted
    ? [...body].filter((entry) => entry.weight).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  const weightSeries = weightEntries.map((entry) => entry.weight || 0);
  const firstWeight = weightSeries[0];
  const latestWeight = weightSeries[weightSeries.length - 1];
  const change = firstWeight && latestWeight ? latestWeight - firstWeight : 0;

  const saveWeight = () => {
    const parsed = parseFloat(weight);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > LIMITS.weightKg) return;
    addBody({ id: uid(), date: todayISO(), weight: parsed });
    setSaved(true);
    setWeight("");
    setTimeout(() => setSaved(false), 1800);
  };

  if (!mounted) return <div className="page" />;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <AppHeader title="Log Weight" subtitle="Weight progress" accent="#8fd4ff" />

      <section className="card" style={{ marginBottom: 20 }}>
        <div className="row between" style={{ gap: 14, alignItems: "flex-start" }}>
          <div>
            <div className="text-caption">Latest Weight</div>
            <div className="text-mono" style={{ fontSize: 30, fontWeight: 700 }}>
              {latestWeight ? latestWeight.toFixed(1) : "-"}
              <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}> kg</span>
            </div>
            {weightSeries.length > 1 && (
              <p className="text-caption" style={{ marginTop: 6 }}>
                {change === 0 ? "No net change" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`} since first log
              </p>
            )}
          </div>
          {weightSeries.length > 1 && <Sparkline data={weightSeries} color="#8fd4ff" width={140} height={54} />}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Add Weight</h2>
        <div className="row between" style={{ gap: 12 }}>
          <input
            type="number"
            className="input"
            inputMode="decimal"
            min="1"
            max={LIMITS.weightKg}
            placeholder="Weight in kg"
            value={weight}
            onChange={(event) => {
              setWeight(clampNumericInput(event.target.value, LIMITS.weightKg, {
                decimal: true,
                onLimit: () => setInputError(`Weight cannot be more than ${LIMITS.weightKg} kg.`),
              }));
            }}
          />
          <button className="btn btn-primary" onClick={saveWeight} disabled={!weight || parseFloat(weight) <= 0}>
            {saved ? <><IconCheck width={18} height={18} /> Saved</> : "Log"}
          </button>
        </div>
        {inputError && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(239,140,140,0.36)", background: "rgba(239,140,140,0.1)", color: "#efb0b0", fontSize: 13, fontWeight: 600 }}>
            {inputError}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>History</h2>
        {weightEntries.length > 0 ? (
          <div style={{ borderTop: "1px solid var(--color-outline-muted)" }}>
            {[...weightEntries].reverse().map((entry) => (
              <div key={entry.id} className="row between" style={{ padding: "13px 0", borderBottom: "1px solid var(--color-outline-muted)" }}>
                <span className="text-caption">{new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                <span style={{ fontWeight: 700 }}>{entry.weight?.toFixed(1)} kg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-caption">No weight logs yet.</p>
        )}
      </section>
    </div>
  );
}
