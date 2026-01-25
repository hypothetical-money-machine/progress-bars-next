# Technology Stack

## Core Framework
- **Next.js 16** with App Router
- **React 19** with React Compiler enabled
- **TypeScript 5** with strict mode

## Database & ORM
- **SQLite** with better-sqlite3
- **Drizzle ORM** for type-safe database operations
- **Drizzle Kit** for migrations

## Styling & UI
- **Tailwind CSS 4** for styling
- **PostCSS** for CSS processing
- Dark mode support built-in

## Testing
- **Vitest** as test runner with jsdom environment
- **Testing Library** for React component testing
- **fast-check** for property-based testing
- Coverage reporting with v8 provider

## Code Quality
- **Biome** for linting and formatting (replaces ESLint/Prettier)
- **Husky** for git hooks
- **lint-staged** for pre-commit checks

## Authentication
- **Clerk** for user authentication and management

## Development Tools
- **date-fns** for date manipulation
- **TypeScript path mapping** with `@/*` aliases

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run Biome linter
npm run format       # Format code with Biome
```

### Testing
```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open Vitest UI
npm run test:coverage # Run tests with coverage
```

### Database
```bash
npx drizzle-kit generate  # Generate migrations
npx drizzle-kit migrate   # Run migrations
npx drizzle-kit studio    # Open database studio
```

## Build Configuration
- **Target**: ES2017 for broad compatibility
- **Module Resolution**: Bundler mode for optimal tree-shaking
- **JSX**: React JSX transform
- **Incremental compilation** enabled for faster builds