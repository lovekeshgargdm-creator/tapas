"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Wordmark } from "@/components/Logo";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { IconGoogle, IconArrowRight, IconClose, IconCheck, IconEye, IconEyeOff } from "@/components/Icons";
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);

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
      if (mode === "signup") {
        setMessage("Account created successfully! Please sign in.");
        setMode("signin");
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--color-surface-2)", padding: 4, borderRadius: 12, marginBottom: 24, border: "1px solid var(--color-border)" }}>
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as any)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  background: mode === m ? "var(--color-surface-main)" : "transparent",
                  color: mode === m ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--color-border)" : "none",
                  transition: "all .2s",
                  cursor: "pointer"
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
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: 4,
                    display: "grid",
                    placeItems: "center"
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
                </button>
              </div>
            </Field>

            <button className="btn btn-primary btn-block btn-lg" disabled={busy} type="submit" style={{ marginTop: 4 }}>
              {busy ? (mode === "signin" ? "Signing in…" : "Creating account…") : mode === "signin" ? "Sign in" : "Create account"}
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
            style={{ background: "var(--color-surface-main)", border: "1px solid var(--color-text-muted)", color: "var(--color-text-primary)", fontWeight: 500, transition: "background 0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--color-surface-2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--color-surface-main)")}
          >
            <IconGoogle />
            Continue with Google
          </button>
        </motion.div>

        <div style={{ marginTop: 16 }}>
          <InstallAppCard compact />
        </div>

        <p className="text-caption muted" style={{ textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          By continuing you agree to our{" "}
          <span onClick={() => setShowPrivacy(true)} style={{ textDecoration: "underline", cursor: "pointer", color: "inherit" }}>
            Terms & Privacy
          </span>.<br />
          Your practice data stays private to you.
        </p>
      </div>

      <div 
        style={{ 
          position: "fixed", inset: 0, zIndex: 999, overflowY: "auto", 
          padding: "max(24px, 5vh) 16px max(24px, 5vh) 16px", display: showPrivacy ? "flex" : "none",
        }}
      >
        <div 
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} 
          onClick={() => setShowPrivacy(false)} 
        />
        <div 
          className="card" 
          style={{ position: "relative", zIndex: 1, maxWidth: 560, width: "100%", margin: "auto", padding: 24, boxShadow: "0 24px 48px rgba(0,0,0,0.6)" }}
        >
          <button 
            onClick={() => setShowPrivacy(false)} 
            style={{ position: "absolute", top: 16, right: 16, color: "var(--color-text-secondary)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "50%", width: 32, height: 32, display: "grid", placeItems: "center", cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--color-surface-3)", e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--color-surface-2)", e.currentTarget.style.color = "var(--color-text-secondary)")}
          >
            <IconClose width={18} height={18} />
          </button>
          
          <div style={{ marginBottom: 20, paddingRight: 32 }}>
            <h2 className="text-xl" style={{ marginBottom: 6, fontWeight: 600 }}>Your privacy is our priority.</h2>
            <p className="text-caption" style={{ color: "var(--color-text-secondary)", fontSize: 13, lineHeight: 1.4 }}>Everything you track in TAPAS stays strictly between you and your device.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { title: "Strictly Confidential", text: "We never sell or share your personal information with third parties. Ever." },
              { title: "Secure Storage", text: "All practice routines, body measurements, and logs are stored securely within your TAPAS account." },
              { title: "Full Control", text: "You have full control over your data. You can clear your local device cache at any time by simply signing out." },
              { title: "Easy Exports", text: "Want a personal backup? You can easily export your entire health journey at any time." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--color-surface-2)", padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-border)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-surface-3)", border: "1px solid var(--color-border)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 2 }}>
                  <IconCheck width={14} height={14} style={{ color: "var(--color-mint-active)" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>{item.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
