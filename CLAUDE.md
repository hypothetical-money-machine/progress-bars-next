# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Check code with Biome
npm run format    # Format code with Biome
```

### Database Commands (Drizzle)

```bash
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit migrate    # Apply pending migrations
npx drizzle-kit push       # Push schema directly to database (skips migrations)
npx drizzle-kit studio     # Open Drizzle Studio GUI
```

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with React Compiler enabled (`next.config.ts`)
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **TypeScript** with strict mode
- **Drizzle ORM** with better-sqlite3 (local SQLite file: `sqlite.db`)
- **Clerk** for authentication

## Architecture

### Data Flow

Server Actions (`app/actions.ts`) handle all database operations and use `revalidatePath("/")` for cache invalidation. The home page is a Server Component that fetches data directly.

### Database Layer

- `db/schema.ts` - Drizzle table definitions and TypeScript types (`ProgressBar`, `NewProgressBar`)
- `db/index.ts` - Database connection singleton
- `drizzle/` - Generated migration files
- `sqlite.db` is gitignored - run `npx drizzle-kit migrate` on fresh clones

**Note:** `drizzle-kit generate` can produce buggy migrations when adding columns. It may generate INSERT...SELECT statements that reference the new columns in the source table (which don't exist yet). Review generated migrations before committing.

### Component Pattern

- Server Components fetch data and render static UI
- Client Components (marked `"use client"`) handle interactivity using `useTransition` for optimistic updates with Server Actions

Path alias `@/*` maps to project root.
