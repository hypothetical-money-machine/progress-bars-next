# Progress Bars App - Feature Roadmap

A flexible, gamified progress tracking app where users can create bars for anything.

## Phase 1: Core MVP

- [ ] Create, edit, delete progress bars
- [ ] Each bar has: title, current value, target value, optional description
- [ ] Manual progress updates (increment/decrement, set value)
- [ ] Progress percentage display with animated fill
- [ ] SQLite database for persistence
- [ ] Basic playful UI (colors, satisfying micro-interactions)

## Phase 2: Gamification Layer

- [ ] XP system - earn XP when updating progress
- [ ] Levels based on total XP
- [ ] Achievements/badges (first bar, first completion, streaks, etc.)
- [ ] Celebratory animations on milestones (confetti, particles)
- [ ] Streak tracking for daily updates
- [ ] Optional sound effects

## Phase 3: Organization

- [ ] Categories/folders for grouping bars
- [ ] Tags with filtering
- [ ] Dashboard with multiple view modes (grid, list, compact)
- [ ] Sorting options (progress %, recently updated, alphabetical)
- [ ] Archive completed bars (keep history, declutter active view)

## Phase 4: Auth & Cloud Sync

- [ ] User accounts (email/password, OAuth)
- [ ] Cloud database migration (Postgres/Turso)
- [ ] Sync across devices
- [ ] Public profile pages (optional)
- [ ] Privacy controls (public/private bars)

## Phase 5: Social Features

- [ ] Share individual bars or profiles
- [ ] Follow other users
- [ ] Activity feed
- [ ] Team/group goals with shared progress
- [ ] Comments/encouragement on others' progress

## Phase 6: API Integrations

- [ ] GitHub (commits, PRs, issues closed)
- [ ] Strava/fitness apps
- [ ] Goodreads/reading
- [ ] Custom webhooks for any data source
- [ ] Zapier/Make integration

---

## Tech Decisions

- **Database**: SQLite (via Drizzle or Prisma) to start, migrate to cloud DB in Phase 4
- **Auth**: NextAuth.js when ready
- **Styling**: Tailwind + custom animations
- **State**: React state to start, consider Zustand if complexity grows
