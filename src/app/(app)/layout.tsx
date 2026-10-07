"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { Logo } from "@/components/Logo";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mounted = useMounted();
  const isAuthed = useStore((s) => s.isAuthed);
  const onboarded = useStore((s) => s.profile.onboarded);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthed) router.replace("/login");
    else if (!onboarded) router.replace("/onboarding");
  }, [mounted, isAuthed, onboarded, router]);

  if (!mounted || !isAuthed || !onboarded) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ animation: "pulseGlow 1.6s ease-in-out infinite" }}>
          <Logo size={54} withGlow />
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
