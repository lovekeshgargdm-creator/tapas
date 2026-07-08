"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { Sparkline } from "@/components/Sparkline";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useStore, uid, todayISO } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { IconCheck, IconClose, IconEdit, IconTrash } from "@/components/Icons";
import { Footprints } from "lucide-react";

export default function BodyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [filter, setFilter] = useState<"all" | "7" | "15" | "30">("all");

  useEffect(() => {
    const qFilter = searchParams.get("filter");
    if (qFilter === "all" || qFilter === "7" || qFilter === "15" || qFilter === "30") {
      setFilter(qFilter);
    }
  }, [searchParams]);

  const handleSetFilter = (newFilter: "all" | "7" | "15" | "30") => {
    setFilter(newFilter);
    router.replace(`/body?filter=${newFilter}`, { scroll: false });
  };




  const weightEntries = mounted
    ? [...body].filter((entry) => entry.weight).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  const filteredWeightEntries = weightEntries.filter((entry) => {
    if (filter === "all") return true;
    const entryTime = new Date(entry.date).getTime();
    const now = Date.now();
    const days = parseInt(filter, 10);
    return now - entryTime <= days * 86400000;
  });

  const displaySeries = filteredWeightEntries.map((entry) => entry.weight || 0);
  const firstEntry = filteredWeightEntries[0];
  const latestWeight = displaySeries[displaySeries.length - 1];
  const change = firstEntry && latestWeight ? latestWeight - firstEntry.weight! : 0;
  const sinceText = filter === "all" ? "first log" : firstEntry ? new Date(firstEntry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  const weightError = (reason: "max" | "min" | "negative") => {
    if (reason === "negative") return "Weight cannot be negative.";
    if (reason === "min") return "Weight cannot be less than 1 kg.";
    return `Weight cannot be more than ${LIMITS.weightKg} kg.`;
  };

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
      <BackHeader title="Log Weight" subtitle="Weight progress" fallback="/home" />

      <section className="card" style={{ marginBottom: 20 }}>
        <div className="row between" style={{ gap: 14, alignItems: "flex-start" }}>
          <div>
            <div className="text-caption">Latest Weight</div>
            <div className="text-mono" style={{ fontSize: 30, fontWeight: 700 }}>
              {latestWeight ? latestWeight.toFixed(1) : "-"}
              <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}> kg</span>
            </div>
            {displaySeries.length > 1 && (
              <p className="text-caption" style={{ marginTop: 6 }}>
                {change === 0 ? "No net change" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`} since {sinceText}
              </p>
            )}
          </div>
          {displaySeries.length > 1 && <Sparkline data={displaySeries} color="var(--color-seafoam-calm)" width={140} height={54} />}
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
                decimal: true, min: 1,
                onLimit: (reason) => setInputError(weightError(reason)),
              }));
            }}
          />
          <button className="btn btn-primary" onClick={saveWeight} disabled={!weight || parseFloat(weight) <= 0}>
            {saved ? <><IconCheck width={18} height={18} /> Saved</> : "Log"}
          </button>
        </div>
        {inputError && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-error-soft-border)", background: "var(--color-error-soft-bg)", color: "var(--color-error-soft)", fontSize: 13, fontWeight: 600 }}>
            {inputError}
          </div>
        )}
      </section>

      <section className="card">
        <div className="row between" style={{ marginBottom: 12, gap: 12 }}>
          <h2 className="section-title" style={{ fontSize: 16 }}>History</h2>
          <div className="row gap-xs" style={{ flexShrink: 0 }}>
            {[
              ["all", "All"],
              ["7", "7 Days"],
              ["15", "15 Days"],
              ["30", "30 Days"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`chip ${filter === id ? "active" : ""}`}
                onClick={() => handleSetFilter(id as "all" | "7" | "15" | "30")}
                style={{ minHeight: 30, padding: "5px 9px", fontSize: 11 }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {filteredWeightEntries.length > 0 ? (
          <div style={{ borderTop: "1px solid var(--color-outline-muted)" }}>
            {[...filteredWeightEntries].reverse().map((entry) => (
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
                            decimal: true, min: 1,
                            onLimit: (reason) => setEditError(weightError(reason)),
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
                  <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--color-error-soft-border)", background: "var(--color-error-soft-bg)", color: "var(--color-error-soft)", fontSize: 12.5, fontWeight: 600 }}>
                    {editError}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-surface-3)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "var(--color-text-muted)" }}>
              <Footprints width={24} height={24} />
            </div>
            <p className="text-caption" style={{ fontSize: 14 }}>Not found</p>
          </div>
        )}
      </section>
    </div>
  );
}
