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

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with React Compiler enabled (`next.config.ts`)
- **Tailwind CSS 4** via `@tailwindcss/postcss`
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **TypeScript** with strict mode

## Architecture

Uses Next.js App Router structure:
- `app/layout.tsx` - Root layout with Geist font configuration
- `app/page.tsx` - Home page component
- `app/globals.css` - Global styles with Tailwind v4 `@import "tailwindcss"` syntax and CSS custom properties for theming

Path alias `@/*` maps to project root.
