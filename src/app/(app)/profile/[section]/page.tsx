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
  IconDumbbell,
  IconLeaf,
  IconBreathe,
  IconFlame,
  IconRuler,
} from "@/components/Icons";
import type { Gender, RoutineItem, WeeklyRoutine } from "@/lib/types";

const TITLES: Record<string, string> = {
  personal: "Personal Details",
  measurements: "Measurements",
  routines: "Routines",
  activity: "Account Activity",
  roadmap: "Future Pipeline",
  support: "Help & Support",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  export: "Export Data",
};

const GOALS = [
  { id: "strength", label: "Get stronger", icon: IconDumbbell },
  { id: "flexible", label: "Get more flexible", icon: IconLeaf },
  { id: "stress", label: "Reduce stress & breathe better", icon: IconBreathe },
  { id: "consistency", label: "Build consistency", icon: IconFlame },
];

const initials = (name: string, email: string) => {
  const n = name || email || "User";
  const parts = n.split(/[\s_.-]+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.substring(0, 2).toUpperCase();
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
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const [mBodyFat, setMBodyFat] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileRoutineSearch, setProfileRoutineSearch] = useState("");
  const [profileRoutineFilter, setProfileRoutineFilter] = useState<"all" | "favorites">("all");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      s.setProfile({ avatarUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

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
    setMBodyFat(latest?.bodyFat !== undefined ? String(latest.bodyFat) : "");
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
    if (isNaN(ageVal) || ageVal < 1) ageVal = 1;
    if (ageVal > LIMITS.age) ageVal = LIMITS.age;
    let heightVal = parseFloat(editHeight);
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
    if (nextPassword === currentPassword) {
      setPasswordMessage("New password cannot be the same as current password.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }
    const result = s.changePassword(currentPassword, nextPassword);
    setPasswordMessage(result.message);
    if (result.ok) {
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
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
      bodyFat: parse(mBodyFat, 100),
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

  const showLimit = (label: string, max: number, unit = "", reason: "max" | "min" | "negative" = "max", min = 1) => {
    if (reason === "negative") setInputError(`${label} cannot be negative.`);
    else if (reason === "min") setInputError(`${label} cannot be less than ${min} ${unit}.`.trim());
    else setInputError(`${label} cannot be more than ${max} ${unit}.`.trim());
    setTimeout(() => setInputError(""), 3000);
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    border: "2px solid var(--color-mint-active)",
                    background: "rgba(115,253,156,0.08)",
                    color: "var(--color-mint-active)",
                    fontSize: 26,
                    fontWeight: 800,
                    flexShrink: 0,
                    cursor: "pointer",
                    position: "relative",
                    margin: 0,
                    background: "var(--color-surface-main)",
                    border: "1px solid rgba(115,253,156,0.28)",
                  }}
                >
                  <input type="file" accept="image/*, image/png, image/jpeg" onChange={handleImageUpload} style={{ display: "none" }} />
                  {s.profile.avatarUrl ? (
                    <img src={s.profile.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>{initials(s.profile.name || "Name", s.profile.email || "")}</>
                  )}
                </label>
                <div 
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    background: "var(--color-surface-2)",
                    border: "2px solid var(--color-surface-main)",
                    color: "var(--color-text-primary)",
                    borderRadius: "50%",
                    width: 24,
                    height: 24,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <IconEdit width={12} height={12} />
                </div>
              </div>
              {s.profile.avatarUrl && (
                <button onClick={() => s.setProfile({ avatarUrl: "" })} style={{ background: "none", border: "none", color: "var(--color-status-error)", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 6px" }}>Remove</button>
              )}
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

          <section className="card" style={{ marginBottom: 18, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="row between" style={{ gap: 12, marginBottom: 10 }}>
                <SectionTitle>Ayurvedic Profile</SectionTitle>
                <Link href="/onboarding?retake=true" className="btn btn-primary" style={{ padding: "6px 14px", minHeight: 32, fontSize: 13, borderRadius: 24, textDecoration: "none", fontWeight: 600 }}>
                  {dosha ? "Retake quiz" : "Take quiz"}
                </Link>
              </div>
              {dosha ? (
                <>
                  <h3 style={{ fontSize: 32, fontWeight: 900, background: "var(--grad-mint)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em", marginTop: 4, textShadow: "0 4px 12px rgba(19, 184, 94, 0.15)" }}>{dosha.name}</h3>
                  <p className="secondary" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
                    {dosha.blurb}
                  </p>
                </>
              ) : (
                <p className="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  Not determined yet. Take the dosha quiz to personalize your experience.
                </p>
              )}
            </div>
          </section>

          <section className="card" style={{ marginBottom: 20, padding: "20px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <SectionTitle>Active Focus Areas</SectionTitle>
                <button className="icon-btn" onClick={() => (editingGoals ? saveGoals() : setEditingGoals(true))} aria-label="Edit goals" style={{ color: "var(--color-mint-active)" }}>
                  {editingGoals ? <IconCheck width={17} height={17} /> : <IconEdit width={17} height={17} />}
                </button>
              </div>
              {editingGoals ? (
                <div className="stack gap-sm">
                  <div className="row gap-sm wrap" style={{ marginBottom: 12 }}>
                    {GOALS.map((goal) => {
                      const Icon = goal.icon;
                      return (
                        <button
                          key={goal.id}
                          className={`chip ${goalDraft.includes(goal.id) ? "active" : ""}`}
                          onClick={() => toggleGoal(goal.id)}
                          style={{ 
                            justifyContent: "center", 
                            alignItems: "center",
                            display: "inline-flex",
                            gap: 8,
                            minHeight: 42, 
                            paddingInline: 18, 
                            borderRadius: 24,
                            background: goalDraft.includes(goal.id) ? "rgba(115,253,156,0.12)" : "rgba(255,255,255,0.03)",
                            border: goalDraft.includes(goal.id) ? "1px solid rgba(115,253,156,0.2)" : "1px solid rgba(255,255,255,0.08)",
                            color: goalDraft.includes(goal.id) ? "var(--color-mint-active)" : "var(--color-text-primary)",
                            fontWeight: goalDraft.includes(goal.id) ? 700 : 500,
                            transition: "all 0.2s ease"
                          }}
                        >
                          <Icon width={16} height={16} style={{ opacity: goalDraft.includes(goal.id) ? 1 : 0.6 }} />
                          {goal.label}
                        </button>
                      );
                    })}
                  </div>
                  <button className="btn btn-primary btn-block" onClick={saveGoals}>Save Goals</button>
                </div>
              ) : s.profile.goals.length > 0 ? (
                <div className="row gap-sm wrap">
                  {s.profile.goals.map((goalId) => {
                    const goal = GOALS.find((item) => item.id === goalId);
                    if (!goal) return null;
                    const Icon = goal.icon;
                    return (
                      <span className="pill pill-active" key={goal.id} style={{ padding: "8px 16px", fontSize: 13, background: "rgba(115,253,156,0.12)", color: "var(--color-mint-active)", border: "1px solid rgba(115,253,156,0.2)", borderRadius: 24, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(115,253,156,0.1)" }}>
                        <Icon width={14} height={14} />
                        {goal.label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "12px 0", textAlign: "center" }}>
                  <p className="text-caption">No goals selected yet.</p>
                </div>
              )}
            </div>
          </section>

          <section className="card" style={{ marginBottom: 20, padding: "20px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
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
                    <input className="input" type="number" inputMode="numeric" min="1" max={LIMITS.age} value={editAge} onChange={(e) => setEditAge(clampNumericInput(e.target.value, LIMITS.age, { min: 1, onLimit: (reason) => showLimit("Age", LIMITS.age, "", reason, 1) }))} />
                  </Field>
                  <Field label="Biological Sex (for workout calibration)">
                    <select className="input" value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </Field>
                  <Field label="Height (cm)">
                    <input className="input" type="number" inputMode="decimal" min="50" max={LIMITS.heightCm} value={editHeight} onChange={(e) => setEditHeight(clampNumericInput(e.target.value, LIMITS.heightCm, { decimal: true, min: 1, onLimit: (reason) => showLimit("Height", LIMITS.heightCm, "cm", reason, 1) }))} />
                  </Field>
                  <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={savePersonal}>
                    Save
                  </button>
                </div>
              ) : (
                <div className="stack" style={{ gap: 0 }}>
                  <MetricRow label="Age" value={s.profile.age ? `${s.profile.age} years` : "-"} />
                  <MetricRow label="Biological Sex" value={genderLabel(s.profile.gender)} />
                  <MetricRow label="Height" value={heightDisplay()} />
                </div>
              )}
            </div>
          </section>

          <section className="card" style={{ marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="row" style={{ gap: 12, marginBottom: 16 }}>
                <SectionTitle>Account Security</SectionTitle>
              </div>
              <div className="stack gap-sm">
                <Field label="Current password">
                  <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </Field>
                <Field label="New password">
                  <input className="input" type="password" minLength={8} value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} />
                </Field>
                <Field label="Confirm new password">
                  <input className="input" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </Field>
                {passwordMessage && <p className="text-caption" style={{ color: passwordMessage.includes("match") || passwordMessage.includes("cannot") ? "var(--color-error-soft)" : "inherit" }}>{passwordMessage}</p>}
                <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={savePassword} disabled={!currentPassword || nextPassword.length < 8 || confirmPassword.length < 8}>
                  Update Password
                </button>
              </div>
            </div>
          </section>

          <InstallAppCard />
        </div>
      )}

      {section === "measurements" && (
        <div style={{ paddingBottom: 80 }}>
          <section className="card" style={{ padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(115,253,156,0.12)", color: "var(--color-mint-active)", display: "grid", placeItems: "center" }}>
              <IconRuler width={18} height={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-caption" style={{ fontSize: 12 }}>Last Updated</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {s.body.length > 0 ? new Date(s.body[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "No measurements yet"}
              </div>
            </div>
          </section>


          
          <div className="stack gap-lg">
            <div>
              <SectionTitle style={{ marginBottom: 12, paddingLeft: 4 }}>General</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(19,184,94,0.06) 0%, transparent 60%)" label="Weight" unit="kg" latest={s.body[0]?.weight} value={mWeight} onChange={setMWeight} max={LIMITS.weightKg} onLimit={(reason) => showLimit("Weight", LIMITS.weightKg, "kg", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Weight") ? inputError : ""} />
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(19,184,94,0.06) 0%, transparent 60%)" label="Body Fat" unit="%" latest={s.body[0]?.bodyFat} value={mBodyFat} onChange={setMBodyFat} max={100} onLimit={(reason) => showLimit("Body Fat", 100, "%", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Body Fat") ? inputError : ""} />
              </div>
            </div>

            <div>
              <SectionTitle style={{ marginBottom: 12, paddingLeft: 4 }}>Upper Body</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(0,134,109,0.06) 0%, transparent 60%)" label="Chest" unit="cm" latest={s.body[0]?.chest} value={mChest} onChange={setMChest} max={LIMITS.chestCm} onLimit={(reason) => showLimit("Chest", LIMITS.chestCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Chest") ? inputError : ""} />
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(0,134,109,0.06) 0%, transparent 60%)" label="Arms" unit="cm" latest={s.body[0]?.arms} value={mArms} onChange={setMArms} max={LIMITS.armsCm} onLimit={(reason) => showLimit("Arms", LIMITS.armsCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Arms") ? inputError : ""} />
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(0,134,109,0.06) 0%, transparent 60%)" label="Neck" unit="cm" latest={s.body[0]?.neck} value={mNeck} onChange={setMNeck} max={LIMITS.neckCm} onLimit={(reason) => showLimit("Neck", LIMITS.neckCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Neck") ? inputError : ""} />
              </div>
            </div>

            <div>
              <SectionTitle style={{ marginBottom: 12, paddingLeft: 4 }}>Torso & Core</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(101,163,13,0.06) 0%, transparent 60%)" label="Waist" unit="cm" latest={s.body[0]?.waist} value={mWaist} onChange={setMWaist} max={LIMITS.waistCm} onLimit={(reason) => showLimit("Waist", LIMITS.waistCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Waist") ? inputError : ""} />
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(101,163,13,0.06) 0%, transparent 60%)" label="Hips" unit="cm" latest={s.body[0]?.hips} value={mHips} onChange={setMHips} max={LIMITS.hipsCm} onLimit={(reason) => showLimit("Hips", LIMITS.hipsCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Hips") ? inputError : ""} />
              </div>
            </div>

            <div>
              <SectionTitle style={{ marginBottom: 12, paddingLeft: 4 }}>Lower Body</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(138,92,0,0.05) 0%, transparent 60%)" label="Thighs" unit="cm" latest={s.body[0]?.thighs} value={mThighs} onChange={setMThighs} max={LIMITS.thighsCm} onLimit={(reason) => showLimit("Thighs", LIMITS.thighsCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Thighs") ? inputError : ""} />
                <MeasurementCard bgGradient="linear-gradient(135deg, rgba(138,92,0,0.05) 0%, transparent 60%)" label="Calves" unit="cm" latest={s.body[0]?.calves} value={mCalves} onChange={setMCalves} max={LIMITS.calvesCm} onLimit={(reason) => showLimit("Calves", LIMITS.calvesCm, "cm", reason, 1)} tone="var(--color-text-main)" error={inputError.startsWith("Calves") ? inputError : ""} />
              </div>
            </div>
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

      {section === "roadmap" && (
        <LegalPage
          title="Upcoming Features"
          items={[
            "Public Communities: Connect, share, and practice with others.",
            "AI Assistant: Get personalized insights and guidance.",
            "Steps Tracker: Connect to your phone's default health app.",
            "Nutrition & Water Tracking: Comprehensive fuel monitoring.",
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

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <h2 style={{ 
      fontSize: 13, 
      fontWeight: 800, 
      letterSpacing: "0.1em", 
      textTransform: "uppercase",
      marginBottom: 10,
      background: "var(--grad-mint)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      ...style
    }}>
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
    <div className="row between" style={{ padding: "14px 16px", background: "var(--color-surface-1)", borderRadius: 12, marginBottom: 8, border: "1px solid rgba(115,253,156,0.08)", gap: 12 }}>
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
  bgGradient,
  error,
}: {
  label: string;
  latest?: number;
  value: string;
  onChange: (v: string) => void;
  max: number;
  unit: string;
  onLimit: (reason: "max" | "min" | "negative") => void;
  tone: string;
  bgGradient?: string;
  error?: string;
}) {
  return (
    <section className="card" style={{ padding: 14, marginBottom: 0, display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      {bgGradient && <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: bgGradient, pointerEvents: "none" }} />}
      <div className="row between" style={{ alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>{label}</h3>
          <p className="text-caption" style={{ marginTop: 4, fontSize: 11 }}>
            Latest: <span style={{ marginLeft: 4 }}>{latest ? latest.toFixed(label === "Weight" ? 1 : 0) : "--"}</span>
          </p>
        </div>
        <div className="uppercase-label" style={{ fontSize: 10, opacity: 0.7 }}>
          {unit}
        </div>
      </div>
      <input
        className="input"
        type="number"
        value={value}
        placeholder="00.0"
        onChange={(e) => {
          onChange(clampNumericInput(e.target.value, max, { decimal: true, min: 1, onLimit }));
        }}
        style={{
          width: "100%",
          padding: "10px 12px",
          color: "var(--color-mint-active)",
          fontWeight: 700,
          fontSize: 16,
          textAlign: "center",
          background: "var(--color-surface-1)",
          position: "relative",
          zIndex: 1
        }}
      />
      {error && <div style={{ color: "var(--color-status-error)", fontSize: 11, marginTop: 4, textAlign: "center" }}>{error}</div>}
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
