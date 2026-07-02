"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { IconClose } from "./Icons";

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
    if (sessionStorage.getItem("tapas-install-dismissed")) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone;
    if (standalone) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      window.setTimeout(() => setShow(true), 8000);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari has no beforeinstallprompt — show a hint tooltip instead.
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /safari/i.test(window.navigator.userAgent) && !/crios|fxios/i.test(window.navigator.userAgent);
    if (isIOS && isSafari) {
      window.setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 9000);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("tapas-install-dismissed", "1");
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
