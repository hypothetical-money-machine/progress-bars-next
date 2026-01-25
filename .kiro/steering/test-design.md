---
inclusion: fileMatch
fileMatchPattern: ['**/*.test.ts', '**/*.pbt.test.ts', '**/test/**', '**/__tests__/**']
---

# Testing Guidelines for Time-Based Progress Bars

## Critical Rules for AI Assistants

When writing tests for time-based functionality, you MUST follow these constraints to prevent non-deterministic failures and infinite test durations.

### Property-Based Testing Constraints

**NEVER use unbounded date generation** - this causes:
- Tests spanning millions of years
- Non-deterministic failures
- CI/CD timeouts
- Inconsistent execution times

### Mandatory Date Constraints

Always constrain date generation to business-relevant ranges:

```typescript
// ❌ FORBIDDEN: Unbounded dates
fc.date()

// ✅ REQUIRED: Constrained dates
fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
```

**Standard ranges to use:**
- Historical: 2016-01-01 to 2025-12-31 (max 10 years past)
- Future: 2026-01-01 to 2076-01-01 (max 50 years future)  
- Mixed: 2020-01-01 to 2030-01-01 (for validation)
- Maximum span: 60 years total

### Duration-Based Generation Pattern

Generate start date + controlled duration instead of two random dates:

```typescript
// ✅ REQUIRED PATTERN
fc.property(
  fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
  fc.integer({ min: 1, max: 18250 }), // 1 day to 50 years
  (startDate, durationDays) => {
    const targetDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    // Test with known duration
  }
);
```

### Required Timeout Configuration

All property tests MUST include timeouts:

```typescript
fc.assert(
  fc.property(/* ... */),
  { 
    numRuns: 100,     // Standard iteration count
    timeout: 5000,    // 5 second property timeout
    verbose: true     // Show counterexamples
  }
);

// Vitest test timeout
it('property test', () => {
  // implementation
}, 10000); // 10 second test timeout
```

### Deterministic Testing

Use fixed reference dates, never `new Date()`:

```typescript
// ❌ FORBIDDEN: Non-deterministic
const progress = calculator.calculateProgress(bar, new Date());

// ✅ REQUIRED: Fixed reference
const now = new Date('2025-06-01');
const progress = calculator.calculateProgress(bar, now);
```

### Early Validation

Skip invalid cases with `fc.pre()`:

```typescript
fc.property(/* generators */, (startDate, durationDays) => {
  const targetDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  
  fc.pre(targetDate > startDate);  // Basic validation
  fc.pre(durationDays <= 18250);   // Max 50 years
  fc.pre(durationDays >= 1);       // Min 1 day
  
  // Test implementation
});
```

## Essential Test Templates

Copy these patterns when writing property-based tests:

### Date Calculation Accuracy
```typescript
it('elapsed + remaining = total for all valid ranges', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
      fc.integer({ min: 1, max: 18250 }),
      (startDate, durationDays) => {
        const targetDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const now = new Date('2025-06-01'); // Fixed reference
        
        if (targetDate < now && startDate > now) return true; // Skip invalid
        
        const bar = createMockTimeBasedBar(startDate, targetDate);
        const progress = calculator.calculateProgress(bar, now);
        
        const elapsed = progress.elapsedTime.totalDays;
        const remaining = progress.remainingTime.totalDays;
        const total = calculator.getDurationInDays(startDate, targetDate);
        
        // Allow tolerance for rounding
        expect(Math.abs((elapsed + remaining) - total)).toBeLessThanOrEqual(1);
      }
    ),
    { numRuns: 100, timeout: 5000, verbose: true }
  );
}, 10000);
```

