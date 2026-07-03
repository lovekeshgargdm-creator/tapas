"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "./Icons";

type Theme = "dark" | "light";

const THEME_KEY = "tapas-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = theme === "light" ? "#f7faf4" : "#0e150f";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="icon-btn theme-toggle"
      onClick={() => {
        setTheme(nextTheme);
        window.localStorage.setItem(THEME_KEY, nextTheme);
        applyTheme(nextTheme);
      }}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === "dark" ? <IconSun width={22} height={22} /> : <IconMoon width={22} height={22} />}
    </button>
  );
}
