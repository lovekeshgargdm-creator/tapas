interface LogoProps {
  size?: number;
  withGlow?: boolean;
}

export function Logo({ size = 64, withGlow = false }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: "block",
        filter: withGlow ? "drop-shadow(0 0 18px rgba(115,253,156,0.45))" : undefined,
      }}
    >
      <rect width="100" height="100" rx="22" fill="var(--color-surface-main)" />
      <path d="M28 30H72" stroke="var(--color-mint-active)" strokeWidth="10" strokeLinecap="round" />
      <path d="M50 31V72" stroke="var(--color-mint-active)" strokeWidth="10" strokeLinecap="round" />
      <path
        d="M64 48C64 48 56 57 56 65C56 71 60 75 65 75C70 75 74 71 74 65C74 57 64 48 64 48Z"
        fill="var(--color-mint-active)"
        opacity="0.92"
      />
      <path d="M32 82C43 87 57 87 68 82" stroke="#f4fff8" strokeWidth="5" strokeLinecap="round" opacity="0.78" />
    </svg>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 0,
        background: "linear-gradient(120deg,#ffffff,#73fd9c)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      TAPAS
    </span>
  );
}
