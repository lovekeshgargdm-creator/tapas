"use client";

import Link from "next/link";
import { IconInstall } from "./Icons";
import { Logo } from "./Logo";
import { requestInstallPrompt } from "@/lib/install";

export function AppHeader({
  title,
  subtitle,
  accent = "var(--color-mint-active)",
  right,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  right?: React.ReactNode;
}) {
  return (
    <header
      className="row between"
      style={{ marginBottom: 22, gap: 12 }}
    >
      <div className="row gap-sm" style={{ minWidth: 0 }}>
        <Link
          href="/profile"
          aria-label="Profile"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            flexShrink: 0,
            background: "transparent",
            display: "grid",
            placeItems: "center",
            border: "none",
            overflow: "hidden",
          }}
        >
          <Logo size={36} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0, color: accent, lineHeight: 1.15 }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-caption" style={{ marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right ?? (
        <button className="icon-btn" onClick={requestInstallPrompt} aria-label="Install app" title="Install app">
          <IconInstall width={22} height={22} />
        </button>
      )}
    </header>
  );
}
