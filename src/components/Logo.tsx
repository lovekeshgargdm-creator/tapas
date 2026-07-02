interface LogoProps {
  size?: number;
  withGlow?: boolean;
}

export function Logo({ size = 64, withGlow = false }: LogoProps) {
  return (
    <img
      src="/icons/icon.svg"
      width={size}
      height={size}
      alt="Tapas"
      style={{
        width: size,
        height: size,
        display: "block",
        objectFit: "contain",
        filter: withGlow ? "drop-shadow(0 0 18px rgba(115,253,156,0.45))" : undefined,
      }}
    />
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
      Tapas
    </span>
  );
}
