# AGENTS.md — Tapas Project Instructions

> This file is automatically read by AI coding assistants (Claude Code, Cursor, GitHub Copilot, Codex, Aider, Windsurf, Gemini, etc.) at the start of every new session. It provides project context and behavioral guidelines.

---

## Project Overview

**Tapas** is a PWA-first health practice tracker that brings **movement, yoga, and breathwork** into one calm place. It treats daily health practices as an interconnected system — not isolated checklists.

- **PRD:** `../Tapas PRD.md` (full product requirements, data schemas, algorithms)
- **Design System:** `../Tapas Design System.md` (colors, typography, effects, components)
- **Memory / Changelog:** `../memory.md` (running log of local iteration changes)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Vanilla CSS + CSS custom properties (Cool Forest design tokens) |
| Animation | Framer Motion (transitions, celebrations) + `requestAnimationFrame` (breathing/yoga timers) |
| State | Zustand + `persist` (localStorage) |
| Auth | Supabase Auth (email/password + Google OAuth) — currently mocked client-side |
| Database | Supabase PostgreSQL — currently using Zustand store as the data layer |
| PWA | Web manifest + service worker, install prompt, iOS meta, wake-lock |
| Fonts | Inter (UI), JetBrains Mono (timers/numbers), Noto Sans Devanagari (Sanskrit) |
| Port | `localhost:4123` |

---

## Project Structure

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

---

## Design System (Quick Reference)

| Aspect | Spec |
|--------|------|
| Theme | Cool Forest (dark-first). Primary bg: `#0b120f`. Accent: `#4ae38d` (mint) + `#2ee5b5` (seafoam) |
| Typography | Inter (UI), JetBrains Mono (timers/numbers), Noto Sans Devanagari (Sanskrit) |
| Effects | Glassmorphism (overlays, nav), Claymorphism (interactive cards) |
| Iconography | Lucide Icons + custom dosha icons |
| Radius | Cards: 16px, Buttons: 12px, Inputs: 10px, Pills: 999px |
| Spacing | 4px base scale (4, 8, 16, 24, 32) |
| Navigation | Bottom tab bar — 5 tabs: Today, Move, Yoga, Breathe, Patterns |
| CSS tokens | All in `src/app/globals.css` |

**Do NOT change the design system tokens without explicit instruction.** Refer to `../Tapas Design System.md` for the full spec.

---

## Critical Rules

### Do NOT Auto-Run the App

- **Do not run `npm run dev` or start the server automatically.** The user will run it manually.
- If you absolutely must start the server to verify something, you MUST kill the running port/server process when you are done.
- Use `npm run build` or `npx tsc --noEmit` for verification instead.

### Do NOT Run Destructive Commands

- Do not run commands that delete data, reset databases, or revert user changes.
- Do not revert user changes without explicit instruction.

### Demo Credentials

When Supabase auth is fully connected, seed this demo account for professor testing:
- Email: `admin@admin.com`
- Password: `admin123`

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase browser auth
- `EXERCISEDB_RAPIDAPI_KEY` / `RAPIDAPI_KEY` — server-only, **do not print this key**
- See `.env.example` for the template, `.env.local` for actual values (gitignored)

### ExerciseDB API

- Exercise catalog uses AscendAPI ExerciseDB. Free no-key endpoint: `https://oss.exercisedb.dev/api/v1/exercises`
- App also supports server-only RapidAPI ExerciseDB key for richer media
- RapidAPI supports filters: `name`, `bodyParts`, `targetMuscles`, `equipments`, and cursor pagination with `after`

---

## Coding Guidelines

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

### 5. Tapas-Specific Conventions

- Use CSS custom properties from `globals.css` — never hardcode colors/spacing.
- All buttons use Tapas mint theme (`--color-action-primary`), not default blue.
- Match the existing component patterns in `src/components/`.
- Zustand store (`src/lib/store.ts`) is the single data seam — all data reads/writes go through it.
- Scoring formulas live in `src/lib/scoring.ts` and follow PRD §6.5.

---

## Build & Verify

```bash
# Type check (no build)
npx tsc --noEmit

# Full production build
npm run build

# Dev server (user runs this, not you)
npm run dev    # → http://localhost:4123
```

If green screen / stale Next chunks happen: stop dev server → `npm run dev` → hard refresh (`Cmd + Shift + R`).

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
