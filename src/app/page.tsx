"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo, Wordmark } from "@/components/Logo";
import { Ambient } from "@/components/Ambient";
import { InstallAppCard } from "@/components/InstallAppCard";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";

export default function Splash() {
  const router = useRouter();
  const mounted = useMounted();
  const isAuthed = useStore((s) => s.isAuthed);
  const onboarded = useStore((s) => s.profile.onboarded);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setLeaving(true);
      const dest = !isAuthed ? "/login" : !onboarded ? "/onboarding" : "/home";
      setTimeout(() => router.replace(dest), 500);
    }, 2100);
    return () => clearTimeout(t);
  }, [mounted, isAuthed, onboarded, router]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(130% 100% at 50% 20%, #12311f 0%, #0e150f 60%)",
      }}
    >
      <Ambient />
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
              marginTop: 10,
              fontSize: 12.5,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            Move · Yoga · Breathe
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          style={{ marginTop: 22, width: "min(360px, calc(100vw - 44px))" }}
        >
          <InstallAppCard compact />
        </motion.div>
      </motion.div>

      {/* loading shimmer bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: leaving ? 0 : 1 }}
        style={{
          position: "absolute",
          bottom: "14%",
          width: 120,
          height: 3,
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(115,253,156,0.12)",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: "60%",
            height: "100%",
            background: "linear-gradient(90deg,transparent,#73fd9c,transparent)",
          }}
        />
      </motion.div>
    </main>
  );
}
