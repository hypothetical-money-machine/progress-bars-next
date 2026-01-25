# Progress Bars App - Feature Roadmap

A flexible, gamified progress tracking app where users can create bars for anything.

## Phase 1: Core MVP ✅ COMPLETE

- [x] Create, edit, delete progress bars
- [x] Each bar has: title, current value, target value, optional description
- [x] Manual progress updates (increment/decrement, set value)
- [x] Progress percentage display with animated fill
- [x] SQLite database for persistence
- [x] Basic playful UI (colors, satisfying micro-interactions)

### Additional implemented features:
- [x] Unit support with smart currency detection (prefix/suffix positioning)
- [x] Animated progress bars with gradient colors
- [x] Dark mode support
- [x] Responsive design
- [x] Loading states and smooth transitions
- [x] Clerk authentication integration (UI ready)

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

- [ ] Connect progress bars to authenticated users (Clerk auth is integrated but bars are currently global)
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

## Phase 7: Mobile Widgets

- [ ] iOS home screen widgets (small, medium, large sizes)
- [ ] Android home screen widgets
- [ ] Lock screen widgets (iOS 16+)
- [ ] Quick actions (increment from widget without opening app)
- [ ] Customizable widget appearance (choose which bars to show)
- [ ] Glanceable "top 3 bars" widget
- [ ] Single bar focus widget

### Tech Options
- **Native apps**: Swift (iOS) + Kotlin (Android) - best widget experience
- **React Native + Expo**: Good balance, expo-widgets for basic support
- **Capacitor**: Wrap web app, use native plugins for widgets
- **PWA**: Limited widget support, but installable on home screen

---

## Tech Decisions

- **Database**: SQLite (via Drizzle or Prisma) to start, migrate to cloud DB in Phase 4
- **Auth**: NextAuth.js when ready
- **Styling**: Tailwind + custom animations
- **State**: React state to start, consider Zustand if complexity grows
