# Implementation Plan: Time-Based Progress Bars

## Overview

This implementation plan converts the time-based progress bars design into discrete coding tasks that build incrementally on the existing Next.js progress tracking app. The tasks extend the current SQLite database schema, create time-based calculation logic, integrate with existing UI components, and implement automatic update mechanisms while maintaining backward compatibility with manual progress bars.

## Key Technical Decisions

### Testing Strategy
**CRITICAL**: All property-based tests must follow the constraints in [testing-guide.md](./testing-guide.md) to prevent non-deterministic failures and infinite durations. The guide provides templates, constraints, and examples for all property tests.

### Timezone Strategy
- **Storage**: All dates stored as UTC ISO 8601 strings in the database
- **Calculations**: Use `@date-fns/utc` with `UTCDateMini` for all date math to ensure consistency
- **Display**: Convert to user's local timezone only at render time using `date-fns-tz`
- **Rationale**: Prevents server/client mismatches and timezone-related bugs

### Hydration Strategy
- Time-based progress values are **client-only** to avoid hydration mismatches
- Server renders a placeholder (e.g., loading skeleton or last-known value)
- Client calculates actual progress in `useEffect` after hydration
- Use `suppressHydrationWarning` sparingly as escape hatch for minor time display differences

### Auto-Update Architecture (Simplified)
- Use Dan Abramov's declarative `useInterval` hook pattern instead of complex service classes
- No PerformanceController or CalculationCache for MVP - date-fns calculations are trivial (~0.01ms)
- Add optimization layer only if profiling shows actual performance issues
- Tab visibility handling via simple `useEffect` with `visibilitychange` listener

### Testing Strategy
- Property-based tests are **recommended but not blocking** for MVP
- Unit tests with specific examples are required
- Use Vitest's `vi.useFakeTimers()` for timer testing (not Jest)
- Use `renderHook` from `@testing-library/react` v13+ (not the deprecated standalone package)

## Current State Analysis

The existing codebase has:
- ✅ Basic manual progress bar functionality with increment/decrement
- ✅ SQLite database with Drizzle ORM (schema: id, title, description, currentValue, targetValue, unit, unitPosition, timestamps)
- ✅ React components: ProgressBar (display) and CreateBarForm (creation)
- ✅ Server actions: getProgressBars, createProgressBar, updateProgress, deleteProgressBar
- ✅ Testing infrastructure (Vitest + fast-check + @testing-library/react)
- ✅ date-fns installed
- ✅ Time-based fields in schema (migration applied - 0002_wild_scourge.sql)
- ✅ DateCalculator service (fully implemented with comprehensive tests)
- ✅ TimeBasedManager service (fully implemented with comprehensive tests)
- ✅ TypeScript data models (lib/types.ts complete)
- ✅ useInterval and useVisibilityChange hooks (implemented with tests)
- ❌ No useTimeBasedProgress hook (file exists but empty)
- ❌ No UI integration for time-based bars

## Tasks

- [x] 1. Create database migration for time-based fields
  - Create Drizzle migration to extend progress_bars table with new columns
  - Add barType (text, default 'manual'), startDate (text/ISO 8601), targetDate (text/ISO 8601)
  - Add timeBasedType (text, nullable), isCompleted (boolean, default false), isOverdue (boolean, default false)
  - Add database indexes: idx_progress_bars_type and idx_progress_bars_dates
  - Run migration and verify schema changes in sqlite.db
  - _Requirements: 8.1, 8.5_

- [x] 2. Update TypeScript data models
  - Extend db/schema.ts ProgressBar type with time-based fields (barType, startDate, targetDate, timeBasedType, isCompleted, isOverdue)
  - Create lib/types.ts with TimeBasedProgressBar, Duration, ProgressStatistics, ProgressCalculation interfaces
  - Add TimeBasedBarConfig type for form inputs
  - Add validation types: ValidationResult and ValidationError
  - _Requirements: 8.2_

- [x] 3. Install and configure testing infrastructure
  - Install fast-check for property-based testing
  - Install @testing-library/react and @testing-library/jest-dom for React component testing
  - Install vitest as test runner
  - Create vitest.config.ts with proper configuration
  - Add test scripts to package.json
  - _Requirements: All (testing foundation)_

