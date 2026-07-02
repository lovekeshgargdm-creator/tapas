"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { Logo } from "@/components/Logo";
import { DOSHA_INFO } from "@/lib/seed";
import { uid, todayISO, useStore } from "@/lib/store";
import { LIMITS, clampNumericInput } from "@/lib/limits";
import { useMounted } from "@/lib/useMounted";
import {
  IconCheck,
  IconEdit,
  IconSettings,
} from "@/components/Icons";
import type { Gender } from "@/lib/types";

const TITLES: Record<string, string> = {
  personal: "Profile & Account",
  measurements: "Measurements",
  routines: "Routines",
  activity: "Account Activity",
  support: "Help & Support",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};

const GOALS = [
  { id: "strength", label: "Get stronger" },
  { id: "flexible", label: "Get more flexible" },
  { id: "stress", label: "Reduce stress & breathe better" },
  { id: "consistency", label: "Build consistency" },
];

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

  const showLimit = (label: string, max: number, unit = "") => {
    setInputError(`${label} cannot be more than ${max}${unit ? ` ${unit}` : ""}. Negative values are not allowed.`);
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

  return (
    <div className="page">
      <BackHeader title={title} fallback="/profile" />

      {section === "personal" && (
        <div>
          <section className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                border: "1px solid rgba(115,253,156,0.3)",
                background: "var(--color-surface-main)",
                flexShrink: 0,
              }}
            >
              <Logo size={68} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editingAccount ? (
                <div className="stack gap-xs">
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" style={{ minHeight: 38 }} />
                  <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" style={{ minHeight: 38 }} />
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0 }}>{s.profile.name || "Practitioner"}</h2>
                  <p className="text-caption" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.profile.email}
                  </p>
                </>
              )}
            </div>
            <button
              className="icon-btn"
              onClick={() => (editingAccount ? saveAccount() : setEditingAccount(true))}
              aria-label="Edit name and email"
              disabled={editingAccount && (!editName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim()))}
              style={{ width: 38, height: 38, flexShrink: 0 }}
            >
              {editingAccount ? <IconCheck width={17} height={17} /> : <IconEdit width={17} height={17} />}
            </button>
          </section>

          {dosha && (
            <section className="card" style={{ marginBottom: 18 }}>
              <div className="row between" style={{ gap: 12, marginBottom: 10 }}>
                <SectionTitle>Ayurvedic Profile</SectionTitle>
                <Link href="/onboarding?retake=true" className="pill pill-active" style={{ textDecoration: "none" }}>
                  Retake quiz
                </Link>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700 }}>{dosha.name}</h3>
              <p className="secondary" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
                {dosha.blurb}
              </p>
            </section>
          )}

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <SectionTitle>Goals</SectionTitle>
              <button className="icon-btn" onClick={() => (editingGoals ? saveGoals() : setEditingGoals(true))} aria-label="Edit goals">
                {editingGoals ? <IconCheck width={17} height={17} /> : <IconSettings width={17} height={17} />}
              </button>
            </div>
            {editingGoals ? (
              <div className="stack gap-sm">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    className={`chip ${goalDraft.includes(goal.id) ? "active" : ""}`}
                    onClick={() => toggleGoal(goal.id)}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {goal.label}
                  </button>
                ))}
                <button className="btn btn-primary btn-block" onClick={saveGoals}>Save Goals</button>
              </div>
            ) : s.profile.goals.length > 0 ? (
              <div className="row gap-sm wrap">
                {s.profile.goals.map((goal) => (
                  <span className="pill pill-active" key={goal}>
                    {GOALS.find((item) => item.id === goal)?.label || goal}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-caption">No goals selected yet.</p>
            )}
          </section>

          <section className="card" style={{ marginBottom: 18 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <SectionTitle>Basic Info</SectionTitle>
              <button className="icon-btn" onClick={() => (editing ? savePersonal() : setEditing(true))} aria-label="Edit info">
                {editing ? <IconCheck width={17} height={17} /> : <IconSettings width={17} height={17} />}
              </button>
            </div>
            {inputError && <LimitNotice message={inputError} />}
            {editing ? (
              <div className="stack gap-sm">
                <Field label="Age">
                  <input className="input" type="number" inputMode="numeric" min="1" max={LIMITS.age} value={editAge} onChange={(e) => setEditAge(clampNumericInput(e.target.value, LIMITS.age, { onLimit: () => showLimit("Age", LIMITS.age) }))} />
                </Field>
                <Field label="Gender">
                  <select className="input" value={editGender} onChange={(e) => setEditGender(e.target.value as Gender)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </Field>
                <Field label="Height (cm)">
                  <input className="input" type="number" inputMode="decimal" min="50" max={LIMITS.heightCm} value={editHeight} onChange={(e) => setEditHeight(clampNumericInput(e.target.value, LIMITS.heightCm, { decimal: true, onLimit: () => showLimit("Height", LIMITS.heightCm, "cm") }))} />
                </Field>
                <button className="btn btn-primary btn-block" onClick={savePersonal}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid var(--color-outline-muted)" }}>
                <MetricRow label="Age" value={s.profile.age ? `${s.profile.age} years` : "-"} />
                <MetricRow label="Gender" value={genderLabel(s.profile.gender)} />
                <MetricRow label="Height" value={heightDisplay()} />
              </div>
            )}
          </section>

          <section className="card" style={{ marginBottom: 18 }}>
            <SectionTitle>Change Password</SectionTitle>
            <div className="stack gap-sm" style={{ marginTop: 12 }}>
              <Field label="Current password">
                <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </Field>
              <Field label="New password">
                <input className="input" type="password" minLength={8} value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} />
              </Field>
              {passwordMessage && <p className="text-caption">{passwordMessage}</p>}
              <button className="btn btn-primary btn-block" onClick={savePassword} disabled={!currentPassword || nextPassword.length < 8}>
                Update Password
              </button>
            </div>
          </section>

          <InstallAppCard />
        </div>
      )}

      {section === "measurements" && (
        <div>
          <section className="card" style={{ marginBottom: 20 }}>
            <SectionTitle>Latest Saved</SectionTitle>
            {s.body.length > 0 ? (
              <div>
                <p className="text-caption" style={{ marginBottom: 12 }}>
                  Recorded {new Date(s.body[0].date).toLocaleDateString()}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {s.body[0].weight && <MetricTile label="Weight" value={`${s.body[0].weight} kg`} tone="#8fd4ff" />}
                  {s.body[0].chest && <MetricTile label="Chest" value={`${s.body[0].chest} cm`} tone="#73fd9c" />}
                  {s.body[0].waist && <MetricTile label="Waist" value={`${s.body[0].waist} cm`} tone="#fdb974" />}
                  {s.body[0].hips && <MetricTile label="Hips" value={`${s.body[0].hips} cm`} tone="#2ee5b5" />}
                  {s.body[0].arms && <MetricTile label="Arms" value={`${s.body[0].arms} cm`} tone="#9b8dce" />}
                  {s.body[0].thighs && <MetricTile label="Thighs" value={`${s.body[0].thighs} cm`} tone="#7ecfff" />}
                  {s.body[0].calves && <MetricTile label="Calves" value={`${s.body[0].calves} cm`} tone="#aad4b8" />}
                  {s.body[0].neck && <MetricTile label="Neck" value={`${s.body[0].neck} cm`} tone="#ef8c8c" />}
                </div>
              </div>
            ) : (
              <p className="text-caption">No measurements recorded yet.</p>
            )}
          </section>

          <section className="card">
            <SectionTitle>Update Measurements</SectionTitle>
            {inputError && <LimitNotice message={inputError} />}
            <div className="stack gap-sm" style={{ marginTop: 14 }}>
              <MeasurementInput label="Weight" unit="kg" value={mWeight} onChange={setMWeight} max={LIMITS.weightKg} onLimit={() => showLimit("Weight", LIMITS.weightKg, "kg")} />
              <MeasurementInput label="Chest" unit="cm" value={mChest} onChange={setMChest} max={LIMITS.chestCm} onLimit={() => showLimit("Chest", LIMITS.chestCm, "cm")} />
              <MeasurementInput label="Waist" unit="cm" value={mWaist} onChange={setMWaist} max={LIMITS.waistCm} onLimit={() => showLimit("Waist", LIMITS.waistCm, "cm")} />
              <MeasurementInput label="Hips" unit="cm" value={mHips} onChange={setMHips} max={LIMITS.hipsCm} onLimit={() => showLimit("Hips", LIMITS.hipsCm, "cm")} />
              <MeasurementInput label="Arms" unit="cm" value={mArms} onChange={setMArms} max={LIMITS.armsCm} onLimit={() => showLimit("Arms", LIMITS.armsCm, "cm")} />
              <MeasurementInput label="Thighs" unit="cm" value={mThighs} onChange={setMThighs} max={LIMITS.thighsCm} onLimit={() => showLimit("Thighs", LIMITS.thighsCm, "cm")} />
              <MeasurementInput label="Calves" unit="cm" value={mCalves} onChange={setMCalves} max={LIMITS.calvesCm} onLimit={() => showLimit("Calves", LIMITS.calvesCm, "cm")} />
              <MeasurementInput label="Neck" unit="cm" value={mNeck} onChange={setMNeck} max={LIMITS.neckCm} onLimit={() => showLimit("Neck", LIMITS.neckCm, "cm")} />
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 22 }} onClick={saveMeasurements}>
              {saved ? "Saved" : "Save Measurements"}
            </button>
          </section>
        </div>
      )}

      {section === "routines" && (
        <div className="stack gap-sm">
          {s.weeklyRoutines.length > 0 ? (
            s.weeklyRoutines.map((routine) => (
              <section className="card" key={routine.id}>
                <div className="row between" style={{ gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>{routine.name}</h2>
                    <p className="text-caption" style={{ marginTop: 4 }}>
                      {routine.module === "train" ? "Training" : routine.module === "yoga" ? "Yoga" : "Combined"} -
                      {" "}
                      {routine.days.filter((day) => day.enabled).length} active days
                    </p>
                  </div>
                  <span className="pill pill-active">{routine.module}</span>
                </div>
              </section>
            ))
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
            Need help with Tapas or AEROLINK? Contact support and include your account email so we can help faster.
          </p>
          <div style={{ borderTop: "1px solid var(--color-outline-muted)", marginTop: 18 }}>
            <MetricRow label="Email" value="support@aerolink.com" />
            <MetricRow label="Phone" value="+1 (800) 555-0199" />
          </div>
        </section>
      )}

      {section === "privacy" && (
        <LegalPage
          title="Your privacy is our priority."
          items={[
            "We do not sell your personal data.",
            "Practice, body, and routine data stay in your Tapas app state unless you export it.",
            "You can sign out to clear local practice data on this device.",
            "Use export when you want a personal backup of your data.",
          ]}
        />
      )}

      {section === "terms" && (
        <LegalPage
          title="Terms of Service"
          items={[
            "Tapas provides wellness tracking and practice guidance, not medical advice.",
            "Consult a qualified professional before starting routines if you have health concerns.",
            "You are responsible for practicing within your current capacity.",
            "AEROLINK may update these terms as the product evolves.",
          ]}
        />
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
    <div className="row between" style={{ padding: "13px 0", borderBottom: "1px solid var(--color-outline-muted)", gap: 12 }}>
      <span className="text-caption">{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      style={{
        minHeight: 82,
        padding: 13,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${tone}1f, rgba(255,255,255,0.025))`,
        border: `1px solid ${tone}40`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div className="row between" style={{ gap: 8 }}>
        <div className="text-caption">{label}</div>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone, boxShadow: `0 0 12px ${tone}99` }} />
      </div>
      <div className="text-mono" style={{ marginTop: 10, fontSize: 20, fontWeight: 700, color: tone }}>
        {value}
      </div>
    </div>
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

function MeasurementInput({
  label,
  value,
  onChange,
  max,
  unit,
  onLimit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  unit: string;
  onLimit: () => void;
}) {
  return (
    <div
      className="row between"
      style={{
        gap: 12,
        padding: "11px 12px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(115,253,156,0.07), rgba(255,255,255,0.02))",
        border: "1px solid rgba(115,253,156,0.14)",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      <div className="row gap-xs" style={{ flexShrink: 0 }}>
        <input
          type="number"
          className="input"
          value={value}
          placeholder="0"
          onChange={(e) => {
            onChange(clampNumericInput(e.target.value, max, { decimal: true, onLimit }));
          }}
          style={{ width: 92, padding: "8px 10px", textAlign: "right", minHeight: 38 }}
        />
        <span className="text-caption" style={{ width: 22 }}>
          {unit}
        </span>
      </div>
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
