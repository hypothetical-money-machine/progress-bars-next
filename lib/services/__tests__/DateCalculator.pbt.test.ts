/**
 * Property-Based Tests for DateCalculator
 * Property 3: Time calculation accuracy
 * Property 1/2: Date validation
 */

import { addDays, addMonths, addYears } from "date-fns";
import * as fc from "fast-check";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import type { TimeBasedProgressBar } from "@/lib/types";
import { DateCalculator } from "../DateCalculator";

describe("DateCalculator Property-Based Tests", () => {
  const calculator = new DateCalculator();

  const baseDateArb = fc
    .record({
      year: fc.integer({ min: 2000, max: 2030 }),
      month: fc.integer({ min: 0, max: 11 }),
      day: fc.integer({ min: 1, max: 28 }),
    })
    .map(
      ({ year, month, day }) => new Date(Date.UTC(year, month, day, 12, 0, 0)),
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 12, 0, 0)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createBar(startDate: Date, targetDate: Date): TimeBasedProgressBar {
    return {
      id: "pbt-bar",
      title: "Property Test Bar",
      description: null,
      currentValue: 0,
      targetValue: 0,
      unit: null,
      unitPosition: null,
      barType: "time-based",
      timeBasedType: "count-up",
      startDate,
      targetDate,
      isCompleted: false,
      isOverdue: false,
      createdAt: startDate,
      updatedAt: startDate,
    };
  }

  /**
   * Property 3: Time calculation accuracy
   * Validates: Requirements 1.4, 1.5, 2.3, 3.3, 4.2, 4.3
   */
  it("maintains elapsed + remaining = total and percentage accuracy", () => {
    fc.assert(
      fc.property(
        baseDateArb,
        fc.integer({ min: 1, max: 3650 }),
        fc.integer({ min: 0, max: 3650 }),
        (startDate, durationDays, offsetDays) => {
          const targetDate = addDays(startDate, durationDays);
          const boundedOffset = Math.min(offsetDays, durationDays);
          const currentDate = addDays(startDate, boundedOffset);

          const bar = createBar(startDate, targetDate);
          const progress = calculator.calculateProgress(bar, currentDate);
          const totalDays = calculator.getDurationInDays(startDate, targetDate);

          const elapsed = progress.elapsedTime.totalDays;
          const remaining = progress.remainingTime.totalDays;

          const elapsedPlusRemainingClose =
            Math.abs(elapsed + remaining - totalDays) <= 1;

          const expectedPercentage = (elapsed / totalDays) * 100;
          const percentageClose =
            Math.abs(progress.percentage - expectedPercentage) <= 1;

          return elapsedPlusRemainingClose && percentageClose;
        },
      ),
      { numRuns: 50, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 1: Date validation
   * Validates: Requirements 1.2, 2.1, 4.1, 4.4
   */
  it("validates historical and future date rules consistently", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 11, max: 30 }),
        fc.integer({ min: 1, max: 3650 }),
        fc.integer({ min: 1, max: 3650 }),
        (yearsWithinLimit, yearsBeyondLimit, daysInFuture, daysInPast) => {
          const now = new Date();

          const withinHistorical = addYears(now, -yearsWithinLimit);
          const beyondHistorical = addYears(now, -yearsBeyondLimit);

          const historicalValid = calculator.validateHistoricalDate(
            withinHistorical,
            10,
          );
          const historicalInvalid = calculator.validateHistoricalDate(
            beyondHistorical,
            10,
          );

          const futureDate = addDays(now, daysInFuture);
          const pastDate = addDays(now, -daysInPast);

          const futureValid = calculator.validateFutureDate(futureDate);
          const futureInvalid = calculator.validateFutureDate(pastDate);

          return (
            historicalValid.isValid === true &&
            historicalValid.errors.length === 0 &&
            historicalInvalid.isValid === false &&
            historicalInvalid.errors.length > 0 &&
            historicalInvalid.errors.every((err) => err.message.length > 0) &&
            futureValid.isValid === true &&
            futureValid.errors.length === 0 &&
            futureInvalid.isValid === false &&
            futureInvalid.errors.length > 0 &&
            futureInvalid.errors.every((err) => err.message.length > 0)
          );
        },
      ),
      { numRuns: 50, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 2: Date range validation
   * Validates: Requirements 1.3, 3.2
   */
  it("validates start/target date ordering", () => {
    fc.assert(
      fc.property(
        baseDateArb,
        fc.integer({ min: 1, max: 3650 }),
        fc.integer({ min: -3650, max: 0 }),
        (startDate, positiveDuration, nonPositiveDuration) => {
          const validTarget = addDays(startDate, positiveDuration);
          const invalidTarget = addDays(startDate, nonPositiveDuration);

          const validResult = calculator.validateDateRange(
            startDate,
            validTarget,
          );
          const invalidResult = calculator.validateDateRange(
            startDate,
            invalidTarget,
          );

          const invalidHasRangeError = invalidResult.errors.some(
            (error) => error.code === "INVALID_DATE_RANGE",
          );

          return (
            validResult.isValid === true &&
            validResult.errors.length === 0 &&
            invalidResult.isValid === false &&
            invalidResult.errors.length > 0 &&
            invalidHasRangeError
          );
        },
      ),
      { numRuns: 50, timeout: 5000, verbose: true },
    );
  }, 10000);

  /**
   * Property 6: Large time scale support
   * Validates: Requirements 5.1, 5.3, 5.5
   */
  it("maintains precision across 1-50 year ranges with leap years", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1970, max: 2030 }),
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 0, max: 27 }),
        (baseYear, years, extraMonths, extraDays) => {
          const startDate = new Date(Date.UTC(baseYear, 0, 1, 12, 0, 0));
          const targetDate = addDays(
            addMonths(addYears(startDate, years), extraMonths),
            extraDays,
          );

          const bar = createBar(startDate, targetDate);
          const progress = calculator.calculateProgress(bar, targetDate);
          const totalDays = calculator.getDurationInDays(startDate, targetDate);

          const elapsedClose =
            Math.abs(progress.elapsedTime.totalDays - totalDays) <= 1;
          const remainingZero = progress.remainingTime.totalDays === 0;
          const percentageComplete =
            progress.percentage >= 99 && progress.percentage <= 100;

          let leapYearAccurate = true;
          if (extraMonths === 0 && extraDays === 0) {
            const leapYears = calculator.countLeapYears(startDate, targetDate);
            const expectedDays = years * 365 + leapYears;
            leapYearAccurate = Math.abs(totalDays - expectedDays) <= 1;
          }

          return (
            elapsedClose &&
            remainingZero &&
            percentageComplete &&
            progress.isCompleted === true &&
            leapYearAccurate
          );
        },
      ),
      { numRuns: 50, timeout: 5000, verbose: true },
    );
  }, 10000);
});
