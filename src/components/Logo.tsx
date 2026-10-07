interface LogoProps {
  size?: number;
  withGlow?: boolean;
}

export function Logo({ size = 64, withGlow = false }: LogoProps) {
  return (
    <div
      suppressHydrationWarning
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "22%",
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: withGlow ? "0 0 18px rgba(115,253,156,0.45)" : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/tapas-logo.png"
        alt="TAPAS Logo"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 0,
        background: "linear-gradient(120deg, var(--color-text-primary), var(--color-mint-active))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      TAPAS
    </span>
  );
}
