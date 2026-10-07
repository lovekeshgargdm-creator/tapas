"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Wordmark } from "@/components/Logo";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";

export default function Splash() {
  const router = useRouter();
  const mounted = useMounted();
  const isAuthed = useStore((s) => s.isAuthed);
  const onboarded = useStore((s) => s.profile.onboarded);
  const [leaving, setLeaving] = useState(false);

  const enterApp = () => {
    if (!mounted || leaving) return;
    setLeaving(true);
    const dest = !isAuthed ? "/login" : !onboarded ? "/onboarding" : "/home";
    setTimeout(() => router.replace(dest), 320);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        background: "var(--color-surface-main)",
      }}
    >
      <Ambient />
      <div style={{ position: "absolute", top: "calc(16px + env(safe-area-inset-top))", right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        style={{ position: "relative", zIndex: 1, textAlign: "center", padding: 24 }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Logo size={104} withGlow />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          style={{ marginTop: 26 }}
        >
          <div style={{ fontSize: 40 }}>
            <Wordmark size={40} />
          </div>
          <p
            className="text-mono"
            style={{
              marginTop: 12,
              fontSize: 13,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "var(--color-text-secondary)",
            }}
          >
            Train · Yoga · Breathe
          </p>
          <p
            className="secondary"
            style={{
              maxWidth: 340,
              margin: "16px auto 0",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            Plan routines, log workouts, and track your daily progress in one place.
          </p>
          <button
            className="btn btn-primary btn-lg"
            style={{ 
              marginTop: 32, 
              minWidth: 180,
              boxShadow: "0 4px 16px rgba(74, 227, 141, 0.15)",
              letterSpacing: "0.02em"
            }}
            onClick={enterApp}
            disabled={!mounted || leaving}
          >
            Enter
          </button>
        </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            style={{ marginTop: 40, width: "min(360px, calc(100vw - 44px))" }}
          >
          <InstallAppCard compact placement="startup" />
        </motion.div>
      </motion.div>


    </main>
  );
}
