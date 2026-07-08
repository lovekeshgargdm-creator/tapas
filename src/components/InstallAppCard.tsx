"use client";

import { useEffect, useState } from "react";
import { IconClose, IconInstall, IconShare } from "./Icons";
import { Logo } from "./Logo";
import { isStandaloneApp } from "@/lib/install";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallAppCard({ compact = false, placement = "default" }: { compact?: boolean; placement?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [manualHint, setManualHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissKey = `tapas-install-card-dismissed:${placement}`;
    if (sessionStorage.getItem(dismissKey)) {
      setHidden(true);
      return;
    }

    if (isStandaloneApp()) {
      setHidden(true);
      return;
    }

    if (typeof window !== "undefined" && (window as any).tapasDeferredPrompt) {
      setDeferred((window as any).tapasDeferredPrompt as BIPEvent);
    }

    const onBIP = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BIPEvent);
      if (typeof window !== "undefined") {
        (window as any).tapasDeferredPrompt = event;
      }
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) || 
                  (window.navigator.userAgent.includes("Mac") && "ontouchend" in document);
    if (isIOS) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [placement]);

  const dismiss = () => {
    sessionStorage.setItem(`tapas-install-card-dismissed:${placement}`, "1");
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) {
      setManualHint(true);
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (hidden) return null;

  return (
    <section
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        padding: compact ? "12px 14px" : "14px 16px",
        borderRadius: 14,
        border: "1px solid var(--install-banner-border)",
        background: "linear-gradient(135deg, var(--install-banner-bg-start) 0%, var(--color-surface-2) 100%)",
        boxShadow: "var(--install-banner-shadow), inset 0 1px 0 rgba(255,255,255,0.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -30,
          left: -30,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(115,253,156,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          width: compact ? 40 : 48,
          height: compact ? 40 : 48,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          borderRadius: 12,
          background: "var(--install-banner-logo-bg)",
          border: "1px solid var(--install-banner-logo-border)",
        }}
      >
        <Logo size={compact ? 28 : 34} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", textAlign: "left" }}>
        <div style={{ fontWeight: 700, fontSize: compact ? 14 : 15, color: "var(--color-text-primary)" }}>Install TAPAS</div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.3, margin: "2px 0 0" }}>
          {iosHint
            ? <span>Tap Share <span style={{ display: "inline-flex", verticalAlign: "text-bottom", margin: "0 2px" }}><IconShare width={14} height={14} style={{ color: "var(--color-mint-active)" }} /></span> then &quot;Add to Home Screen&quot;</span>
            : deferred && !manualHint
              ? "Get the full app experience"
              : "Use browser menu to install"}
        </p>
      </div>
      {!iosHint && (
        <button className="btn btn-primary" style={{ minHeight: 36, padding: "7px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, borderRadius: 10, fontSize: 13, fontWeight: 600 }} onClick={install}>
          <IconInstall width={14} height={14} />
          <span>Install</span>
        </button>
      )}
      <button className="icon-btn" aria-label="Dismiss install prompt" onClick={dismiss} style={{ width: 28, height: 28, flexShrink: 0, opacity: 0.5 }}>
        <IconClose width={14} height={14} />
      </button>
    </section>
  );
}