- [x] 4. Implement date calculation service
  - [x] 4.1 Create DateCalculator service with date-fns integration
    - Install date-fns library (npm install date-fns) ✅ Already done
    - Create lib/services/DateCalculator.ts with DateCalculator class
    - Implement calculateProgress(bar, currentDate): calculates elapsed/remaining time, percentage, completion status
    - Implement getDurationInDays(startDate, endDate): returns total days between dates
    - Implement formatDuration(duration): formats Duration object to human-readable string with appropriate units
    - _Requirements: 1.4, 1.5, 2.3, 5.2_
  
  - [x] 4.2 Write property test for date calculations
    - Create lib/services/__tests__/DateCalculator.pbt.test.ts
    - **Property 3: Time calculation accuracy**
    - **Validates: Requirements 1.4, 1.5, 2.3, 3.3, 4.2, 4.3**
    - **CRITICAL**: Follow constraints in [testing-guide.md](./testing-guide.md) to prevent non-deterministic failures
    - Use Template 1 from testing guide for date calculation accuracy
    - Test that elapsed + remaining = total duration for all valid date pairs
    - Test that percentage = (elapsed / total) * 100 for all valid inputs
    - Allow 1 day tolerance for rounding and timezone differences
  
  - [x] 4.3 Add date validation functions to DateCalculator
    - Implement validateDateRange(startDate, targetDate): ensures target is after start
    - Implement validateHistoricalDate(date, maxYearsInPast): ensures date is not more than 10 years in past
    - Implement validateFutureDate(date): ensures date is in the future
    - Return ValidationResult with clear error messages for each validation failure
    - _Requirements: 1.3, 4.1, 4.4_
  
  - [x] 4.4 Write property test for date validation
    - Create validation property tests in DateCalculator.pbt.test.ts
    - **Property 1: Date validation**
    - **Validates: Requirements 1.2, 2.1, 4.1, 4.4**
    - **Property 2: Date range validation**
    - **Validates: Requirements 1.3, 3.2**
    - **CRITICAL**: Follow constraints in [testing-guide.md](./testing-guide.md) to prevent infinite loops
    - Use Template 2 from testing guide for date validation
    - Test that validation correctly accepts/rejects dates based on rules
    - Test that error messages are present for all invalid cases

- [x] 5. Create time-based progress bar manager
  - [x] 5.1 Implement TimeBasedManager service
    - Create lib/services/TimeBasedManager.ts with TimeBasedManager class
    - Implement createTimeBasedBar(config): validates dates and creates time-based bar
    - Implement calculateCurrentProgress(bar): uses DateCalculator to compute current progress
    - Implement updateCompletionStatus(bar): marks bars as completed/overdue based on dates
    - Implement getAllTimeBasedBars(): retrieves only time-based bars from database
    - _Requirements: 2.5, 3.4, 3.5_
  
  - [x]* 5.2 Write property test for completion status
    - Create lib/services/__tests__/TimeBasedManager.pbt.test.ts
    - **Property 4: Completion and overdue status**
    - **Validates: Requirements 2.5, 3.4, 3.5, 6.3**
    - **CRITICAL**: Follow constraints in [testing-guide.md](./testing-guide.md) for deterministic results
    - Use Template 3 from testing guide for completion status
    - Test that bars are marked completed when current date >= target date
    - Test that arrival-date bars are marked overdue when current date > arrival date
  
  - [x] 5.3 Add large time scale support
    - Enhance DateCalculator to handle durations up to 50 years
    - Add leap year handling using date-fns functions
    - Test precision with multi-year date ranges
    - _Requirements: 5.1, 5.3, 5.5_
  
  - [x]* 5.4 Write property test for large time scales
    - Add large time scale tests to DateCalculator.pbt.test.ts
    - **Property 6: Large time scale support**
    - **Validates: Requirements 5.1, 5.3, 5.5**
    - **CRITICAL**: Follow constraints in [testing-guide.md](./testing-guide.md) to prevent extreme durations
    - Use duration-based generation (1-50 years) with fixed reference dates
    - Test calculations with date ranges spanning 1-50 years
    - Test leap year handling across multiple leap years
    - Test precision maintenance for multi-year durations

- [x] 6. Implement auto-update hooks (simplified approach)
  - [x] 6.1 Create useInterval hook
    - Create lib/hooks/useInterval.ts using Dan Abramov's declarative pattern
    - Hook accepts callback and delay (null to pause)
    - Use useRef to store callback to avoid stale closures
    - Properly cleanup interval on unmount or delay change
    - Reference: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
    - _Requirements: 6.1, 6.5_

  - [x] 6.2 Create useVisibilityChange hook
    - Create lib/hooks/useVisibilityChange.ts
    - Hook returns { isVisible } and triggers callback on visibility change
    - Use document.visibilityState API
    - Cleanup listener on unmount
    - _Requirements: 6.5_

  - [x] 6.3 Write unit tests for utility hooks
    - Create lib/hooks/__tests__/useInterval.test.ts
    - Use Vitest fake timers: `vi.useFakeTimers()` in beforeEach, `vi.useRealTimers()` in afterEach
    - Test that callback is called at specified interval using `vi.advanceTimersByTime()`
    - Test that passing null delay pauses the interval
    - Test cleanup on unmount
    - _Requirements: 6.1, 6.5_

