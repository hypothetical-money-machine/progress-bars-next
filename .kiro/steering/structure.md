# Project Structure

## Root Directory Layout
```
├── app/                    # Next.js App Router pages and components
├── lib/                    # Shared utilities, hooks, and services
├── db/                     # Database schema and configuration
├── drizzle/               # Database migrations and metadata
├── scripts/               # Build and deployment scripts
├── public/                # Static assets
└── .kiro/                 # Kiro-specific configuration and specs
```

## App Directory (`app/`)
- **`page.tsx`**: Main application page
- **`layout.tsx`**: Root layout with global styles
- **`actions.ts`**: Server actions for data operations
- **`components/`**: React components
  - **`CreateBarForm.tsx`**: Form for creating progress bars
  - **`ProgressBar.tsx`**: Main progress bar display component
  - **`ProgressStatistics.tsx`**: Detailed progress metrics display
  - **`__tests__/`**: Component-specific tests

## Library Directory (`lib/`)
- **`types.ts`**: TypeScript type definitions
- **`hooks/`**: Custom React hooks
  - **`useInterval.ts`**: Timer management hook
  - **`useTimeBasedBars.ts`**: Time-based progress bar management
  - **`useTimeBasedProgress.ts`**: Individual progress calculations
  - **`useVisibilityChange.ts`**: Page visibility detection
- **`services/`**: Business logic services
  - **`AutoUpdateSystem.ts`**: Automatic progress update coordination
  - **`DateCalculator.ts`**: Date and duration calculations
  - **`PerformanceController.ts`**: Performance optimization
  - **`TimeBasedManager.ts`**: Time-based progress bar management

## Database (`db/`)
- **`schema.ts`**: Drizzle ORM schema definitions
- **`index.ts`**: Database connection and configuration

## Testing Structure
- **Co-located tests**: `__tests__/` directories alongside source files
- **Test naming**: `.test.ts` for unit tests, `.pbt.test.ts` for property-based tests
- **Setup files**: `vitest.setup.ts` for global test configuration

## Configuration Files
- **`package.json`**: Dependencies and scripts
- **`tsconfig.json`**: TypeScript configuration with path mapping
- **`vitest.config.ts`**: Test runner configuration
- **`biome.json`**: Code quality and formatting rules
- **`drizzle.config.ts`**: Database migration configuration
- **`next.config.ts`**: Next.js build configuration

## Import Conventions
- Use `@/` prefix for absolute imports from project root
- Specific aliases: `@/app`, `@/lib`, `@/db` for main directories
- Prefer named exports over default exports for better tree-shaking

## File Naming Conventions
- **Components**: PascalCase (e.g., `ProgressBar.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useInterval.ts`)
- **Services**: PascalCase (e.g., `DateCalculator.ts`)
- **Types**: camelCase for files, PascalCase for interfaces
- **Tests**: Match source file name with `.test.ts` or `.pbt.test.ts` suffix

## Architecture Patterns
- **Server Components**: Default for data fetching and static content
- **Client Components**: Marked with `"use client"` for interactivity
- **Server Actions**: In `actions.ts` for database operations
- **Custom Hooks**: For reusable stateful logic
- **Service Layer**: For business logic separation from UI components