/**
 * Property-Based Tests for ProgressBar UI Integration
 * Property 10: UI component integration
 * Validates: Requirements 9.2, 9.3, 9.4, 9.5
 */

import { cleanup, render, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgressBar as ProgressBarType } from "@/db/schema";
import type { ProgressCalculation } from "@/lib/types";
import { ProgressBar } from "../ProgressBar";

// Mock the server actions
vi.mock("@/app/actions", () => ({
  deleteProgressBar: vi.fn(),
  updateProgress: vi.fn(),
}));

// Mock the hooks to avoid actual timer behavior in tests
vi.mock("@/lib/hooks/useTimeBasedProgress", () => ({
  useTimeBasedProgress: vi.fn(() => ({
    progress: {
      percentage: 50,
      elapsedTime: {
        totalDays: 30,
        years: 0,
        months: 1,
        days: 0,
        hours: 0,
        minutes: 0,
        totalHours: 720,
        totalMinutes: 43200,
      },
      remainingTime: {
        totalDays: 30,
        years: 0,
        months: 1,
        days: 0,
        hours: 0,
        minutes: 0,
        totalHours: 720,
        totalMinutes: 43200,
      },
      dailyProgressRate: 1.67,
      estimatedCompletionDate: new Date("2025-07-01"),
      isCompleted: false,
      isOverdue: false,
      currentValue: 30,
      targetValue: 60,
    },
    isStale: false,
  })),
}));

// Mock the DateCalculator service
vi.mock("@/lib/services/DateCalculator", () => ({
  dateCalculator: {
    formatDuration: vi.fn((duration) => `${duration.totalDays} days`),
  },
}));

// Mock ProgressStatistics component
vi.mock("../ProgressStatistics", () => ({
  ProgressStatistics: ({ progress }: { progress: ProgressCalculation }) => (
    <div data-testid="progress-statistics">
      Statistics: {progress.percentage}%
    </div>
  ),
}));

