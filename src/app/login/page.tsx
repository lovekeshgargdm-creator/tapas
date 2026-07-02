"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Wordmark } from "@/components/Logo";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { useStore } from "@/lib/store";
import { IconGoogle, IconArrowRight } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setTimeout(() => {
      login(email, name || undefined);
      router.replace("/onboarding");
    }, 550);
  };

  const google = () => {
    setBusy(true);
    setTimeout(() => {
      login("you@gmail.com", "Practitioner");
      router.replace("/onboarding");
    }, 550);
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(130% 90% at 50% 0%, #12311f 0%, #0e150f 55%)",
      }}
    >
      <Ambient />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "calc(24px + env(safe-area-inset-top)) 22px 32px",
          maxWidth: 460,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 30 }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Logo size={62} withGlow />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: 0 }}>
            {mode === "signin" ? "Welcome back to " : "Begin with "}
            <Wordmark size={27} />
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: 8, fontSize: 15 }}>
            One calm place for movement, yoga & breath.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="clay-deep"
          style={{ padding: 22 }}
        >
          {/* segmented toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              background: "var(--color-surface-main)",
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "10px 0",
                  borderRadius: 9,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  background: mode === m ? "var(--color-surface-3)" : "transparent",
                  color: mode === m ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  transition: "all .2s",
                }}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="stack gap-md">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  className="input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}
            <Field label="Email">
              <input
                className="input"
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            <button className="btn btn-primary btn-block btn-lg" disabled={busy} type="submit" style={{ marginTop: 4 }}>
              {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
              {!busy && <IconArrowRight width={18} height={18} />}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(134,148,135,0.16)" }} />
            <span className="text-caption muted">or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(134,148,135,0.16)" }} />
          </div>

          <button className="btn btn-secondary btn-block" onClick={google} disabled={busy}
            style={{ background: "var(--color-surface-main)", border: "1px solid var(--color-text-muted)", color: "var(--color-text-primary)" }}>
            <IconGoogle />
            Continue with Google
          </button>
        </motion.div>

        <div style={{ marginTop: 16 }}>
          <InstallAppCard compact />
        </div>

        <p className="text-caption muted" style={{ textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          By continuing you agree to our Terms & Privacy.<br />
          Your practice data stays private to you.
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="stack gap-xs">
      <span className="text-caption" style={{ paddingLeft: 2 }}>{label}</span>
      {children}
    </label>
  );
}
