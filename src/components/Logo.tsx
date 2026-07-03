import Image from "next/image";

interface LogoProps {
  size?: number;
  withGlow?: boolean;
}

export function Logo({ size = 64, withGlow = false }: LogoProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "22%",
        overflow: "hidden",
        filter: withGlow ? "drop-shadow(0 0 18px rgba(115,253,156,0.45))" : undefined,
      }}
    >
      <Image
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