- [x] 7. Create React hooks for time-based progress
  - [x] 7.1 Implement useTimeBasedProgress hook
    - Create lib/hooks/useTimeBasedProgress.ts
    - Hook accepts bar (TimeBasedProgressBar) and returns { progress, isStale }
    - Use useInterval hook with 60000ms delay for auto-updates
    - Use useVisibilityChange to pause updates when tab is hidden
    - Calculate progress client-side only (avoid hydration mismatch)
    - Return isStale=true initially until first client calculation
    - _Requirements: 6.1, 6.5_

  - [x] 7.2 Implement useTimeBasedBars hook
    - Create lib/hooks/useTimeBasedBars.ts
    - Hook accepts bars array and returns { progressMap, isHydrated }
    - Batch calculate all progress values in single interval callback
    - Use Map<string, ProgressCalculation> for O(1) lookups
    - Set isHydrated=true after first client-side calculation
    - _Requirements: 6.4_

  - [x] 7.3 Write unit tests for progress hooks
    - Create lib/hooks/__tests__/useTimeBasedProgress.test.ts
    - Create lib/hooks/__tests__/useTimeBasedBars.test.ts
    - Use `renderHook` from `@testing-library/react` (NOT the deprecated standalone package)
    - Use Vitest fake timers with `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
    - Test initial state before hydration (isStale=true / isHydrated=false)
    - Test progress calculation after mount
    - Test interval updates using `vi.advanceTimersByTime(60000)`
    - Test cleanup: verify no intervals running after unmount
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 8. Extend UI components for time-based bars
  - [x] 8.1 Update progress bar creation form
    - Modify app/components/CreateBarForm.tsx to add bar type selection
    - Add radio buttons: "Manual Progress" vs "Time-Based Progress"
    - Add time-based type selector: count-up, count-down, arrival-date
    - Add date picker inputs for startDate and targetDate (use HTML5 date input)
    - Implement conditional rendering: show date fields only for time-based type
    - Add client-side validation for date inputs with error messages
    - Update form submission to handle both manual and time-based bars
    - _Requirements: 9.1, 1.1, 2.1, 3.1_
  
  - [x] 8.2 Enhance progress bar display components
    - Modify app/components/ProgressBar.tsx to handle time-based bars
    - Add visual badge/indicator to distinguish time-based from manual bars
    - Conditionally render increment/decrement buttons only for manual bars
    - Display time-based statistics: elapsed time, remaining time, percentage
    - Show "Started: [date]" for historical start dates
    - Integrate useTimeBasedProgress hook for auto-updating time-based bars
    - Maintain existing animated progress bar for both types
    - _Requirements: 9.2, 9.4, 7.1, 7.2, 7.3_
  
  - [x] 8.3 Write property test for UI integration
    - Create app/components/__tests__/ProgressBar.pbt.test.tsx
    - **Property 10: UI component integration**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5**
    - Test that time-based bars display correctly with various date ranges
    - Test that manual bars still function correctly (backward compatibility)
  
  - [x] 8.4 Add progress statistics display
    - Create app/components/ProgressStatistics.tsx component
    - Display elapsed time in human-readable format (e.g., "2 years, 3 months, 5 days")
    - Display remaining time with same formatting
    - Show completion percentage with visual indicator
    - Display daily progress rate (e.g., "0.27% per day")
    - Show estimated completion date for count-up bars
    - Use formatDuration from DateCalculator for consistent formatting
    - _Requirements: 7.4, 7.5, 9.5_
  
  - [x] 8.5 Write property test for progress statistics
    - Create app/components/__tests__/ProgressStatistics.pbt.test.tsx
    - **Property 8: Progress statistics accuracy**
    - **Validates: Requirements 7.3, 7.4, 7.5**
    - Test that displayed statistics match calculated values
    - Test formatting consistency across different time scales

- [ ] 9. Update database operations and server actions
  - [ ] 9.1 Extend existing database queries in app/actions.ts
    - Update createProgressBar to handle both manual and time-based bars
    - Add logic to detect bar type from form data (presence of dates)
    - Store startDate, targetDate, timeBasedType, barType in database
    - Ensure backward compatibility: existing manual bars continue to work
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 9.2 Add time-based specific server actions
    - Create getTimeBasedBars(): retrieves only time-based bars
    - Create updateCompletionStatus(id, isCompleted, isOverdue): updates completion flags
    - Create getBarsByType(type): retrieves bars filtered by timeBasedType
    - Add error handling for invalid date formats
    - _Requirements: 2.5, 3.5_
  
  - [ ]* 9.3 Write property test for database integration
    - Create app/__tests__/actions.pbt.test.ts
    - **Property 9: Database integration compatibility**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
    - Test that manual bars are unaffected by schema changes
    - Test that time-based bars store and retrieve dates correctly
    - Test that queries correctly distinguish between bar types

- [ ] 10. Implement edit functionality for time-based bars
  - [ ] 10.1 Create edit form for time-based bars
    - Add edit mode to CreateBarForm or create separate EditBarForm component
    - Allow modification of dates (startDate, targetDate) for time-based bars
    - Allow modification of timeBasedType (count-up, count-down, arrival-date)
    - Add validation for date changes (same rules as creation)
    - Support conversion between manual and time-based types
    - Update app/actions.ts with updateProgressBar server action
    - _Requirements: 9.3_
  
  - [ ] 10.2 Add time-based bar deletion with cleanup
    - Modify deleteProgressBar in app/actions.ts to handle time-based bars
    - Ensure proper cleanup of any cached calculations
    - Test that timers are properly cleaned up
    - _Requirements: 10.5_
  
  - [ ]* 10.3 Write unit tests for edit functionality
    - Create app/__tests__/edit-functionality.test.ts
    - Test date modification and validation
    - Test type conversion scenarios (manual ↔ time-based)
    - Test cleanup behavior on deletion
    - _Requirements: 9.3, 10.5_

- [ ] 11. Integration and final wiring
  - [ ] 11.1 Wire all components together
    - Update app/page.tsx to use useTimeBasedBars hook
    - Connect TimeBasedManager to server actions
    - Ensure ProgressBar component handles both manual and time-based bars seamlessly
    - Add error boundaries for graceful error handling
    - _Requirements: All requirements_
  
  - [ ] 11.2 Add comprehensive error handling
    - Implement date validation error messages in CreateBarForm
    - Add calculation error recovery in DateCalculator (handle invalid dates gracefully)
    - Handle auto-update system failures (timer errors, calculation errors)
    - Add user-friendly error messages for all error scenarios
    - Log errors to console for debugging
    - _Requirements: Error handling requirements_
  
  - [ ]* 11.3 Write integration tests
    - Create app/__tests__/integration.test.tsx
    - Test end-to-end time-based bar creation and display
    - Test auto-update system with multiple bars
    - Test error scenarios and recovery
    - Test backward compatibility with existing manual bars
    - _Requirements: All requirements_

- [ ] 12. Final checkpoint - Ensure all functionality works
  - Run all tests: npm test
  - Verify all property-based tests pass (minimum 100 iterations each)
  - Verify all unit tests pass
  - Test manually in browser:
    - Create count-up bar with historical start date
    - Create count-down bar with future target date
    - Create arrival-date bar
    - Verify auto-updates work (wait 1 minute and check progress changes)
    - Verify manual bars still work correctly
    - Test edit and delete functionality
  - Fix any failing tests or bugs
  - Ask user if questions arise about test failures or functionality

## Notes

### Testing Strategy
- **Property tests** (marked with `*`) are recommended for confidence but not blocking for MVP
- **Unit tests** with specific examples are required for core functionality
- Each task references specific requirements for traceability
- Checkpoints (tasks 6 and 14) ensure incremental validation

### Tech Stack
- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: Drizzle ORM with SQLite
- **Testing**: Vitest + fast-check + @testing-library/react
- **Date handling**: date-fns + @date-fns/utc for timezone-safe calculations

### Vitest Timer Testing Pattern
```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls callback at specified interval', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

### useInterval Hook Pattern (Dan Abramov)
The standard `setInterval` + `useEffect` pattern has a stale closure problem. Dan Abramov's solution uses a ref to always have access to the latest callback:

```typescript
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

Key benefits:
- Callback can safely reference current state/props without stale closures
- Passing `null` for delay pauses the interval
- Changing delay restarts the interval (expected behavior)
- Reference: https://overreacted.io/making-setinterval-declarative-with-react-hooks/

### Hydration-Safe Time Display
Time-based values differ between server and client. Pattern to avoid hydration mismatch:

```typescript
function TimeBasedProgressBar({ bar }: { bar: TimeBasedProgressBar }) {
  const [progress, setProgress] = useState<ProgressCalculation | null>(null);

  // Calculate client-side only after hydration
  useEffect(() => {
    setProgress(dateCalculator.calculateProgress(bar));
  }, [bar]);

  // Show skeleton/placeholder until hydrated
  if (!progress) {
    return <ProgressBarSkeleton />;
  }

  return <ProgressBar percentage={progress.percentage} />;
}
```

Or use `suppressHydrationWarning` for minor differences:
```tsx
<span suppressHydrationWarning>{formatDuration(progress.remainingTime)}</span>
```
