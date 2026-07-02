"use client";

import Link from "next/link";
import { IconBell } from "./Icons";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";

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
  const hasAccountLogs = useStore((s) => (s.accountLogs || []).length > 0);

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
        <Link className="icon-btn" href="/profile/activity" aria-label="Account activity" style={{ position: "relative" }}>
          <IconBell width={22} height={22} />
          {hasAccountLogs && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: 9,
                top: 9,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-mint-active)",
                boxShadow: "0 0 8px rgba(115,253,156,0.75)",
              }}
            />
          )}
        </Link>
      )}
    </header>
  );
}
