/**
 * Property-Based Tests for TimeBasedManager
 * Property 4: Completion and overdue status
 */

import { addDays } from "date-fns";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import type { ProgressBar } from "@/db/schema";
import { TimeBasedManager } from "../TimeBasedManager";

const baseDateArb = fc
  .record({
    year: fc.integer({ min: 2000, max: 2030 }),
    month: fc.integer({ min: 0, max: 11 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(
    ({ year, month, day }) => new Date(Date.UTC(year, month, day, 12, 0, 0)),
  );

function createBar(
  startDate: Date,
  targetDate: Date,
  timeBasedType: "count-up" | "count-down" | "arrival-date",
): ProgressBar {
  return {
    id: "pbt-bar",
    title: "Property Test Bar",
    description: null,
    currentValue: 0,
    targetValue: 0,
    unit: null,
    unitPosition: null,
    barType: "time-based",
    startDate: startDate.toISOString(),
    targetDate: targetDate.toISOString(),
    timeBasedType,
    isCompleted: false,
    isOverdue: false,
    createdAt: startDate,
    updatedAt: startDate,
  };
}

describe("TimeBasedManager Property-Based Tests", () => {
  const manager = new TimeBasedManager();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Property 4: Completion and overdue status
   * Validates: Requirements 2.5, 3.4, 3.5, 6.3
   */
  it("marks completion and overdue status based on current date", () => {
    fc.assert(
      fc.property(
        baseDateArb,
        fc.integer({ min: 1, max: 3650 }),
        fc.integer({ min: -3650, max: 3650 }),
        fc.constantFrom<"count-up" | "count-down" | "arrival-date">(
          "count-up",
          "count-down",
          "arrival-date",
        ),
        (startDate, durationDays, offsetDays, timeBasedType) => {
          const targetDate = addDays(startDate, durationDays);
          const currentDate = addDays(targetDate, offsetDays);

          vi.setSystemTime(currentDate);

          const bar = createBar(startDate, targetDate, timeBasedType);
          const progress = manager.calculateCurrentProgress(bar);

          const shouldBeCompleted = offsetDays >= 0;
          const shouldBeOverdue =
            timeBasedType === "arrival-date" && offsetDays > 0;

          return (
            progress.isCompleted === shouldBeCompleted &&
            progress.isOverdue === shouldBeOverdue
          );
        },
      ),
      { numRuns: 50, timeout: 5000, verbose: true },
    );
  }, 10000);
});
