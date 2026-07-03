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
          top: 0, left: 0, right: 0, height: "70vh",
          background:
            `radial-gradient(circle at 50% 0%, ${dim ? "var(--ambient-top-dim)" : "var(--ambient-top)"} 0%, var(--ambient-clear) 70%)`,
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