### Completion Status Validation
```typescript
it('marks bars completed when target reached', () => {
  fc.assert(
    fc.property(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') }),
      fc.integer({ min: 30, max: 730 }),
      (startDate, durationDays) => {
        const targetDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
        const now = new Date('2025-01-01'); // After target
        
        const bar = createMockTimeBasedBar(startDate, targetDate);
        const progress = calculator.calculateProgress(bar, now);
        
        expect(progress.isCompleted).toBe(now >= targetDate);
      }
    ),
    { numRuns: 100, timeout: 5000 }
  );
}, 10000);
```

## Unit Test Requirements

Unit tests with specific examples are **required**. Property tests are **optional but recommended**.

### Required Unit Test Examples
```typescript
describe('DateCalculator', () => {
  it('calculates New Year to Christmas correctly', () => {
    const startDate = new Date('2025-01-01');
    const targetDate = new Date('2025-12-25');
    const now = new Date('2025-06-01');
    
    const bar = createMockTimeBasedBar(startDate, targetDate);
    const progress = calculator.calculateProgress(bar, now);
    
    expect(progress.elapsedTime.totalDays).toBe(151);
    expect(progress.remainingTime.totalDays).toBe(207);
    expect(progress.percentage).toBeCloseTo(42.2, 1);
  });

  it('handles leap year correctly', () => {
    const startDate = new Date('2024-01-01');
    const targetDate = new Date('2024-12-31');
    const now = new Date('2024-03-01');
    
    const bar = createMockTimeBasedBar(startDate, targetDate);
    const progress = calculator.calculateProgress(bar, now);
    
    expect(progress.elapsedTime.totalDays).toBe(60); // Includes Feb 29
    expect(calculator.getDurationInDays(startDate, targetDate)).toBe(366);
  });
});
```

## Timer Testing Pattern

Use Vitest fake timers for testing time-based hooks:

```typescript
import { vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('useInterval', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('calls callback at specified interval', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();
    
    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);
    
    act(() => vi.advanceTimersByTime(2000));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('cleans up on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));
    
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    
    expect(callback).not.toHaveBeenCalled();
  });
});
```

## Critical Pitfalls to Avoid

### 1. Unbounded Date Generation
```typescript
// ❌ NEVER: Can generate dates millions of years apart
fc.property(fc.date(), fc.date(), (start, end) => { /* ... */ });
```

### 2. Missing Timeouts
```typescript
// ❌ FORBIDDEN: No timeout protection
fc.assert(fc.property(/* ... */));

// ✅ REQUIRED: Always include timeouts
fc.assert(fc.property(/* ... */), { timeout: 5000 });
```

### 3. Non-Deterministic Time
```typescript
// ❌ FORBIDDEN: Different results each run
const progress = calculator.calculateProgress(bar, new Date());

// ✅ REQUIRED: Fixed reference time
const progress = calculator.calculateProgress(bar, new Date('2025-06-01'));
```

### 4. Exact Equality on Floating Point
```typescript
// ❌ FORBIDDEN: Fails due to rounding
expect(elapsed + remaining).toBe(total);

// ✅ REQUIRED: Allow tolerance
expect(Math.abs((elapsed + remaining) - total)).toBeLessThanOrEqual(1);
```

## Performance Limits

- **Property tests**: 100 iterations max
- **Property timeout**: 5 seconds
- **Test timeout**: 10 seconds  
- **Date range span**: 60 years max
- **Duration limits**: 1 day min, 50 years max

## Test File Organization

```
lib/services/__tests__/
├── DateCalculator.test.ts          # Required unit tests
├── DateCalculator.pbt.test.ts      # Optional property tests
├── TimeBasedManager.test.ts        # Required unit tests
└── TimeBasedManager.pbt.test.ts    # Optional property tests
```

## Pre-Test Checklist

Before writing any property test:

- [ ] Date ranges constrained (never `fc.date()` alone)
- [ ] Duration limits reasonable (1 day to 50 years)
- [ ] Timeouts specified (5s property, 10s test)
- [ ] Fixed reference dates for "current" time
- [ ] Invalid cases skipped with `fc.pre()`
- [ ] Tolerance allowed for floating-point math
- [ ] Iteration count ≤ 100