describe("ProgressBar Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup(); // Ensure DOM is cleaned up between tests
  });

  /**
   * Helper function to create mock manual progress bars
   */
  function createMockManualBar(
    currentValue: number,
    targetValue: number,
    title: string = "Test Bar",
  ): ProgressBarType {
    return {
      id: `manual-${Math.random()}`,
      title,
      description: "Test description",
      currentValue,
      targetValue,
      unit: null, // Default to null, will be set by test if needed
      unitPosition: "suffix",
      barType: "manual",
      startDate: null,
      targetDate: null,
      timeBasedType: null,
      isCompleted: false,
      isOverdue: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Helper function to create mock time-based progress bars
   */
  function createMockTimeBasedBar(
    startDate: Date,
    targetDate: Date,
    timeBasedType: "count-up" | "count-down" | "arrival-date" = "count-up",
    title: string = "Time-Based Bar",
  ): ProgressBarType {
    return {
      id: `time-based-${Math.random()}`,
      title,
      description: "Time-based test description",
      currentValue: 0, // Not used for time-based bars
      targetValue: 100, // Not used for time-based bars
      unit: null,
      unitPosition: null,
      barType: "time-based",
      startDate: startDate.toISOString(),
      targetDate: targetDate.toISOString(),
      timeBasedType,
      isCompleted: false,
      isOverdue: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Property 10a: Time-based bars display correctly with various date ranges
   * Validates: Requirements 9.2, 9.4
   */
  it("displays time-based bars correctly across various date ranges", () => {
    fc.assert(
      fc.property(
        // Constrained start date (historical to present)
        fc.date({ min: new Date("2020-01-01"), max: new Date("2025-01-01") }),
        // Controlled duration (1 day to 5 years)
        fc.integer({ min: 1, max: 1825 }),
        // Time-based type
        fc.constantFrom("count-up", "count-down", "arrival-date"),
        // Title variations - use alphanumeric to avoid special characters
        fc
          .string({ minLength: 3, maxLength: 20 })
          .filter(
            (s) => /^[a-zA-Z0-9\s]+$/.test(s.trim()) && s.trim().length >= 3,
          ),
        (startDate, durationDays, timeBasedType, title) => {
          const targetDate = new Date(
            startDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
          );

          // Skip invalid scenarios
          fc.pre(targetDate > startDate);
          fc.pre(title.trim().length >= 3);

          const bar = createMockTimeBasedBar(
            startDate,
            targetDate,
            timeBasedType,
            title.trim(),
          );

          // Render single component and cleanup after each test
          const { container, unmount } = render(<ProgressBar bar={bar} />);

          try {
            // Should display the title
            expect(screen.getByText(title.trim())).toBeInTheDocument();

            // Should have time-based badge - use more specific queries
            const badgeMap = {
              "count-up": "Count-Up",
              "count-down": "Count-Down",
              "arrival-date": "Arrival Date",
            };
            const expectedBadge = badgeMap[timeBasedType];
            expect(screen.getByText(expectedBadge)).toBeInTheDocument();

            // Should have progress bar element - look for the styled div
            const progressBarContainer = container.querySelector(
              ".bg-zinc-100.dark\\:bg-zinc-800",
            );
            expect(progressBarContainer).toBeTruthy();
            const progressBarFill = container.querySelector('[style*="width"]');
            expect(progressBarFill).toBeTruthy();

            // Should display progress statistics
            expect(
              screen.getByTestId("progress-statistics"),
            ).toBeInTheDocument();

            // Should have delete button
            expect(screen.getByLabelText("Delete")).toBeInTheDocument();

            // Should NOT have increment/decrement buttons (time-based bars don't have manual controls)
            expect(screen.queryByText("+")).not.toBeInTheDocument();
            expect(screen.queryByText("-")).not.toBeInTheDocument();
          } finally {
            unmount();
            cleanup();
          }
        },
      ),
      { numRuns: 20, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 10b: Manual bars still function correctly (backward compatibility)
   * Validates: Requirements 9.2, 9.3, 9.5
   */
  it("displays manual bars correctly with backward compatibility", () => {
    fc.assert(
      fc.property(
        // Current value (0 to target)
        fc.integer({ min: 0, max: 100 }),
        // Target value (current to 100)
        fc.integer({ min: 1, max: 100 }),
        // Title variations - use alphanumeric to avoid special characters
        fc
          .string({ minLength: 3, maxLength: 20 })
          .filter(
            (s) => /^[a-zA-Z0-9\s]+$/.test(s.trim()) && s.trim().length >= 3,
          ),
        // Unit variations
        fc.option(
          fc.constantFrom("items", "points", "tasks", "days", "percent"),
          { nil: null },
        ),
        (currentValue, targetValue, title, unit) => {
          // Ensure current <= target
          const adjustedCurrent = Math.min(currentValue, targetValue);

          fc.pre(title.trim().length >= 3);
          fc.pre(targetValue > 0);

          const bar = createMockManualBar(
            adjustedCurrent,
            targetValue,
            title.trim(),
          );
          if (unit) {
            bar.unit = unit;
          }

          // Render single component and cleanup after each test
          const { container, unmount } = render(<ProgressBar bar={bar} />);

          try {
            // Should display the title
            expect(screen.getByText(title.trim())).toBeInTheDocument();

            // Should have "Manual" badge
            expect(screen.getByText("Manual")).toBeInTheDocument();

            // Should have progress bar element - look for the styled div
            const progressBarContainer = container.querySelector(
              ".bg-zinc-100.dark\\:bg-zinc-800",
            );
            expect(progressBarContainer).toBeTruthy();
            const progressBarFill = container.querySelector('[style*="width"]');
            expect(progressBarFill).toBeTruthy();

            // Should display current/target values - account for default "items" unit
            const displayUnit = unit || "items";
            const valueText = `${adjustedCurrent.toLocaleString()} ${displayUnit} / ${targetValue.toLocaleString()} ${displayUnit}`;
            expect(screen.getByText(valueText)).toBeInTheDocument();

            // Should have increment/decrement buttons
            expect(screen.getByText("+")).toBeInTheDocument();
            expect(screen.getByText("-")).toBeInTheDocument();

            // Should have delete button
            expect(screen.getByLabelText("Delete")).toBeInTheDocument();

            // Should NOT have time-based badges
            expect(screen.queryByText("Count-Up")).not.toBeInTheDocument();
            expect(screen.queryByText("Count-Down")).not.toBeInTheDocument();
            expect(screen.queryByText("Arrival Date")).not.toBeInTheDocument();

            // Should NOT have progress statistics (time-based feature)
            expect(
              screen.queryByTestId("progress-statistics"),
            ).not.toBeInTheDocument();
          } finally {
            unmount();
            cleanup();
          }
        },
      ),
      { numRuns: 20, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 10c: UI formatting consistency across bar types
   * Validates: Requirements 9.5
   */
  it("maintains consistent UI formatting across different bar types", () => {
    fc.assert(
      fc.property(
        // Generate both manual and time-based bars
        fc.oneof(
          // Manual bar generator
          fc.record({
            type: fc.constant("manual" as const),
            currentValue: fc.integer({ min: 0, max: 100 }),
            targetValue: fc.integer({ min: 1, max: 100 }),
            title: fc
              .string({ minLength: 3, maxLength: 15 })
              .filter(
                (s) =>
                  /^[a-zA-Z0-9\s]+$/.test(s.trim()) && s.trim().length >= 3,
              ),
          }),
          // Time-based bar generator
          fc.record({
            type: fc.constant("time-based" as const),
            startDate: fc.date({
              min: new Date("2024-01-01"),
              max: new Date("2025-01-01"),
            }),
            durationDays: fc.integer({ min: 30, max: 365 }),
            timeBasedType: fc.constantFrom(
              "count-up",
              "count-down",
              "arrival-date",
            ),
            title: fc
              .string({ minLength: 3, maxLength: 15 })
              .filter(
                (s) =>
                  /^[a-zA-Z0-9\s]+$/.test(s.trim()) && s.trim().length >= 3,
              ),
          }),
        ),
        (barConfig) => {
          fc.pre(barConfig.title.trim().length >= 3);

          let bar: ProgressBarType;

          if (barConfig.type === "manual") {
            const adjustedCurrent = Math.min(
              barConfig.currentValue,
              barConfig.targetValue,
            );
            bar = createMockManualBar(
              adjustedCurrent,
              barConfig.targetValue,
              barConfig.title.trim(),
            );
          } else {
            const targetDate = new Date(
              barConfig.startDate.getTime() +
                barConfig.durationDays * 24 * 60 * 60 * 1000,
            );
            bar = createMockTimeBasedBar(
              barConfig.startDate,
              targetDate,
              barConfig.timeBasedType,
              barConfig.title.trim(),
            );
          }

          // Render single component and cleanup after each test
          const { container, unmount } = render(<ProgressBar bar={bar} />);

          try {
            // All bars should have consistent structural elements

            // 1. Container with consistent styling classes
            const containerDiv = container.firstChild as HTMLElement;
            expect(containerDiv).toHaveClass(
              "rounded-xl",
              "border",
              "bg-white",
              "p-4",
              "shadow-sm",
            );

            // 2. Title should be displayed
            expect(
              screen.getByText(barConfig.title.trim()),
            ).toBeInTheDocument();

            // 3. Should have a delete button
            expect(screen.getByLabelText("Delete")).toBeInTheDocument();

            // 4. Should have a progress bar visual element - look for the styled div
            const progressBarContainer = container.querySelector(
              ".bg-zinc-100.dark\\:bg-zinc-800",
            );
            expect(progressBarContainer).toBeTruthy();
            const progressBarFill = container.querySelector('[style*="width"]');
            expect(progressBarFill).toBeTruthy();

            // 5. Should have appropriate type badge
            if (barConfig.type === "manual") {
              expect(screen.getByText("Manual")).toBeInTheDocument();
            } else {
              const badgeMap = {
                "count-up": "Count-Up",
                "count-down": "Count-Down",
                "arrival-date": "Arrival Date",
              };
              const expectedBadge = badgeMap[barConfig.timeBasedType];
              expect(screen.getByText(expectedBadge)).toBeInTheDocument();
            }
          } finally {
            unmount();
            cleanup();
          }
        },
      ),
      { numRuns: 15, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 10d: Time-based bars show historical start dates correctly
   * Validates: Requirements 9.4 (historical date display)
   */
  it("displays historical start dates for time-based bars", () => {
    fc.assert(
      fc.property(
        // Historical start date (in the past)
        fc.date({ min: new Date("2020-01-01"), max: new Date("2024-12-31") }),
        // Duration to future
        fc.integer({ min: 365, max: 1095 }), // 1-3 years
        (startDate, durationDays) => {
          const targetDate = new Date(
            startDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
          );
          const now = new Date("2025-01-01"); // Fixed reference date

          // Only test historical start dates
          fc.pre(startDate < now);

          const bar = createMockTimeBasedBar(
            startDate,
            targetDate,
            "count-up",
            "Historical Test Bar",
          );

          // Render single component and cleanup after each test
          const { unmount } = render(<ProgressBar bar={bar} />);

          try {
            // Should display "Started: [date]" for historical dates
            const startedElements = screen.getAllByText(/Started:/);
            expect(startedElements.length).toBeGreaterThan(0);

            // Should contain the formatted start date
            const formattedDate = startDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            // Check that at least one element contains the formatted date
            const hasFormattedDate = startedElements.some((element) =>
              element.textContent?.includes(formattedDate),
            );
            expect(hasFormattedDate).toBe(true);
          } finally {
            unmount();
            cleanup();
          }
        },
      ),
      { numRuns: 15, timeout: 5000, verbose: true },
    );
  }, 10000);
});
