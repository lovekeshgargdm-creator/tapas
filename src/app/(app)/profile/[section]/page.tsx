"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { DOSHA_INFO } from "@/lib/seed";
import { uid, todayISO, useStore } from "@/lib/store";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useMounted } from "@/lib/useMounted";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconSearch,
  IconShield,
  IconStar,
  IconTrash,
} from "@/components/Icons";
import type { Gender, RoutineItem, WeeklyRoutine } from "@/lib/types";

const TITLES: Record<string, string> = {
  personal: "Personal Details",
  measurements: "Measurements",
  routines: "Routines",
  activity: "Account Activity",
  support: "Help & Support",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  export: "Export Data",
};

const GOALS = [
  { id: "strength", label: "Get stronger" },
  { id: "flexible", label: "Get more flexible" },
  { id: "stress", label: "Reduce stress & breathe better" },
  { id: "consistency", label: "Build consistency" },
];

const initials = (name: string, email: string) => {
  const source = name.trim() || email.split("@")[0] || "T";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
};

function cloneRoutineItem(item: RoutineItem): RoutineItem {
  return {
    ...item,
    id: uid(),
    sets: item.sets.map((set) => ({ ...set, id: uid() })),
  };
}

export default function ProfileSectionPage() {
  const mounted = useMounted();
  const params = useParams();
  const section = String(params.section || "");
  const s = useStore();

  const [editing, setEditing] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState<Gender | "">("");
  const [editHeight, setEditHeight] = useState("");
  const [goalDraft, setGoalDraft] = useState<string[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [inputError, setInputError] = useState("");

  const [mWeight, setMWeight] = useState("");
  const [mChest, setMChest] = useState("");
  const [mWaist, setMWaist] = useState("");
  const [mHips, setMHips] = useState("");
  const [mArms, setMArms] = useState("");
  const [mThighs, setMThighs] = useState("");
  const [mCalves, setMCalves] = useState("");
  const [mNeck, setMNeck] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileRoutineSearch, setProfileRoutineSearch] = useState("");
  const [profileRoutineFilter, setProfileRoutineFilter] = useState<"all" | "favorites">("all");

  useEffect(() => {
    if (!mounted) return;
    setEditName(s.profile.name || "");
    setEditEmail(s.profile.email || "");
    setEditAge(s.profile.age ? String(s.profile.age) : "");
    setEditGender(s.profile.gender || "");
    setEditHeight(s.profile.heightCm ? String(Math.round(s.profile.heightCm)) : "");
    setGoalDraft(s.profile.goals || []);
    const latest = s.body[0];
    setMWeight(latest?.weight ? String(latest.weight) : "");
    setMChest(latest?.chest ? String(latest.chest) : "");
    setMWaist(latest?.waist ? String(latest.waist) : "");
    setMHips(latest?.hips ? String(latest.hips) : "");
    setMArms(latest?.arms ? String(latest.arms) : "");
    setMThighs(latest?.thighs ? String(latest.thighs) : "");
    setMCalves(latest?.calves ? String(latest.calves) : "");
    setMNeck(latest?.neck ? String(latest.neck) : "");
  }, [mounted, s.profile, s.body]);

  const accountLogs = useMemo(
    () => [...(s.accountLogs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [s.accountLogs],
  );

  const profileRoutineList = useMemo(
    () =>
      [...(s.weeklyRoutines || [])]
        .filter((routine) => routine.module === "train" || routine.module === "combined" || routine.module === "yoga")
        .filter((routine) => profileRoutineFilter === "all" || routine.favorite)
        .filter((routine) => routine.name.toLowerCase().includes(profileRoutineSearch.toLowerCase()))
        .sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [s.weeklyRoutines, profileRoutineFilter, profileRoutineSearch],
  );

  if (!mounted) return <div className="page" />;

  const title = TITLES[section] || "Profile";
  const dosha =
    s.profile.doshaPrimary && s.profile.doshaPrimary !== "tridoshic"
      ? DOSHA_INFO[s.profile.doshaPrimary]
      : null;

  const savePersonal = () => {
    let ageVal = parseInt(editAge, 10);
    let heightVal = parseFloat(editHeight);
    if (isNaN(ageVal) || ageVal < 1) ageVal = 0;
    if (ageVal > LIMITS.age) ageVal = LIMITS.age;
    if (isNaN(heightVal) || heightVal < 50) heightVal = 0;
    if (heightVal > LIMITS.heightCm) heightVal = LIMITS.heightCm;
    s.setProfile({
      age: ageVal || undefined,
      gender: (editGender as Gender) || undefined,
      heightCm: heightVal || undefined,
    });
    setEditing(false);
    setInputError("");
  };

  const saveAccount = () => {
    const cleanName = editName.trim();
    const cleanEmail = editEmail.trim();
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;
    s.setProfile({ name: cleanName, email: cleanEmail });
    setEditingAccount(false);
  };

  const toggleGoal = (id: string) =>
    setGoalDraft((current) => (current.includes(id) ? current.filter((goal) => goal !== id) : [...current, id]));

  const saveGoals = () => {
    s.setGoals(goalDraft);
    setEditingGoals(false);
  };

  const savePassword = () => {
    const result = s.changePassword(currentPassword, nextPassword);
    setPasswordMessage(result.message);
    if (result.ok) {
      setCurrentPassword("");
      setNextPassword("");
    }
  };

  const saveMeasurements = () => {
    const parse = (v: string, max: number) => {
      const val = parseFloat(v);
      if (isNaN(val)) return undefined;
      if (val < 0) return undefined;
      return Math.min(val, max);
    };
    s.addBody({
      id: uid(),
      date: todayISO(),
      weight: parse(mWeight, LIMITS.weightKg),
      chest: parse(mChest, LIMITS.chestCm),
      waist: parse(mWaist, LIMITS.waistCm),
      hips: parse(mHips, LIMITS.hipsCm),
      arms: parse(mArms, LIMITS.armsCm),
      thighs: parse(mThighs, LIMITS.thighsCm),
      calves: parse(mCalves, LIMITS.calvesCm),
      neck: parse(mNeck, LIMITS.neckCm),
    });
    setSaved(true);
    setInputError("");
    setTimeout(() => setSaved(false), 1800);
  };

  const toggleRoutineFavorite = (routine: WeeklyRoutine) => {
    s.saveWeeklyRoutine({ ...routine, favorite: !routine.favorite, updatedAt: todayISO() });
  };

  const duplicateRoutine = (routine: WeeklyRoutine) => {
    s.saveWeeklyRoutine({
      ...routine,
      id: uid(),
      name: `${routine.name} Copy`,
      favorite: false,
      days: routine.days.map((day) => ({
        ...day,
        items: day.items.map(cloneRoutineItem),
      })),
      createdAt: todayISO(),
      updatedAt: todayISO(),
    });
  };

  const showLimit = (label: string, max: number, unit = "", reason: "max" | "negative" = "max") => {
    setInputError(
      reason === "negative"
        ? `${label} cannot be negative.`
        : `${label} cannot be more than ${max}${unit ? ` ${unit}` : ""}.`,
    );
  };

  const heightDisplay = () => {
    if (!s.profile.heightCm) return "-";
    if (s.profile.heightUnit === "cm") return `${Math.round(s.profile.heightCm)} cm`;
    const totalIn = s.profile.heightCm / 2.54;
    const ft = Math.floor(totalIn / 12);
    const inch = Math.round(totalIn % 12);
    return `${ft}'${inch}"`;
  };

  const genderLabel = (g?: string) => {
    if (!g) return "-";
    if (g === "prefer_not_to_say") return "Prefer not to say";
    return g.charAt(0).toUpperCase() + g.slice(1);
  };

  const exportData = () => {
    const data = {
      profile: s.profile,
      workouts: s.workouts,
      yoga: s.yoga,
      breath: s.breath,
      body: s.body,
      streaks: s.streaks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tapas-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <BackHeader title={title} fallback="/profile" />

      {section === "personal" && (
        <div>
          <section className="card" style={{ marginBottom: 22, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: "2px solid var(--color-mint-active)",
                background: "rgba(115,253,156,0.08)",
                color: "var(--color-mint-active)",
                fontSize: 26,
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              {initials(s.profile.name, s.profile.email)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editingAccount ? (
                <div className="stack gap-xs">
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ minHeight: 38 }} />
                  <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" style={{ minHeight: 38 }} />
                  <button
                    className="btn btn-primary"
                    onClick={saveAccount}
                    disabled={!editName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())}
                    style={{ padding: "8px 12px", fontSize: 13, minHeight: 34, marginTop: 4 }}
                  >
                    <IconCheck width={15} height={15} /> Save
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{s.profile.name || "Practitioner"}</h2>
                  <p className="text-caption" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.profile.email}
                  </p>
                </>
              )}
            </div>
            {!editingAccount && (
              <button
                className="icon-btn"
                onClick={() => setEditingAccount(true)}
                aria-label="Edit name and email"
                title="Edit name and email"
                style={{ flexShrink: 0, width: 38, height: 38, color: "var(--color-mint-active)" }}
              >
                <IconEdit width={17} height={17} />
              </button>
            )}
          </section>

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="row between" style={{ gap: 12, marginBottom: 10 }}>
              <SectionTitle>Ayurvedic Profile</SectionTitle>
              <Link href="/onboarding?retake=true" className="pill pill-active" style={{ textDecoration: "none" }}>
                {dosha ? "Retake quiz" : "Take quiz"}
              </Link>
            </div>
            {dosha ? (
              <>
                <h3 style={{ fontSize: 19, fontWeight: 700 }}>{dosha.name}</h3>
                <p className="secondary" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
                  {dosha.blurb}
                </p>
              </>
            ) : (
              <p className="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                Not determined yet. Take the dosha quiz to personalize your experience.
              </p>
            )}
          </section>

          <section className="card" style={{ marginBottom: 20, padding: "20px 16px" }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <SectionTitle>Active Focus Areas</SectionTitle>
              <button className="icon-btn" onClick={() => (editingGoals ? saveGoals() : setEditingGoals(true))} aria-label="Edit goals" style={{ color: "var(--color-mint-active)" }}>
                {editingGoals ? <IconCheck width={17} height={17} /> : <IconEdit width={17} height={17} />}
              </button>
            </div>
            {editingGoals ? (
              <div className="stack gap-sm">
                <div className="row gap-sm wrap" style={{ marginBottom: 12 }}>
                  {GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      className={`chip ${goalDraft.includes(goal.id) ? "active" : ""}`}
                      onClick={() => toggleGoal(goal.id)}
                      style={{ justifyContent: "center", minHeight: 42, paddingInline: 16, border: goalDraft.includes(goal.id) ? "1px solid rgba(115,253,156,0.55)" : "1px solid rgba(115,253,156,0.18)" }}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-primary btn-block" onClick={saveGoals}>Save Goals</button>
              </div>
            ) : s.profile.goals.length > 0 ? (
              <div className="row gap-sm wrap">
                {s.profile.goals.map((goal) => (
                  <span className="pill pill-active" key={goal} style={{ padding: "6px 12px", fontSize: 13 }}>
                    {GOALS.find((item) => item.id === goal)?.label || goal}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ padding: "12px 0", textAlign: "center" }}>
                <p className="text-caption">No goals selected yet.</p>
              </div>
            )}
          </section>

          <section className="card" style={{ marginBottom: 20, padding: "20px 16px" }}>
            <div className="row between" style={{ marginBottom: 16 }}>
              <SectionTitle>Physical Profile</SectionTitle>
              <button className="icon-btn" onClick={() => (editing ? savePersonal() : setEditing(true))} aria-label="Edit info" style={{ color: "var(--color-mint-active)" }}>
                {editing ? <IconCheck width={17} height={17} /> : <IconEdit width={17} height={17} />}
              </button>
            </div>
            {inputError && <LimitNotice message={inputError} />}
            {editing ? (
              <div className="stack gap-md" style={{ padding: "4px 0" }}>
                <Field label="Age">
                  <input className="input" type="number" inputMode="numeric" min="1" max={LIMITS.age} value={editAge} onChange={(e) => setEditAge(clampNumericInput(e.target.value, LIMITS.age, { onLimit: (reason) => showLimit("Age", LIMITS.age, "", reason) }))} style={{ background: "var(--color-surface-1)" }} />
                </Field>
                <Field label="Gender">
                  <select className="input" value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)} style={{ background: "var(--color-surface-1)" }}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </Field>
                <Field label="Height (cm)">
                  <input className="input" type="number" inputMode="decimal" min="50" max={LIMITS.heightCm} value={editHeight} onChange={(e) => setEditHeight(clampNumericInput(e.target.value, LIMITS.heightCm, { decimal: true, onLimit: (reason) => showLimit("Height", LIMITS.heightCm, "cm", reason) }))} style={{ background: "var(--color-surface-1)" }} />
                </Field>
                <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={savePersonal}>
                  Save
                </button>
              </div>
            ) : (
              <div className="stack" style={{ gap: 0 }}>
                <MetricRow label="Age" value={s.profile.age ? `${s.profile.age} years` : "-"} />
                <MetricRow label="Gender" value={genderLabel(s.profile.gender)} />
                <MetricRow label="Height" value={heightDisplay()} />
              </div>
            )}
          </section>

          <section className="card" style={{ marginBottom: 20, padding: "20px 16px" }}>
            <div className="row gap-sm" style={{ marginBottom: 16, color: "var(--color-mint-active)" }}>
              <IconShield width={22} height={22} />
              <SectionTitle>Account Security</SectionTitle>
            </div>
            <div className="stack gap-sm">
              <Field label="Current password">
                <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ background: "var(--color-surface-1)" }} />
              </Field>
              <Field label="New password">
                <input className="input" type="password" minLength={8} value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} style={{ background: "var(--color-surface-1)" }} />
              </Field>
              {passwordMessage && <p className="text-caption">{passwordMessage}</p>}
              <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={savePassword} disabled={!currentPassword || nextPassword.length < 8}>
                Update Password
              </button>
            </div>
          </section>

          <InstallAppCard />
        </div>
      )}

      {section === "measurements" && (
        <div style={{ paddingBottom: 80 }}>
          <section className="card" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-surface-3)", color: "var(--color-mint-active)", display: "grid", placeItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-caption" style={{ fontSize: 12 }}>Last Updated</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {s.body.length > 0 ? new Date(s.body[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "No measurements yet"}
              </div>
            </div>
          </section>

          {inputError && <LimitNotice message={inputError} />}
          
          <div className="stack gap-sm">
            <MeasurementCard label="Weight" unit="kg" latest={s.body[0]?.weight} value={mWeight} onChange={setMWeight} max={LIMITS.weightKg} onLimit={(reason) => showLimit("Weight", LIMITS.weightKg, "kg", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Body Fat" unit="%" latest={0} value={""} onChange={() => {}} max={100} onLimit={() => {}} tone="var(--color-text-main)" />
            <MeasurementCard label="Chest" unit="cm" latest={s.body[0]?.chest} value={mChest} onChange={setMChest} max={LIMITS.chestCm} onLimit={(reason) => showLimit("Chest", LIMITS.chestCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Waist" unit="cm" latest={s.body[0]?.waist} value={mWaist} onChange={setMWaist} max={LIMITS.waistCm} onLimit={(reason) => showLimit("Waist", LIMITS.waistCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Hips" unit="cm" latest={s.body[0]?.hips} value={mHips} onChange={setMHips} max={LIMITS.hipsCm} onLimit={(reason) => showLimit("Hips", LIMITS.hipsCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Arms" unit="cm" latest={s.body[0]?.arms} value={mArms} onChange={setMArms} max={LIMITS.armsCm} onLimit={(reason) => showLimit("Arms", LIMITS.armsCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Thighs" unit="cm" latest={s.body[0]?.thighs} value={mThighs} onChange={setMThighs} max={LIMITS.thighsCm} onLimit={(reason) => showLimit("Thighs", LIMITS.thighsCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Calves" unit="cm" latest={s.body[0]?.calves} value={mCalves} onChange={setMCalves} max={LIMITS.calvesCm} onLimit={(reason) => showLimit("Calves", LIMITS.calvesCm, "cm", reason)} tone="var(--color-text-main)" />
            <MeasurementCard label="Neck" unit="cm" latest={s.body[0]?.neck} value={mNeck} onChange={setMNeck} max={LIMITS.neckCm} onLimit={(reason) => showLimit("Neck", LIMITS.neckCm, "cm", reason)} tone="var(--color-text-main)" />
          </div>

          <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, fontStyle: "italic", marginTop: 32, padding: "0 20px" }}>
            Consistency is the secret to measurable progress. Breathe through the journey.
          </p>
          
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary btn-block" onClick={saveMeasurements}>
              {saved ? "Saved" : "Save Measurements"}
            </button>
          </div>
        </div>
      )}

      {section === "routines" && (
        <div className="stack gap-sm">
          {s.weeklyRoutines.length > 0 ? (
            <>
              <div style={{ position: "relative" }}>
                <IconSearch width={18} height={18} style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input className="input input-with-icon" placeholder="Search routines..." value={profileRoutineSearch} onChange={(event) => setProfileRoutineSearch(event.target.value)} />
              </div>
              <div className="row gap-xs" style={{ marginBottom: 6 }}>
                <button className={`chip ${profileRoutineFilter === "all" ? "active" : ""}`} onClick={() => setProfileRoutineFilter("all")}>All</button>
                <button className={`chip ${profileRoutineFilter === "favorites" ? "active" : ""}`} onClick={() => setProfileRoutineFilter("favorites")}>
                  <IconStar width={14} height={14} fill={profileRoutineFilter === "favorites" ? "currentColor" : "none"} /> Favorites
                </button>
              </div>
              {profileRoutineList.length > 0 ? (
                profileRoutineList.map((routine) => {
                  const activeDays = routine.days.filter((day) => day.enabled);
                  const itemCount = activeDays.reduce((sum, day) => sum + day.items.length, 0);
                  return (
                    <section className="card" key={routine.id}>
                      <div className="row between" style={{ gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <div className="row gap-xs wrap">
                            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{routine.name}</h2>
                            {routine.favorite && <span className="pill pill-active" style={{ padding: "3px 8px", fontSize: 11 }}>Favorite</span>}
                          </div>
                          <p className="text-caption" style={{ marginTop: 4 }}>
                            {routine.module === "train" ? "Train" : routine.module === "yoga" ? "Yoga" : "Combined"} · {activeDays.length} active days · {itemCount} item{itemCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button className="icon-btn" onClick={() => toggleRoutineFavorite(routine)} aria-label={routine.favorite ? "Remove favorite" : "Mark favorite"} title={routine.favorite ? "Remove favorite" : "Mark favorite"} style={{ width: 34, height: 34, color: routine.favorite ? "var(--color-warning-soft)" : "var(--color-text-muted)" }}>
                          <IconStar width={16} height={16} fill={routine.favorite ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => {
                          const day = routine.days.find((item) => item.day === index);
                          return (
                            <div key={label} style={{ flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: day?.enabled ? "rgba(115,253,156,0.15)" : "var(--color-surface-main)", color: day?.enabled ? "var(--color-mint-active)" : "var(--color-text-muted)" }}>
                              {label}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8 }}>
                        <Link className="btn btn-primary" href={`/routine?edit=${encodeURIComponent(routine.id)}`} style={{ minHeight: 38 }}>
                          <IconEdit width={16} height={16} /> Edit
                        </Link>
                        <button className="icon-btn" onClick={() => duplicateRoutine(routine)} aria-label="Duplicate routine" title="Duplicate routine" style={{ width: 38, height: 38 }}>
                          <IconCopy width={16} height={16} />
                        </button>
                        <button className="icon-btn" onClick={() => toggleRoutineFavorite(routine)} aria-label={routine.favorite ? "Remove favorite" : "Mark favorite"} title={routine.favorite ? "Remove favorite" : "Mark favorite"} style={{ width: 38, height: 38, color: routine.favorite ? "var(--color-warning-soft)" : "var(--color-text-muted)" }}>
                          <IconStar width={16} height={16} fill={routine.favorite ? "currentColor" : "none"} />
                        </button>
                        <button className="icon-btn" onClick={() => s.deleteWeeklyRoutine(routine.id)} aria-label="Delete routine" title="Delete routine" style={{ width: 38, height: 38, color: "var(--color-status-error)" }}>
                          <IconTrash width={15} height={15} />
                        </button>
                      </div>
                    </section>
                  );
                })
              ) : (
                <section className="card" style={{ textAlign: "center" }}>
                  <p className="text-caption">No routines match this search or filter.</p>
                </section>
              )}
            </>
          ) : (
            <section className="card" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No routines yet</h2>
              <p className="text-caption" style={{ marginBottom: 16 }}>
                Create a weekly routine with training exercises and yoga poses.
              </p>
              <Link href="/routine" className="btn btn-primary btn-block">
                Create a Routine
              </Link>
            </section>
          )}
        </div>
      )}

      {section === "activity" && (
        <div className="stack gap-sm">
          {accountLogs.length > 0 ? (
            accountLogs.map((item) => (
              <section className="card" key={item.id} style={{ padding: 16 }}>
                <div className="row between" style={{ gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.action}
                    </h2>
                    <p className="text-caption" style={{ marginTop: 4 }}>
                      {item.detail}
                    </p>
                  </div>
                  <div className="text-caption" style={{ flexShrink: 0 }}>
                    {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              </section>
            ))
          ) : (
            <section className="card" style={{ textAlign: "center" }}>
              <p className="text-caption">No account changes recorded yet.</p>
            </section>
          )}
        </div>
      )}

      {section === "support" && (
        <section className="card">
          <SectionTitle>Support</SectionTitle>
          <p className="secondary" style={{ lineHeight: 1.7 }}>
            Have a question or need assistance with TAPAS? Reach out to our dedicated support team. Please include your account email for a faster resolution.
          </p>
          <div style={{ borderTop: "1px solid var(--color-outline-muted)", marginTop: 18 }}>
            <MetricRow label="Email" value="support@tapas-app.com" />
            <MetricRow label="Phone" value="+1 (800) 555-0199" />
          </div>
        </section>
      )}

      {section === "privacy" && (
        <LegalPage
          title="Your privacy is our priority."
          items={[
            "Your data is strictly confidential. We never sell or share your personal information with third parties.",
            "All practice routines, body measurements, and logs are stored securely within your TAPAS account.",
            "You have full control over your data. You can clear your local device cache at any time by signing out.",
            "Want a personal backup? You can easily export your entire health journey at any time.",
          ]}
        />
      )}

      {section === "terms" && (
        <LegalPage
          title="Terms of Service"
          items={[
            "TAPAS is designed to provide wellness tracking and practice guidance. It does not constitute professional medical advice.",
            "Please consult with a qualified healthcare professional before beginning any new training routines, especially if you have existing health concerns.",
            "You are fully responsible for practicing mindfully and within your own physical capabilities to avoid injury.",
            "TAPAS may update these terms occasionally as our product and services continue to evolve.",
          ]}
        />
      )}

      {section === "export" && (
        <section className="card">
          <SectionTitle>Export Data</SectionTitle>
          <div className="secondary" style={{ lineHeight: 1.7, marginBottom: 20 }}>
            <p style={{ marginBottom: 16 }}>
              Download a complete JSON backup of your health journey, including your routines, measurements, and progress logs.
            </p>
            <p>
              <strong>AI Data Analytics:</strong> Your exported file is formatted perfectly for modern AI tools. Upload this file to ChatGPT, Claude, or Gemini to get personalized insights, analyze your consistency trends, or receive custom recommendations based on your actual practice history.
            </p>
          </div>
          <button className="btn btn-primary btn-block" onClick={exportData}>
            Download Data (JSON)
          </button>
        </section>
      )}

      {!TITLES[section] && (
        <section className="card" style={{ textAlign: "center" }}>
          <p className="text-caption" style={{ marginBottom: 16 }}>
            This profile page does not exist.
          </p>
          <Link className="btn btn-primary btn-block" href="/profile">
            Back to Profile
          </Link>
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="uppercase-label" style={{ marginBottom: 10 }}>
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="stack gap-xs">
      <span className="uppercase-label">{label}</span>
      {children}
    </label>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between" style={{ padding: "16px 0", borderBottom: "1px solid var(--color-surface-3)", gap: 12 }}>
      <span className="text-caption" style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right", color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function MeasurementCard({
  label,
  latest,
  value,
  onChange,
  max,
  unit,
  onLimit,
}: {
  label: string;
  latest?: number;
  value: string;
  onChange: (v: string) => void;
  max: number;
  unit: string;
  onLimit: (reason: "max" | "negative") => void;
  tone: string;
}) {
  return (
    <section className="card" style={{ padding: 16, marginBottom: 0 }}>
      <div className="row between" style={{ marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{label}</h3>
          <p className="text-caption" style={{ marginTop: 4 }}>
            Latest: <span style={{ marginLeft: 8 }}>{latest ? latest.toFixed(label === "Weight" ? 1 : 0) : "--"}</span>
          </p>
        </div>
        <div className="uppercase-label" style={{ fontSize: 11 }}>
          {unit}
        </div>
      </div>
      <input
        type="number"
        value={value}
        placeholder="00.0"
        onChange={(e) => {
          onChange(clampNumericInput(e.target.value, max, { decimal: true, onLimit }));
        }}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "var(--color-surface-2)",
          color: "var(--color-mint-active)",
          fontSize: 16,
          outline: "none",
        }}
      />
    </section>
  );
}

function LimitNotice({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: "0 0 12px",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(239,140,140,0.36)",
        background: "rgba(239,140,140,0.1)",
        color: "#efb0b0",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {message}
    </div>
  );
}

function LegalPage({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="card">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{title}</h2>
      <ol style={{ paddingLeft: 20, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
        {items.map((item) => (
          <li key={item} style={{ marginBottom: 10 }}>
            {item}
          </li>
        ))}
      </ol>
    </section>
  );
}
