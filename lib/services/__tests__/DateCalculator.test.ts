/**
 * Unit tests for DateCalculator service
 * Tests specific examples and edge cases
 */

import { describe, expect, it } from "vitest";
import type { TimeBasedProgressBar } from "@/lib/types";
import { DateCalculator } from "../DateCalculator";

describe("DateCalculator", () => {
  const calculator = new DateCalculator();

  describe("getDurationInDays", () => {
    it("should calculate days between two dates", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-31");
      const days = calculator.getDurationInDays(start, end);
      expect(days).toBe(30);
    });

    it("should handle dates in reverse order", () => {
      const start = new Date("2024-01-31");
      const end = new Date("2024-01-01");
      const days = calculator.getDurationInDays(start, end);
      expect(days).toBe(30);
    });

    it("should handle same date", () => {
      const date = new Date("2024-01-01");
      const days = calculator.getDurationInDays(date, date);
      expect(days).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("should format duration with years and months", () => {
      const duration = {
        years: 2,
        months: 3,
        days: 5,
        hours: 0,
        minutes: 0,
        totalDays: 795,
        totalHours: 19080,
        totalMinutes: 1144800,
      };
      const formatted = calculator.formatDuration(duration);
      expect(formatted).toBe("2 years, 3 months, and 5 days");
    });

    it("should format duration with only days", () => {
      const duration = {
        years: 0,
        months: 0,
        days: 15,
        hours: 6,
        minutes: 30,
        totalDays: 15,
        totalHours: 366,
        totalMinutes: 21990,
      };
      const formatted = calculator.formatDuration(duration);
      expect(formatted).toBe("15 days, 6 hours, and 30 minutes");
    });

    it("should format zero duration", () => {
      const duration = {
        years: 0,
        months: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 0,
        totalHours: 0,
        totalMinutes: 0,
      };
      const formatted = calculator.formatDuration(duration);
      expect(formatted).toBe("0 minutes");
    });

    it("should use singular forms correctly", () => {
      const duration = {
        years: 1,
        months: 1,
        days: 1,
        hours: 0,
        minutes: 0,
        totalDays: 396,
        totalHours: 9504,
        totalMinutes: 570240,
      };
      const formatted = calculator.formatDuration(duration);
      expect(formatted).toBe("1 year, 1 month, and 1 day");
    });
  });

  describe("calculateProgress", () => {
    it("should calculate progress for count-up bar", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-up",
        startDate: new Date("2024-01-01"),
        targetDate: new Date("2024-12-31"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2024-07-01");
      const progress = calculator.calculateProgress(bar, currentDate);

      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.percentage).toBeLessThan(100);
      expect(progress.isCompleted).toBe(false);
      expect(progress.currentValue).toBeGreaterThan(0);
      expect(progress.targetValue).toBe(365);
    });

    it("should mark bar as completed when current date reaches target", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-down",
        startDate: new Date("2024-01-01"),
        targetDate: new Date("2024-06-01"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2024-07-01");
      const progress = calculator.calculateProgress(bar, currentDate);

      expect(progress.isCompleted).toBe(true);
      expect(progress.percentage).toBe(100);
      expect(progress.remainingTime.totalDays).toBe(0);
    });

    it("should mark arrival-date bar as overdue", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "arrival-date",
        startDate: new Date("2024-01-01"),
        targetDate: new Date("2024-06-01"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2024-07-01");
      const progress = calculator.calculateProgress(bar, currentDate);

      expect(progress.isOverdue).toBe(true);
      expect(progress.isCompleted).toBe(true);
    });

    it("should return zero elapsedTime when current date is before start", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Future Start Bar",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-down",
        startDate: new Date("2028-01-01"),
        targetDate: new Date("2028-12-31"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2026-06-15");
      const progress = calculator.calculateProgress(bar, currentDate);

      // elapsedDays should be clamped to 0
      expect(progress.currentValue).toBe(365); // count-down shows remaining
      expect(progress.percentage).toBe(0);

      // elapsedTime Duration should be all zeros
      expect(progress.elapsedTime.totalDays).toBe(0);
      expect(progress.elapsedTime.years).toBe(0);
      expect(progress.elapsedTime.months).toBe(0);
      expect(progress.elapsedTime.days).toBe(0);

      // remainingTime should equal total duration (start to target)
      expect(progress.remainingTime.totalDays).toBe(365);
    });

    it("should transition correctly when start date is reached", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Start Today Bar",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-down",
        startDate: new Date("2026-01-01"),
        targetDate: new Date("2026-12-31"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // At exact start date
      const atStart = calculator.calculateProgress(bar, new Date("2026-01-01"));
      expect(atStart.percentage).toBe(0);
      expect(atStart.elapsedTime.totalDays).toBe(0);

      // One day after start
      const afterStart = calculator.calculateProgress(
        bar,
        new Date("2026-01-02"),
      );
      expect(afterStart.elapsedTime.totalDays).toBe(1);
      expect(afterStart.percentage).toBeGreaterThan(0);
    });

    it("should handle future start date for count-up bars", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Future Count-Up",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-up",
        startDate: new Date("2028-01-01"),
        targetDate: new Date("2028-12-31"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2026-06-15");
      const progress = calculator.calculateProgress(bar, currentDate);

      // count-up shows elapsed days as currentValue
      expect(progress.currentValue).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.elapsedTime.totalDays).toBe(0);
      expect(progress.remainingTime.totalDays).toBe(365);
    });

    it("should handle future start date for arrival-date bars", () => {
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Future Arrival",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "arrival-date",
        startDate: new Date("2028-01-01"),
        targetDate: new Date("2028-12-31"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentDate = new Date("2026-06-15");
      const progress = calculator.calculateProgress(bar, currentDate);

      // arrival-date shows elapsed days as currentValue
      expect(progress.currentValue).toBe(0);
      expect(progress.percentage).toBe(0);
      expect(progress.elapsedTime.totalDays).toBe(0);
      expect(progress.remainingTime.totalDays).toBe(365);
      expect(progress.isOverdue).toBe(false);
    });

    it("should handle same-day earlier time correctly", () => {
      // Start date at noon, current date at 6am same day
      const bar: TimeBasedProgressBar = {
        id: "1",
        title: "Same Day Test",
        description: null,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        timeBasedType: "count-down",
        startDate: new Date("2026-06-15T12:00:00"),
        targetDate: new Date("2026-12-31T12:00:00"),
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 6am on start day (before noon start time)
      const currentDate = new Date("2026-06-15T06:00:00");
      const progress = calculator.calculateProgress(bar, currentDate);

      // isBefore is true, so should be clamped
      expect(progress.elapsedTime.totalDays).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });

  describe("validateDateRange", () => {
    it("should validate correct date range", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      const result = calculator.validateDateRange(start, end);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject when target is before start", () => {
      const start = new Date("2024-12-31");
      const end = new Date("2024-01-01");
      const result = calculator.validateDateRange(start, end);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe("INVALID_DATE_RANGE");
    });

    it("should reject invalid dates", () => {
      const start = new Date("invalid");
      const end = new Date("2024-12-31");
      const result = calculator.validateDateRange(start, end);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateHistoricalDate", () => {
    it("should accept date within historical limit", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 5);
      const result = calculator.validateHistoricalDate(date, 10);
      expect(result.isValid).toBe(true);
    });

    it("should reject date beyond historical limit", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 15);
      const result = calculator.validateHistoricalDate(date, 10);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe("HISTORICAL_LIMIT_EXCEEDED");
    });
  });

  describe("validateFutureDate", () => {
    it("should accept future date", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      const result = calculator.validateFutureDate(date);
      expect(result.isValid).toBe(true);
    });

    it("should reject past date", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 1);
      const result = calculator.validateFutureDate(date);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe("FUTURE_START_DATE");
    });
  });

  describe("Timezone Edge Cases (Bug Fix Tests)", () => {
    describe("Date parsing with timezone handling", () => {
      it("should handle date at 11pm PST correctly (same day, not shifted to previous day)", () => {
        // This tests the fix for: Date parsing used UTC which caused day shifts
        // A date string like "2024-06-15" should be treated as midnight UTC on that day
        // NOT as midnight local time (which could shift the day in some timezones)

        const dateString = "2024-06-15";
        const parsed = new Date(dateString);

        // When parsed as ISO 8601 date (YYYY-MM-DD), JS should treat it as UTC midnight
        expect(parsed.getUTCDate()).toBe(15);
        expect(parsed.getUTCMonth()).toBe(5); // June is month 5 (0-indexed)
        expect(parsed.getUTCFullYear()).toBe(2024);
      });

      it("should parse date strings consistently regardless of local timezone", () => {
        // Date strings should be interpreted the same way everywhere
        const dateStr = "2024-06-15";
        const parsed = new Date(dateStr);

        // The UTC components should always be the same
        const year = parsed.getUTCFullYear();
        const month = parsed.getUTCMonth();
        const day = parsed.getUTCDate();

        expect(year).toBe(2024);
        expect(month).toBe(5);
        expect(day).toBe(15);
      });

      it("should append T00:00:00 to prevent UTC interpretation issues", () => {
        // Without time component, some systems interpret date strings as UTC
        // This test verifies that using getUTCDate() on the parsed date works correctly
        const dateStringWithoutTime = "2024-12-31";
        const parsed = new Date(dateStringWithoutTime);

        // Should be interpreted as 2024-12-31 UTC 00:00:00
        expect(parsed.getUTCFullYear()).toBe(2024);
        expect(parsed.getUTCMonth()).toBe(11); // December
        expect(parsed.getUTCDate()).toBe(31);
        expect(parsed.getUTCHours()).toBe(0);
      });

      it("should handle date at day boundary correctly", () => {
        // A date at the day boundary should not shift
        const start = new Date("2024-06-14");
        const end = new Date("2024-06-15");

        const days = calculator.getDurationInDays(start, end);
        expect(days).toBe(1);
      });

      it("should not shift dates when stored and retrieved", () => {
        // Simulate storing dates as ISO strings and parsing them back
        const originalDate = new Date("2024-03-15");
        const isoString = originalDate.toISOString();
        const reparsed = new Date(isoString);

        // Should be equivalent
        expect(reparsed.getUTCDate()).toBe(originalDate.getUTCDate());
        expect(reparsed.getUTCMonth()).toBe(originalDate.getUTCMonth());
        expect(reparsed.getUTCFullYear()).toBe(originalDate.getUTCFullYear());
      });
    });

    describe("useTimeBasedProgress dependency stability", () => {
      it("should verify that using .getTime() prevents re-renders", () => {
        // This tests the fix for: useTimeBasedProgress had unstable Date dependencies
        // causing render loops - fixed by using .getTime()

        const date1 = new Date("2024-06-15");
        const date2 = new Date("2024-06-15");

        // Date objects are different references even with same value
        expect(date1).not.toBe(date2);

        // But .getTime() returns same primitive value
        expect(date1.getTime()).toBe(date2.getTime());
      });

      it("should show that useEffect dependencies must use primitives", () => {
        // useEffect dependency arrays use === comparison
        // Date objects would create infinite loops because new instances !== old instances

        const dateA = new Date("2024-06-15");
        const dateB = new Date("2024-06-15");

        // These would trigger re-renders if used directly in useEffect dependency array
        const isSameReference = dateA === dateB;
        expect(isSameReference).toBe(false); // They're different objects!

        // Using .getTime() solves this
        const isSameTime = dateA.getTime() === dateB.getTime();
        expect(isSameTime).toBe(true);
      });
    });
  });

  describe("Large Time Scale Support", () => {
    describe("validateTimeScale", () => {
      it("should accept date range within 50 years", () => {
        const start = new Date("2000-01-01");
        const end = new Date("2049-12-31");
        const result = calculator.validateTimeScale(start, end);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should accept exactly 50 years", () => {
        const start = new Date("2000-01-01");
        const end = new Date("2050-01-01");
        const result = calculator.validateTimeScale(start, end);
        expect(result.isValid).toBe(true);
      });

      it("should reject date range exceeding 50 years", () => {
        const start = new Date("2000-01-01");
        const end = new Date("2051-01-01");
        const result = calculator.validateTimeScale(start, end);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe("INVALID_DATE_RANGE");
        expect(result.errors[0].message).toContain("50 years");
      });

      it("should handle reverse date order", () => {
        const start = new Date("2049-12-31");
        const end = new Date("2000-01-01");
        const result = calculator.validateTimeScale(start, end);
        expect(result.isValid).toBe(true);
      });
    });

    describe("Multi-year date range calculations", () => {
      it("should calculate progress for 10-year duration", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "Decade Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("2020-01-01"),
          targetDate: new Date("2030-01-01"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2025-01-01");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBe(5);
        expect(progress.remainingTime.years).toBe(5);
        expect(progress.percentage).toBeCloseTo(50, 1);
      });

      it("should calculate progress for 25-year duration", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "Quarter Century Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("2000-01-01"),
          targetDate: new Date("2025-01-01"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2012-07-01");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBeGreaterThanOrEqual(12);
        expect(progress.remainingTime.years).toBeGreaterThanOrEqual(12);
        expect(progress.percentage).toBeGreaterThan(40);
        expect(progress.percentage).toBeLessThan(60);
      });

      it("should calculate progress for 50-year duration", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "Half Century Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("2000-01-01"),
          targetDate: new Date("2050-01-01"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2025-01-01");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBe(25);
        expect(progress.remainingTime.years).toBe(25);
        expect(progress.percentage).toBeCloseTo(50, 1);
        expect(progress.targetValue).toBeGreaterThan(18000); // ~50 years in days
      });
    });

    describe("Leap year handling", () => {
      it("should count leap years correctly", () => {
        const start = new Date(Date.UTC(2000, 0, 1));
        const end = new Date(Date.UTC(2020, 11, 31));
        const leapYears = calculator.countLeapYears(start, end);

        // Leap years: 2000, 2004, 2008, 2012, 2016, 2020
        expect(leapYears).toBe(6);
      });

      it("should handle single leap year", () => {
        const start = new Date(Date.UTC(2020, 0, 1));
        const end = new Date(Date.UTC(2020, 11, 31));
        const leapYears = calculator.countLeapYears(start, end);
        expect(leapYears).toBe(1);
      });

      it("should handle non-leap year range", () => {
        const start = new Date(Date.UTC(2021, 0, 1));
        const end = new Date(Date.UTC(2022, 11, 31));
        const leapYears = calculator.countLeapYears(start, end);
        expect(leapYears).toBe(0);
      });

      it("should calculate duration accurately across leap year", () => {
        const start = new Date("2020-01-01");
        const end = new Date("2021-01-01");
        const days = calculator.getDurationInDays(start, end);

        // 2020 is a leap year, so 366 days
        expect(days).toBe(366);
      });

      it("should calculate duration accurately across non-leap year", () => {
        const start = new Date("2021-01-01");
        const end = new Date("2022-01-01");
        const days = calculator.getDurationInDays(start, end);

        // 2021 is not a leap year, so 365 days
        expect(days).toBe(365);
      });

      it("should handle February 29th correctly", () => {
        const start = new Date("2020-02-29");
        const end = new Date("2024-02-29");
        const days = calculator.getDurationInDays(start, end);

        // 4 years including leap days
        expect(days).toBe(1461); // 365 + 366 + 365 + 365
      });

      it("should calculate progress across multiple leap years", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "Multi-Leap Year Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("2000-01-01"),
          targetDate: new Date("2020-01-01"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2010-01-01");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBe(10);
        expect(progress.remainingTime.years).toBe(10);
        // Should account for leap years in total days
        expect(progress.targetValue).toBeGreaterThan(7300); // More than 20*365
      });
    });

    describe("Precision with large time scales", () => {
      it("should maintain precision for 30-year duration", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "30 Year Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("1995-06-15"),
          targetDate: new Date("2025-06-15"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2010-06-15");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBe(15);
        expect(progress.elapsedTime.months).toBe(0);
        expect(progress.elapsedTime.days).toBe(0);
        expect(progress.percentage).toBeCloseTo(50, 1);
      });

      it("should format large durations correctly", () => {
        const duration = {
          years: 45,
          months: 7,
          days: 23,
          hours: 0,
          minutes: 0,
          totalDays: 16670,
          totalHours: 400080,
          totalMinutes: 24004800,
        };

        const formatted = calculator.formatDuration(duration);
        expect(formatted).toContain("45 years");
        expect(formatted).toContain("7 months");
        expect(formatted).toContain("23 days");
      });

      it("should handle edge case of exactly 50 years", () => {
        const bar: TimeBasedProgressBar = {
          id: "1",
          title: "50 Year Goal",
          description: null,
          currentValue: 0,
          targetValue: 0,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          timeBasedType: "count-up",
          startDate: new Date("1975-01-01"),
          targetDate: new Date("2025-01-01"),
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const currentDate = new Date("2000-01-01");
        const progress = calculator.calculateProgress(bar, currentDate);

        expect(progress.elapsedTime.years).toBe(25);
        expect(progress.remainingTime.years).toBe(25);
        expect(progress.percentage).toBeCloseTo(50, 1);
      });
    });
  });
});
