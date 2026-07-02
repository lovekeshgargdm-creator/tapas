"use client";

import { useEffect, useState } from "react";
import { IconClose, IconInstall } from "./Icons";
import { Logo } from "./Logo";
import { INSTALL_DISMISS_KEY, isStandaloneApp } from "@/lib/install";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallAppCard({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      localStorage.getItem(INSTALL_DISMISS_KEY) ||
      sessionStorage.getItem("tapas-install-card-dismissed")
    ) {
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
  }, []);

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    sessionStorage.setItem("tapas-install-card-dismissed", "1");
    sessionStorage.setItem("tapas-install-dismissed", "1");
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
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
        gap: 12,
        padding: compact ? 12 : 14,
        border: "1px solid rgba(115,253,156,0.2)",
        background: "linear-gradient(135deg, rgba(115,253,156,0.1), rgba(46,229,181,0.04))",
      }}
    >
      <div
        style={{
          width: compact ? 38 : 44,
          height: compact ? 38 : 44,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Logo size={compact ? 36 : 42} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: compact ? 14 : 15 }}>Install Tapas</div>
        <p className="text-caption">
          {iosHint
            ? "On iPhone, use Share, then Add to Home Screen."
            : deferred
              ? "Open faster from your home screen."
              : "Use your browser install icon or menu to add Tapas."}
        </p>
      </div>
      {!iosHint && deferred && (
        <button className="btn btn-primary" style={{ minHeight: 36, padding: "7px 12px" }} onClick={install} disabled={!deferred}>
          <IconInstall width={15} height={15} /> Install
        </button>
      )}
      <button className="icon-btn" aria-label="Dismiss install prompt" onClick={dismiss} style={{ width: 34, height: 34 }}>
        <IconClose width={16} height={16} />
      </button>
    </section>
  );
}
