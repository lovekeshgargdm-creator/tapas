"use client";

import { useEffect, useState } from "react";
import { IconClose, IconInstall } from "./Icons";
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

    const onBIP = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari =
      /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
    if (isIOS && isSafari) setIosHint(true);

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
        borderRadius: 8,
        border: "1px solid rgba(115,253,156,0.22)",
        background: "rgba(18,49,31,0.7)",
      }}
    >
      <div
        style={{
          width: compact ? 30 : 34,
          height: compact ? 30 : 34,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Logo size={compact ? 28 : 32} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: compact ? 14 : 15 }}>Install Tapas</div>
        <p className="text-caption" style={{ lineHeight: 1.25 }}>
          {iosHint
            ? "On iPhone, tap Share, then Add to Home Screen."
            : deferred && !manualHint
              ? "Open faster from your home screen."
              : "Use your browser menu or install icon."}
        </p>
      </div>
      <button className="btn btn-primary" style={{ minHeight: 38, padding: "8px 14px", flexShrink: 0 }} onClick={install}>
        <IconInstall width={15} height={15} /> {iosHint ? "Steps" : "Install"}
      </button>
      <button className="icon-btn" aria-label="Dismiss install prompt" onClick={dismiss} style={{ width: 32, height: 32, flexShrink: 0 }}>
        <IconClose width={16} height={16} />
      </button>
    </section>
  );
}
