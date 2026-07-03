"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Wordmark } from "@/components/Logo";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { IconGoogle, IconArrowRight } from "@/components/Icons";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { prepareSignedInUser } from "@/lib/supabaseSync";

export default function LoginPage() {
  const router = useRouter();
  const isAuthed = useStore((s) => s.isAuthed);
  const onboarded = useStore((s) => s.profile.onboarded);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAuthed) router.replace(onboarded ? "/home" : "/onboarding");
  }, [isAuthed, onboarded, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase environment keys are missing.");
      setBusy(false);
      return;
    }

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: name || email.split("@")[0] } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      setBusy(false);
      return;
    }

    if (!result.data.session || !result.data.user) {
      setMessage("Check your email to confirm your account, then sign in.");
      setBusy(false);
      return;
    }

    const isOnboarded = await prepareSignedInUser(result.data.user);
    router.replace(isOnboarded ? "/home" : "/onboarding");
  };

  const google = async () => {
    setBusy(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase environment keys are missing.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      setMessage(error.message);
      setBusy(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface-main)",
      }}
    >
      <Ambient />
      <div style={{ position: "absolute", top: "calc(16px + env(safe-area-inset-top))", right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
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
            One calm place for training, yoga & breathing.
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
            {message && (
              <p className="text-caption" style={{ color: "var(--color-text-secondary)", lineHeight: 1.45 }}>
                {message}
              </p>
            )}
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
