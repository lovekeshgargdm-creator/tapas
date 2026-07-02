"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Sparkline } from "@/components/Sparkline";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useStore, uid, todayISO } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconCheck, IconClose, IconEdit, IconTrash } from "@/components/Icons";

export default function BodyPage() {
  const mounted = useMounted();
  const body = useStore((s) => s.body);
  const addBody = useStore((s) => s.addBody);
  const updateBody = useStore((s) => s.updateBody);
  const deleteBody = useStore((s) => s.deleteBody);
  const [weight, setWeight] = useState("");
  const [inputError, setInputError] = useState("");
  const [editError, setEditError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
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
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > LIMITS.weightKg) {
      setInputError(`Weight must be between 1 and ${LIMITS.weightKg} kg.`);
      return;
    }
    addBody({ id: uid(), date: todayISO(), weight: parsed });
    setSaved(true);
    setWeight("");
    setInputError("");
    setTimeout(() => setSaved(false), 1800);
  };

  const startEdit = (id: string, value?: number) => {
    setEditingId(id);
    setEditWeight(value ? String(value) : "");
    setEditError("");
  };

  const saveEdit = (id: string) => {
    const parsed = parseFloat(editWeight);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > LIMITS.weightKg) {
      setEditError(`Weight must be between 1 and ${LIMITS.weightKg} kg.`);
      return;
    }
    updateBody(id, { weight: parsed });
    setEditingId(null);
    setEditWeight("");
    setEditError("");
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
              setInputError("");
              setWeight(clampNumericInput(event.target.value, LIMITS.weightKg, {
                decimal: true,
                onLimit: () => setInputError(`Weight cannot be more than ${LIMITS.weightKg} kg. Negative values are not allowed.`),
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
              <div key={entry.id} style={{ padding: "13px 0", borderBottom: "1px solid var(--color-outline-muted)" }}>
                <div className="row between" style={{ gap: 12 }}>
                  <span className="text-caption">{new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  {editingId === entry.id ? (
                    <div className="row gap-xs" style={{ flexShrink: 0 }}>
                      <input
                        className="input"
                        type="number"
                        inputMode="decimal"
                        min="1"
                        max={LIMITS.weightKg}
                        value={editWeight}
                        onChange={(event) => {
                          setEditError("");
                          setEditWeight(clampNumericInput(event.target.value, LIMITS.weightKg, {
                            decimal: true,
                            onLimit: () => setEditError(`Weight cannot be more than ${LIMITS.weightKg} kg. Negative values are not allowed.`),
                          }));
                        }}
                        style={{ width: 90, minHeight: 36, padding: "7px 9px", textAlign: "right" }}
                      />
                      <button className="icon-btn" aria-label="Save weight" onClick={() => saveEdit(entry.id)} style={{ width: 36, height: 36 }}>
                        <IconCheck width={16} height={16} />
                      </button>
                      <button className="icon-btn" aria-label="Cancel edit" onClick={() => setEditingId(null)} style={{ width: 36, height: 36 }}>
                        <IconClose width={16} height={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="row gap-xs" style={{ flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, minWidth: 72, textAlign: "right" }}>{entry.weight?.toFixed(1)} kg</span>
                      <button className="icon-btn" aria-label="Edit weight" onClick={() => startEdit(entry.id, entry.weight)} style={{ width: 34, height: 34 }}>
                        <IconEdit width={15} height={15} />
                      </button>
                      <button className="icon-btn" aria-label="Delete weight" onClick={() => deleteBody(entry.id)} style={{ width: 34, height: 34, color: "var(--color-status-error)" }}>
                        <IconTrash width={15} height={15} />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === entry.id && editError && (
                  <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 10, border: "1px solid rgba(239,140,140,0.36)", background: "rgba(239,140,140,0.1)", color: "#efb0b0", fontSize: 12.5, fontWeight: 600 }}>
                    {editError}
                  </div>
                )}
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
