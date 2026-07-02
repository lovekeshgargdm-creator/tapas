import type { SVGProps } from "react";

/**
 * Consistent line-art figures for asanas. Drawn androgynous, no facial features,
 * 2px stroke via currentColor — matching the Asana SVG spec in the PRD.
 * Mapped by asana id (falls back by category).
 */

const wrap = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 120 160",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

const head = (cx: number, cy: number, r = 8) => <circle cx={cx} cy={cy} r={r} />;

const figures: Record<string, React.ReactNode> = {
  standing: (
    <>
      {head(60, 26)}
      <path d="M60 34v46" />
      <path d="M60 44 38 60M60 44l22 16" />
      <path d="M60 80 46 132M60 80l14 52" />
    </>
  ),
  warrior: (
    <>
      {head(60, 24)}
      <path d="M60 32v34" />
      <path d="M30 50h60" />
      <path d="M60 66 34 132M60 66l30 20v46" />
    </>
  ),
  tree: (
    <>
      {head(60, 22)}
      <path d="M60 30v52" />
      <path d="M60 40c-12-10-18-6-18-6M60 40c12-10 18-6 18-6" />
      <path d="M60 82 58 132" />
      <path d="M60 70c-14 2-18 16-18 16" />
    </>
  ),
  forward_fold: (
    <>
      {head(60, 60)}
      <path d="M60 68q6 20 4 30" />
      <path d="M62 98 60 138M62 98q10-2 14-6" />
      <path d="M56 74 42 66M56 74l14-6" />
    </>
  ),
  seated: (
    <>
      {head(60, 34)}
      <path d="M60 42v34" />
      <path d="M60 52 40 66M60 52l20 14" />
      <path d="M60 76q-24 6-30 22h60q-6-16-30-22z" />
    </>
  ),
  prone: (
    <>
      {head(34, 62)}
      <path d="M42 66q22-4 52 2" />
      <path d="M40 74 30 92M40 74q4 12 0 20" />
      <path d="M94 68 108 60M94 68l6 22 8 18" />
    </>
  ),
  supine: (
    <>
      {head(24, 74)}
      <path d="M32 78h64" />
      <path d="M96 78 84 60M96 78l14 6" />
      <path d="M96 78 108 96" />
    </>
  ),
  backbend: (
    <>
      {head(60, 34)}
      <path d="M44 96q4-40 32-46" />
      <path d="M44 96 30 120M44 96l30 8 22 20" />
    </>
  ),
  inversion: (
    <>
      {head(60, 128)}
      <path d="M60 120V60" />
      <path d="M60 96 40 112M60 96l20 16" />
      <path d="M60 60 50 20M60 60l10 40" />
    </>
  ),
  twist: (
    <>
      {head(60, 32)}
      <path d="M60 40v30" />
      <path d="M60 50q-22 6-24-6M60 50q20 8 26-4" />
      <path d="M60 70q-22 4-28 22h56q-6-18-28-22z" />
    </>
  ),
  balance: (
    <>
      {head(52, 30)}
      <path d="M52 38q6 24 2 40" />
      <path d="M54 78 66 120M54 78q-16-4-22-14" />
      <path d="M52 48 34 40M52 48q18-2 30-14" />
    </>
  ),
};

const byId: Record<string, keyof typeof figures> = {
  tadasana: "standing",
  utkatasana: "warrior",
  "virabhadrasana-2": "warrior",
  trikonasana: "warrior",
  vrksasana: "tree",
  natarajasana: "balance",
  uttanasana: "forward_fold",
  paschimottanasana: "seated",
  "adho-mukha": "inversion",
  sarvangasana: "inversion",
  bhujangasana: "prone",
  balasana: "forward_fold",
  savasana: "supine",
  "supta-baddha": "supine",
  "setu-bandha": "backbend",
  ustrasana: "backbend",
  sukhasana: "seated",
  "ardha-matsyendrasana": "twist",
};

export function PoseArt({
  asanaId,
  category,
  size = 96,
  ...rest
}: {
  asanaId?: string;
  category?: string;
  size?: number;
} & SVGProps<SVGSVGElement>) {
  const key =
    (asanaId && byId[asanaId]) ||
    (category && (category in figures ? (category as keyof typeof figures) : "standing")) ||
    "standing";
  return (
    <svg width={size} height={(size * 160) / 120} {...wrap(rest)}>
      {figures[key]}
    </svg>
  );
}
