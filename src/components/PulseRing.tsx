"use client";

import { useEffect, useState } from "react";

interface PulseRingProps {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export function PulseRing({
  value,
  size = 240,
  stroke = 12,
  color = "#73fd9c",
  label,
  sublabel = "Pulse Score",
  animate = true,
}: PulseRingProps) {
  const [shown, setShown] = useState(animate ? 0 : value);
  const r = (size - stroke) / 2 - 6;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  useEffect(() => {
    if (!animate) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  const offset = c - (shown / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: "18%",
          borderRadius: "50%",
          background: color,
          opacity: 0.12,
          filter: "blur(38px)",
        }}
      />
      {/* decorative outer ring */}
      <div
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: "50%",
          border: `1px solid ${color}22`,
          animation: "pulseGlow 3.4s ease-in-out infinite",
        }}
      />
      <svg width={size} height={size} style={{ position: "relative", transform: "rotate(-90deg)" }}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
        />
      </svg>
      {/* core */}
      <div
        style={{
          position: "absolute",
          inset: stroke + 18,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 35%, var(--color-surface-high), var(--color-surface-1))",
          display: "grid",
          placeItems: "center",
          boxShadow: "inset 0 2px 12px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            className="text-mono"
            style={{
              fontSize: size * 0.24,
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {label ?? Math.round(shown)}
          </div>
          <div className="uppercase-label" style={{ marginTop: 6 }}>
            {sublabel}
          </div>
        </div>
      </div>
    </div>
  );
}
