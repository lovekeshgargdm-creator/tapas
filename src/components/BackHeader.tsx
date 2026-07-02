"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "./Icons";

export function BackHeader({
  title,
  subtitle,
  fallback = "/home",
  right,
}: {
  title: string;
  subtitle?: string;
  fallback?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();

  const goBack = () => {
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
        borderBottom: "1px solid rgba(61,74,62,0.55)",
        background: "rgba(14,21,15,0.78)",
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
      {right}
    </header>
  );
}
