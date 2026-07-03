"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

export function BackHeader({
  title,
  subtitle,
  fallback = "/home",
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  fallback?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();

  const goBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallback);
  };

  return (
    <header
      className="row between"
      style={{
        gap: 12,
        margin: "0 -16px 22px",
        padding: "12px 16px",
        borderBottom: "1px solid var(--color-outline-muted)",
        background: "var(--header-frosted)",
        backdropFilter: "blur(16px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div className="row gap-sm" style={{ minWidth: 0 }}>
        <button
          className="icon-btn"
          onClick={goBack}
          aria-label="Go back"
          style={{ color: "var(--color-mint-active)", flexShrink: 0 }}
        >
          <IconChevronLeft width={27} height={27} />
        </button>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: 24,
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: 0,
              color: "var(--color-mint-active)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-caption"
              style={{ marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="row gap-sm" style={{ flexShrink: 0 }}>
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
