"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackHeader } from "@/components/BackHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import {
  IconActivity,
  IconArrowRight,
  IconEdit,
  IconFileText,
  IconInstall,
  IconRuler,
  IconRoutine,
  IconUser,
} from "@/components/Icons";

const PROFILE_LINKS = [
  { href: "/profile/personal", label: "Profile & Account", Icon: IconUser },
  { href: "/profile/measurements", label: "Measurements", Icon: IconRuler },
];

const ACTIVITY_LINKS = [
  { href: "/profile/routines", label: "Routines", Icon: IconRoutine },
  { href: "/profile/activity", label: "Account Activity", Icon: IconActivity },
];

export default function ProfilePage() {
  const mounted = useMounted();
  const router = useRouter();
  const s = useStore();

  if (!mounted) return <div className="page" />;

  const today = new Date();

  const exportData = () => {
    const data = {
      profile: s.profile,
      workouts: s.workouts,
      yoga: s.yoga,
      breath: s.breath,
      body: s.body,
      streaks: s.streaks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tapas-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = () => {
    s.logout();
    router.replace("/login");
  };

  return (
    <div className="page">
      <BackHeader
        title="Profile"
        fallback="/home"
        right={
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Today</div>
            <div className="text-caption">
              {today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        }
      />

      <section
        className="card"
        style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30, padding: 16 }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            border: "1px solid rgba(115,253,156,0.28)",
            background: "var(--color-surface-main)",
            flexShrink: 0,
          }}
        >
          <Logo size={54} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0 }}>
            {s.profile.name || "Name"}
          </h2>
          <p className="text-caption" style={{ marginTop: 2, overflow: "hidden", textOverflow: "ellipsis" }}>
            {s.profile.email || "Profile"}
          </p>
        </div>
        <Link
          href="/profile/personal"
          className="icon-btn"
          aria-label="Edit name and email"
          title="Edit name and email"
          style={{ width: 38, height: 38, flexShrink: 0 }}
        >
          <IconEdit width={17} height={17} />
        </Link>
      </section>
      <div style={{ marginBottom: 30 }}>
        <InstallAppCard />
      </div>

      <ProfileGroup title="Profile" items={PROFILE_LINKS} />
      <ProfileGroup title="Activity" items={ACTIVITY_LINKS} />

      <section style={{ marginTop: 30, marginBottom: 28 }}>
        <h2 className="uppercase-label" style={{ marginBottom: 12 }}>
          Data & Support
        </h2>
        <div style={{ borderTop: "1px solid var(--color-outline-muted)" }}>
          <ActionRow label="Export Data" Icon={IconInstall} onClick={exportData} />
          <DataLink href="/profile/support" label="Help & Support" Icon={IconFileText} />
        </div>
      </section>

      <footer
        className="stack"
        style={{
          alignItems: "center",
          gap: 16,
          padding: "8px 0 96px",
          borderTop: "1px solid rgba(61,74,62,0.45)",
        }}
      >
        <button className="btn btn-secondary" style={{ width: "min(220px, 100%)" }} onClick={logout}>
          Sign out
        </button>
        <div style={{ textAlign: "center" }}>
          <p className="uppercase-label" style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>
            TAPAS
          </p>
          <p className="text-caption">© 2026 All rights reserved</p>
          <div className="row center gap-sm" style={{ marginTop: 12, color: "var(--color-text-muted)" }}>
            <Link className="text-caption" href="/profile/privacy">
              Privacy Policy
            </Link>
            <span className="text-caption">|</span>
            <Link className="text-caption" href="/profile/terms">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProfileGroup({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; Icon: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }> }[];
}) {
  return (
    <section style={{ marginBottom: 30 }}>
      <h2 className="uppercase-label" style={{ marginBottom: 12 }}>
        {title}
      </h2>
      <div className="stack gap-sm">
        {items.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="card card-interactive"
            style={{
              minHeight: 58,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <span className="row gap-sm" style={{ fontSize: 14, fontWeight: 600 }}>
              <Icon width={22} height={22} style={{ color: "var(--color-text-secondary)" }} />
              {label}
            </span>
            <IconArrowRight width={18} height={18} style={{ color: "var(--color-text-muted)" }} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function DataLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }>;
}) {
  return (
    <Link
      href={href}
      className="row between"
      style={{
        minHeight: 54,
        borderBottom: "1px solid var(--color-outline-muted)",
        color: "var(--color-text-secondary)",
      }}
    >
      <span className="row gap-sm" style={{ fontWeight: 600 }}>
        <Icon width={18} height={18} />
        {label}
      </span>
      <IconArrowRight width={17} height={17} />
    </Link>
  );
}

function ActionRow({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }>;
  onClick: () => void;
}) {
  return (
    <button
      className="row between"
      style={{
        width: "100%",
        minHeight: 54,
        border: "none",
        borderBottom: "1px solid var(--color-outline-muted)",
        background: "transparent",
        color: "var(--color-text-secondary)",
        textAlign: "left",
      }}
      onClick={onClick}
    >
      <span className="row gap-sm" style={{ fontWeight: 600 }}>
        <Icon width={18} height={18} />
        {label}
      </span>
      <IconArrowRight width={17} height={17} />
    </button>
  );
}
