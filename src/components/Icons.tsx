import { Dna, Wind, History, Ruler } from "lucide-react";
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

export const IconYoga = (p: P) => <Dna {...p} />;

export const IconBreathe = (p: P) => <Wind {...p} />;

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
  <svg width={20} height={20} viewBox="0 0 24 24" {...p}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path fill="none" d="M1 1h22v22H1z" />
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

export const IconFeather = (p: P) => (
  <svg {...base(p, "lucide:feather")}>
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <line x1="16" y1="8" x2="2" y2="22" />
    <line x1="17.5" y1="15" x2="9" y2="6.5" />
  </svg>
);

export const IconBiceps = (p: P) => (
  <svg {...base(p, "lucide:biceps-flexed")}>
    <path d="M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-10 7-1.5 0-2.607-.577-3.414-1.284a1.85 1.85 0 0 1-.225-2.65l5.247-5.91Z" />
    <path d="M15 14v-2.5a2.5 2.5 0 0 0-5 0V14" />
    <path d="M12.409 13.017 6.131 5.925a1.85 1.85 0 0 0-2.65-.225C2.674 6.407 2 7.507 2 9c0 6 3.134 10 7 10" />
    <path d="M9 19c-1.5 0-2.607-.577-3.414-1.284a1.85 1.85 0 0 1-.225-2.65" />
  </svg>
);

export const IconReach = (p: P) => (
  <svg {...base(p, "tapas:reach")}>
    <circle cx="12" cy="4" r="2" />
    <path d="M12 6v7" />
    <path d="M12 13l-4 8" />
    <path d="M12 13l4 8" />
    <path d="M12 7L7 2" />
    <path d="M12 7l5-5" />
  </svg>
);

export const IconLeaf = (p: P) => (
  <svg {...base(p, "lucide:leaf")}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export const IconDumbbell = (p: P) => (
  <svg {...base(p, "lucide:dumbbell")}>
    <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
    <path d="m2.5 21.5 1.4-1.4" />
    <path d="m20.1 3.9 1.4-1.4" />
    <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
    <path d="m9.6 14.4 4.8-4.8" />
  </svg>
);

export const IconMobility = (p: P) => (
  <svg {...base(p, "lucide:move")}>
    <path d="M12 2v20" />
    <path d="m8 18 4 4 4-4" />
    <path d="m8 6 4-4 4 4" />
    <path d="M2 12h20" />
    <path d="m18 8 4 4-4 4" />
    <path d="m6 8-4 4 4 4" />
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
  <svg {...base(p, "lucide:calendar-sync")}>
    <path d="M11 10v4h4" />
    <path d="m11 14 1.535-1.605a5 5 0 0 1 8 1.5" />
    <path d="M16 2v4" />
    <path d="m21 18-1.535 1.605a5 5 0 0 1-8-1.5" />
    <path d="M21 22v-4h-4" />
    <path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" />
    <path d="M3 10h4" />
    <path d="M8 2v4" />
  </svg>
);

export const IconWarmup = (p: P) => (
  <svg {...base(p, "lucide:gauge")}>
    <path d="M12 2a10 10 0 0 1 10 10" />
    <path d="M12 6v6l4 2" />
    <circle cx="12" cy="12" r="10" opacity=".2" />
  </svg>
);

export const IconPranayama = (p: P) => <Wind {...p} />;

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

export const IconRuler = (p: P) => <Ruler {...p} />;

export const IconCircleCheckBig = (p: P) => (
  <svg {...base(p, "lucide:circle-check-big")}>
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base(p, "lucide:eye")}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconEyeOff = (p: P) => (
  <svg {...base(p, "lucide:eye-off")}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const IconHistory = (p: P) => <History {...p} />;
