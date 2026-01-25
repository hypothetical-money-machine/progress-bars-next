/**
 * Property-Based Tests for ProgressStatistics
 * Property 8: Progress statistics accuracy
 * Validates: Requirements 7.3, 7.4, 7.5
 */

import { cleanup, render, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dateCalculator } from "@/lib/services/DateCalculator";
import type { Duration, ProgressCalculation } from "@/lib/types";
import { ProgressStatistics } from "../ProgressStatistics";

function buildDuration(
  parts: Omit<Duration, "totalDays" | "totalHours" | "totalMinutes">,
): Duration {
  const totalDays = parts.years * 365 + parts.months * 30 + parts.days;
  const totalHours = totalDays * 24 + parts.hours;
  const totalMinutes = totalHours * 60 + parts.minutes;
  return {
    ...parts,
    totalDays,
    totalHours,
    totalMinutes,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

describe("ProgressStatistics Property-Based Tests", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders statistics that match calculated values across time scales", () => {
    fc.assert(
      fc.property(
        fc.record({
          years: fc.integer({ min: 0, max: 50 }),
          months: fc.integer({ min: 0, max: 11 }),
          days: fc.integer({ min: 0, max: 30 }),
          hours: fc.integer({ min: 0, max: 23 }),
          minutes: fc.integer({ min: 0, max: 59 }),
        }),
        fc.record({
          years: fc.integer({ min: 0, max: 50 }),
          months: fc.integer({ min: 0, max: 11 }),
          days: fc.integer({ min: 0, max: 30 }),
          hours: fc.integer({ min: 0, max: 23 }),
          minutes: fc.integer({ min: 0, max: 59 }),
        }),
        fc.float({ min: 0, max: 150, noNaN: true, noDefaultInfinity: true }),
        fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
        fc.boolean(),
        fc.boolean(),
        fc.constantFrom("count-up", "count-down", "arrival-date"),
        fc.integer({ min: 0, max: 3650 }),
        (
          elapsedParts,
          remainingParts,
          percentage,
          dailyProgressRate,
          isCompleted,
          isOverdue,
          timeBasedType,
          targetOffsetDays,
        ) => {
          const elapsedTime = buildDuration(elapsedParts);
          const remainingTime = buildDuration(remainingParts);

          const baseDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0));
          const targetDate = new Date(
            baseDate.getTime() + targetOffsetDays * 24 * 60 * 60 * 1000,
          );

          const estimatedCompletionDate =
            timeBasedType === "count-up" && !isCompleted
              ? new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
              : undefined;

          const progress: ProgressCalculation = {
            currentValue: 0,
            targetValue: 100,
            percentage,
            elapsedTime,
            remainingTime,
            dailyProgressRate,
            estimatedCompletionDate,
            isCompleted,
            isOverdue,
          };

          const { unmount } = render(
            <ProgressStatistics
              progress={progress}
              targetDate={targetDate}
              timeBasedType={timeBasedType}
            />,
          );

          try {
            // Completion percentage
            expect(
              screen.getByText(`${Math.round(percentage)}%`),
            ).toBeInTheDocument();

            // Elapsed and remaining time formatting
            const expectedElapsed = dateCalculator.formatDuration(elapsedTime);
            expect(screen.getByText(expectedElapsed)).toBeInTheDocument();

            if (!isCompleted) {
              const expectedRemaining =
                dateCalculator.formatDuration(remainingTime);
              expect(screen.getByText(expectedRemaining)).toBeInTheDocument();
            }

            // Daily progress rate formatting
            expect(
              screen.getByText(`${dailyProgressRate.toFixed(2)}% per day`),
            ).toBeInTheDocument();

            // Target or arrival date label and formatting
            const expectedLabel =
              timeBasedType === "arrival-date" ? "Arrival Date" : "Target Date";
            expect(screen.getByText(expectedLabel)).toBeInTheDocument();
            expect(
              screen.getByText(formatDate(targetDate)),
            ).toBeInTheDocument();

            // Estimated completion date for count-up bars when applicable
            if (
              timeBasedType === "count-up" &&
              estimatedCompletionDate &&
              !isCompleted
            ) {
              expect(
                screen.getByText("Estimated Completion"),
              ).toBeInTheDocument();
              expect(
                screen.getByText(formatDate(estimatedCompletionDate)),
              ).toBeInTheDocument();
            }

            // Status indicators
            if (isCompleted) {
              expect(screen.getByText("Completed")).toBeInTheDocument();
            }

            if (isOverdue) {
              expect(screen.getByText("Overdue")).toBeInTheDocument();
            }
          } finally {
            unmount();
            cleanup();
          }
        },
      ),
      { numRuns: 25, timeout: 5000, verbose: true },
    );
  }, 10000);
});
