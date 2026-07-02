# Tapas — Health & Practice Tracker

Built in the **AEROLINK** workspace, per `Tapas PRD.md` and `Tapas Design System.md`.

One calm place to track **movement, yoga, and breathwork** — a PWA-first health
practice tracker that treats daily practices as an interconnected system.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Vanilla CSS + CSS custom properties (Cool Forest design tokens) |
| Animation | Framer Motion (transitions, celebrations) + `requestAnimationFrame` (breathing/yoga timers) |
| State | Zustand + `persist` (localStorage) |
| PWA | Web manifest + service worker (offline app shell), install prompt, iOS meta, wake-lock |
| Fonts | Inter (UI), JetBrains Mono (timers/numbers), Noto Sans Devanagari (Sanskrit) |

> **Backend note:** The PRD specifies Supabase (Auth + Postgres + RLS). This build ships a
> fully working **client-first** data layer (`src/lib/store.ts`) with seed data so it runs with
> zero credentials. The store is the single seam — swap its actions for Supabase queries to go
> server-backed without touching the UI. Auth is mocked (any credentials, Google, or a live
> demo account seed).

## Run

```bash
npm install
npm run dev      # http://localhost:4123
npm run build    # production build (all routes prerender)
```

## What's implemented

- **Startup / Splash** — animated brand mark, ambient forest orbs, auto-routing
- **Login** — email + password, Google, or a one-tap live demo account (seeds ~2 weeks of history)
- **Onboarding** — 8-question dosha quiz → constitution result → goals → "quick win" breath
- **Today** — animated Pulse ring, recovery status, tactile quick actions, streaks + sparklines, active-program card
- **Move** — exercise library (search + muscle filters), quick-start templates, **active workout logger** with progressive-overload hints, PR-ready volume tracking
- **Yoga** — asana library with line-art poses & Sanskrit names, Ayurvedic flows, **immersive yoga timer** (auto-advance, transitions, breath cues), Surya Namaskar counter
- **Breathe** — 8 pranayama techniques, **immersive breathing visualizer** (expand/contract circle, phase cues, sound + haptics, wake-lock), pre/post mood check-in
- **Body** — daily check-in (sleep/energy/soreness/water), live recovery score, weight trend
- **Patterns** — composite Pulse, four sub-scores, 14-day consistency heatmap, cross-module pattern cards (free + Pro-gated), weekly auto-summary
- **Programs** — free & Pro multi-week plans, enrollment, day-by-day progress
- **Settings** — profile, dosha, Pro upgrade, sound/haptic prefs, JSON data export, sign out

## Design system

Cool Forest (dark-first). Tokens live in `src/app/globals.css`, mirroring the design doc:
- Surfaces `#0b120f → #283c33`, accents mint `#4ae38d` + seafoam `#2ee5b5`
- Glassmorphism (nav, sheets) + claymorphism (interactive cards)
- Radii 16/12/10 · 4px spacing scale · WCAG-AA contrast · `prefers-reduced-motion` support

## Structure

```
src/
├── app/
│   ├── page.tsx                 # splash
│   ├── login/ · onboarding/
│   ├── (app)/                   # tabbed shell (bottom nav + auth guard)
│   │   ├── today · move · yoga · breathe · patterns · body · programs · settings
│   ├── player/breathe · player/yoga   # full-screen immersive timers
│   └── workout/active                 # full-screen workout logger
├── components/                  # PulseRing, BottomNav, PoseArt, Icons, Ambient, …
└── lib/
    ├── store.ts                 # Zustand + persistence (the Supabase seam)
    ├── scoring.ts               # Pulse / recovery formulas (per PRD §6.5)
    ├── types.ts
    └── seed/                    # exercises, asanas, techniques, flows, programs, dosha quiz
```
