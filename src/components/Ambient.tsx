"use client";

/** Subtle Obsidian Vitality top glow for transactional screens. */
export function Ambient({ dim = false }: { dim?: boolean }) {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0, pointerEvents: "none" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(75% 42% at 50% 0%, ${dim ? "var(--ambient-top-dim)" : "var(--ambient-top)"} 0%, var(--ambient-clear) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, var(--ambient-clear) 0%, var(--ambient-bottom) 100%)",
        }}
      />
    </div>
  );
}
