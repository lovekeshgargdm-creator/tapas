"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { IconClose, IconShare } from "./Icons";
import { INSTALL_DISMISS_KEY, INSTALL_REQUEST_EVENT, isStandaloneApp } from "@/lib/install";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandaloneApp()) return;

    if ((window as any).tapasDeferredPrompt) {
      setDeferred((window as any).tapasDeferredPrompt as BIPEvent);
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      (window as any).tapasDeferredPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    const onRequest = () => {
      if (!isStandaloneApp()) setShow(true);
    };
    window.addEventListener(INSTALL_REQUEST_EVENT, onRequest);

    // iOS has no beforeinstallprompt; users must use Share > Add to Home Screen on all browsers.
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
                  (window.navigator.userAgent.includes("Mac") && "ontouchend" in document);
    if (isIOS) setIosHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener(INSTALL_REQUEST_EVENT, onRequest);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(INSTALL_DISMISS_KEY, "1");
    sessionStorage.setItem("tapas-install-dismissed", "1");
    sessionStorage.setItem("tapas-install-card-dismissed", "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Install TAPAS"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        top: "calc(12px + env(safe-area-inset-top))",
        width: "min(460px, calc(100% - 24px))",
        maxHeight: "calc(100dvh - 24px - env(safe-area-inset-top))",
        zIndex: 200,
        animation: "fadeUp 0.45s ease both",
        background: "var(--color-surface-2)",
        border: "1px solid rgba(115,253,156,0.15)",
        borderRadius: 16,
        color: "var(--color-text-primary)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--install-banner-logo-bg)",
            border: "1px solid var(--install-banner-logo-border)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={30} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Install TAPAS</div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            {iosHint
              ? <span>Tap Share <span style={{ display: "inline-flex", verticalAlign: "text-bottom", margin: "0 2px" }}><IconShare width={14} height={14} style={{ color: "var(--color-mint-active)" }} /></span> then &quot;Add to Home Screen&quot;</span>
              : deferred
                ? "Add TAPAS to your home screen for the full app."
                : "Use your browser menu or install icon to add TAPAS."}
          </div>
        </div>
        {!iosHint && deferred && (
          <button
            className="btn btn-primary"
            style={{ minHeight: 40, padding: "8px 16px", flexShrink: 0 }}
            onClick={install}
            disabled={!deferred}
          >
            Install
          </button>
        )}
        <button
          className="icon-btn"
          aria-label="Dismiss"
          onClick={dismiss}
          style={{ width: 36, height: 36, flexShrink: 0, color: "var(--color-text-muted)" }}
        >
          <IconClose width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
