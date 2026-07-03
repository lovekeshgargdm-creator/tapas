import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

type IconifyName = `lucide:${string}` | `simple-icons:${string}` | `tapas:${string}`;

const base = (props: P, icon: IconifyName) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "data-icon": icon,
  ...props,
});

export const IconToday = (p: P) => (
  <svg {...base(p, "lucide:layout-grid")}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconMove = (p: P) => (
  <svg {...base(p, "lucide:dumbbell")}>
    <path d="m6.5 6.5 11 11" />
    <path d="m21 21-1-1" />
    <path d="m3 3 1 1" />
    <path d="m18 22 4-4" />
    <path d="m2 6 4-4" />
    <path d="m3 10 7-7" />
    <path d="m14 21 7-7" />
  </svg>
);

export const IconYoga = (p: P) => (
  <svg {...base(p, "lucide:person-standing")}>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M12 7v5" />
    <path d="M5 20c1.5-3 4-5 7-5s5.5 2 7 5" />
    <path d="M12 12 5.5 15" />
    <path d="M12 12l6.5 3" />
  </svg>
);

export const IconBreathe = (p: P) => (
  <svg {...base(p, "lucide:wind")}>
    <path d="M2 8h13a3 3 0 1 0-3-3" />
    <path d="M2 12h16a3.5 3.5 0 1 1-3.5 3.5" />
    <path d="M2 16h7a3 3 0 1 1-3 3" />
  </svg>
);

export const IconPatterns = (p: P) => (
  <svg {...base(p, "lucide:chart-no-axes-combined")}>
    <path d="M3 3v18h18" />
    <path d="m7 14 3-4 3 3 4-6" />
  </svg>
);

export const IconBody = (p: P) => (
  <svg {...base(p, "lucide:accessibility")}>
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 7.5v6" />
    <path d="M8 9.5h8" />
    <path d="m9 21 3-7 3 7" />
  </svg>
);

export const IconProgram = (p: P) => (
  <svg {...base(p, "lucide:list")}>
    <path d="M4 4h16v4H4z" />
    <path d="M4 12h10" />
    <path d="M4 16h16" />
    <path d="M4 20h7" />
  </svg>
);

export const IconBell = (p: P) => (
  <svg {...base(p, "lucide:bell")}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const IconFlame = (p: P) => (
  <svg {...base(p, "lucide:flame")}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base(p, "lucide:play")} fill="currentColor" stroke="none">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base(p, "lucide:pause")} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const IconClose = (p: P) => (
  <svg {...base(p, "lucide:x")}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base(p, "lucide:chevron-right")}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const IconChevronLeft = (p: P) => (
  <svg {...base(p, "lucide:chevron-left")}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base(p, "lucide:search")}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base(p, "lucide:plus")}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base(p, "lucide:check")}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconTimer = (p: P) => (
  <svg {...base(p, "lucide:timer")}>
    <path d="M10 2h4" />
    <path d="M12 14v-4" />
    <circle cx="12" cy="14" r="8" />
    <path d="m19 7-1.5-1.5" />
  </svg>
);

export const IconSound = (p: P) => (
  <svg {...base(p, "lucide:volume-2")}>
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 5a9 9 0 0 1 0 14" />
  </svg>
);

export const IconMute = (p: P) => (
  <svg {...base(p, "lucide:volume-x")}>
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <path d="m22 9-6 6" />
    <path d="m16 9 6 6" />
  </svg>
);

