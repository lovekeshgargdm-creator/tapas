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
            `radial-gradient(75% 42% at 50% 0%, rgba(46,229,181,${dim ? 0.08 : 0.14}) 0%, rgba(14,21,15,0) 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(14,21,15,0) 0%, rgba(14,21,15,0.72) 100%)",
        }}
      />
    </div>
  );
}
