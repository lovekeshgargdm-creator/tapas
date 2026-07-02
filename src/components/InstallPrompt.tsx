"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { IconClose } from "./Icons";
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

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!localStorage.getItem(INSTALL_DISMISS_KEY)) {
        window.setTimeout(() => setShow(true), 8000);
      }
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    const onRequest = () => {
      if (!isStandaloneApp()) setShow(true);
    };
    window.addEventListener(INSTALL_REQUEST_EVENT, onRequest);

    // iOS Safari has no beforeinstallprompt — show a hint tooltip instead.
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
    if (isIOS && isSafari) {
      setIosHint(true);
      window.setTimeout(() => {
        if (!localStorage.getItem(INSTALL_DISMISS_KEY)) setShow(true);
      }, 9000);
    }

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
      aria-label="Install Tapas"
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: "calc(90px + env(safe-area-inset-bottom))",
        width: "min(460px, calc(100% - 24px))",
        maxHeight: "calc(100dvh - 120px)",
        zIndex: 200,
        animation: "fadeUp 0.45s ease both",
      }}
      className="glass"
    >
      <div
        style={{
          borderRadius: 16,
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
            background: "rgba(115,253,156,0.1)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Logo size={30} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Install Tapas</div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            {iosHint
              ? "Tap Share → Add to Home Screen"
              : "Add to your home screen for the full app."}
          </div>
        </div>
        {!iosHint && (
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
          style={{ width: 36, height: 36, flexShrink: 0 }}
        >
          <IconClose width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