export const IconSettings = (p: P) => (
  <svg {...base(p, "lucide:settings")}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconTrend = (p: P) => (
  <svg {...base(p, "lucide:trending-up")}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

export const IconSparkle = (p: P) => (
  <svg {...base(p, "lucide:sparkles")}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4z" />
  </svg>
);

export const IconDrop = (p: P) => (
  <svg {...base(p, "lucide:droplet")}>
    <path d="M12 2.5S5 10 5 14.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z" />
  </svg>
);

export const IconMoon = (p: P) => (
  <svg {...base(p, "lucide:moon")}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const IconSun = (p: P) => (
  <svg {...base(p, "lucide:sun")}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

export const IconBolt = (p: P) => (
  <svg {...base(p, "lucide:zap")}>
    <path d="M13 2 3 14h7l-1 8 10-12h-7z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconGoogle = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" data-icon="simple-icons:google" {...p}>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.44-1.66 4.22-5.5 4.22-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.6 14.68 2.6 12 2.6 6.98 2.6 2.9 6.68 2.9 11.7s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.89 0-.6-.06-1.05-.14-1.5H12z"
    />
    <path fill="#34A853" d="M3.9 7.6l3.2 2.35C7.9 8.1 9.77 6.7 12 6.7c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.6 14.68 2.6 12 2.6 8.3 2.6 5.1 4.72 3.9 7.6z" opacity="0" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base(p, "lucide:arrow-right")}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const IconHeart = (p: P) => (
  <svg {...base(p, "lucide:heart")}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base(p, "lucide:lock")}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const IconSkip = (p: P) => (
  <svg {...base(p, "lucide:skip-forward")} fill="currentColor" stroke="none">
    <path d="M5 5v14l9-7z" />
    <rect x="16" y="5" width="3" height="14" rx="1" />
  </svg>
);

export const IconUser = (p: P) => (
  <svg {...base(p, "lucide:user")}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export const IconTrain = (p: P) => (
  <svg {...base(p, "lucide:dumbbell")}>
    <path d="M6 8h12" />
    <path d="M4 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none" />
    <path d="M20 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none" />
    <path d="M6 12h12" />
    <path d="M4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none" />
    <path d="M20 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconDumbbell = (p: P) => (
  <svg {...base(p, "lucide:dumbbell")}>
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="M3 8.5v7" strokeWidth="3" strokeLinecap="round" />
    <path d="M21 8.5v7" strokeWidth="3" strokeLinecap="round" />
    <path d="M5 6.5v11" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M19 6.5v11" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const IconCalendar = (p: P) => (
  <svg {...base(p, "lucide:calendar-days")}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const IconJournal = (p: P) => (
  <svg {...base(p, "lucide:notebook")}>
    <path d="M4 4h16v16H4z" rx="2" />
    <path d="M4 4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2" />
    <path d="M8 11h8M8 15h5" />
  </svg>
);

export const IconRoutine = (p: P) => (
  <svg {...base(p, "lucide:route")}>
    <path d="M3 12h18M12 3v18" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="20" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="20" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const IconWarmup = (p: P) => (
  <svg {...base(p, "lucide:gauge")}>
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="10" opacity=".2" />
  </svg>
);

export const IconPranayama = (p: P) => (
  <svg {...base(p, "lucide:wind")}>
    <path d="M2 8h13a3 3 0 1 0-3-3" />
    <path d="M2 12h16a3.5 3.5 0 1 1-3.5 3.5" />
    <path d="M2 16h7a3 3 0 1 1-3 3" />
  </svg>
);

export const IconTrash = (p: P) => (
  <svg {...base(p, "lucide:trash-2")}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconInstall = (p: P) => (
  <svg {...base(p, "lucide:download")}>
    <path d="M12 2v14M8 12l4 4 4-4" />
    <path d="M3 18h18v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2z" fill="currentColor" stroke="none" opacity=".2" />
    <path d="M3 18h18" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg {...base(p, "lucide:shield-check")}>
    <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconFileText = (p: P) => (
  <svg {...base(p, "lucide:file-text")}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconSunrise = (p: P) => (
  <svg {...base(p, "lucide:sunrise")}>
    <path d="M12 2v4M4.93 7.93l2.83 2.83M2 16h4M18 16h4M19.07 7.93l-2.83 2.83" />
    <path d="M5 16a7 7 0 0 1 14 0" />
    <path d="M3 21h18" />
    <path d="m9 10 3-3 3 3" />
  </svg>
);

export const IconSunset = (p: P) => (
  <svg {...base(p, "lucide:sunset")}>
    <path d="M12 10v4M4.93 7.93l2.83 2.83M2 16h4M18 16h4M19.07 7.93l-2.83 2.83" />
    <path d="M5 16a7 7 0 0 1 14 0" />
    <path d="M3 21h18" />
    <path d="m9 7 3 3 3-3" />
  </svg>
);

export const IconPoses = (p: P) => (
  <svg {...base(p, "lucide:person-standing")}>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M12 7v5" />
    <path d="M5 20c1.5-3 4-5 7-5s5.5 2 7 5" />
    <path d="M12 12 5.5 15" />
    <path d="M12 12l6.5 3" />
  </svg>
);

export const IconShare = (p: P) => (
  <svg {...base(p, "lucide:share")}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

export const IconEdit = (p: P) => (
  <svg {...base(p, "lucide:square-pen")}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const IconStar = (p: P) => (
  <svg {...base(p, "lucide:star")}>
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2" />
  </svg>
);

export const IconCopy = (p: P) => (
  <svg {...base(p, "lucide:copy")}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

export const IconChartBar = (p: P) => (
  <svg {...base(p, "lucide:chart-column")}>
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);

export const IconActivity = (p: P) => (
  <svg {...base(p, "lucide:activity")}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const IconRuler = (p: P) => (
  <svg {...base(p, "lucide:ruler")}>
    <path d="M22.65 14.39L12 22l-9.65-7.61a2.12 2.12 0 0 1-.22-2.91l6-7.85a2.12 2.12 0 0 1 3.23-.23l8.07 7.7a2.12 2.12 0 0 1 .22 2.91z" />
    <path d="M16 11l-2 2" />
    <path d="M13 14l-2 2" />
    <path d="M10 17l-2 2" />
  </svg>
);
