"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconToday,
  IconRoutine,
  IconUser,
} from "./Icons";

const TABS = [
  { href: "/home", label: "Home", Icon: IconToday },
  { href: "/routine", label: "Routine", Icon: IconRoutine },
  { href: "/profile", label: "Profile", Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
      <nav className="glass" aria-label="Primary" style={navStyle}>
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                padding: "6px 8px",
                borderRadius: 999,
                color: active ? "var(--color-mint-active)" : "var(--color-text-secondary)",
                background: "transparent",
                transition: "color .15s ease, background .15s ease, transform .15s ease",
                minWidth: 56,
                position: "relative",
              }}
            >
              <Icon
                width={23}
                height={23}
                style={active ? { filter: "drop-shadow(0 0 8px rgba(115,253,156,0.5))" } : undefined}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 0,
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: -5,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--color-mint-active)",
                    boxShadow: "0 0 8px var(--color-mint-active)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>
  );
}

const navStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "calc(18px + env(safe-area-inset-bottom))",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(504px, calc(100% - 32px))",
  minHeight: 64,
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  zIndex: 100,
  boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
};
