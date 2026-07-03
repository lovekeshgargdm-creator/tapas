"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { InstallAppCard } from "@/components/InstallAppCard";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { resetInstallCardsForNextLogin } from "@/lib/install";
import {
  IconActivity,
  IconArrowRight,
  IconEdit,
  IconFileText,
  IconInstall,
  IconRuler,
} from "@/components/Icons";

const PROFILE_LINKS = [
  { href: "/profile/personal", label: "Personal Details", Icon: IconEdit },
  { href: "/profile/measurements", label: "Measurements", Icon: IconRuler },
  { href: "/profile/activity", label: "Account Activity", Icon: IconActivity },
];

export default function ProfilePage() {
  const mounted = useMounted();
  const router = useRouter();
  const s = useStore();

  if (!mounted) return <div className="page" />;

  const today = new Date();



  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    resetInstallCardsForNextLogin();
    s.logout();
    router.replace("/login");
  };

  return (
    <div className="page">
      <AppHeader
        title="Profile"
        subtitle="Manage your account"
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
      </section>
      <ProfileGroup items={PROFILE_LINKS} />

      <section style={{ marginTop: 30, marginBottom: 28 }}>
        <h2 className="uppercase-label" style={{ marginBottom: 12 }}>
          Data & Support
        </h2>
        <div style={{ borderTop: "1px solid var(--color-outline-muted)" }}>
          <DataLink href="/profile/export" label="Export Data" Icon={IconInstall} />
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
        <div style={{ width: "100%" }}>
          <InstallAppCard placement={`profile:${s.profile.email || "guest"}`} />
        </div>
        <button className="btn btn-secondary" style={{ width: "min(220px, 100%)" }} onClick={logout}>
          Sign out
        </button>
        <div style={{ textAlign: "center" }}>
          <p className="uppercase-label" style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>
            TAPAS
          </p>
          <p className="text-caption">© 2026 TAPAS. All rights reserved</p>
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
  items,
}: {
  items: { href: string; label: string; Icon: React.FC<{ width?: number; height?: number; style?: React.CSSProperties }> }[];
}) {
  return (
    <section style={{ marginBottom: 30 }}>
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
