/**
 * DateCalculator Service
 * Handles all date-based calculations for time-based progress bars
 * Requirements: 1.4, 1.5, 2.3, 5.2
 */

import {
  addMonths,
  addYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInYears,
  isAfter,
  isBefore,
  isValid,
} from "date-fns";

import type {
  Duration,
  ProgressCalculation,
  TimeBasedProgressBar,
  ValidationError,
  ValidationResult,
} from "@/lib/types";

/**
 * DateCalculator class provides date calculation and validation services
 * for time-based progress bars
 *
 * Supports large time scales up to 50 years with accurate leap year handling
 * Requirements: 5.1, 5.3, 5.5
 */
export class DateCalculator {
  // Maximum supported duration in years
  private readonly MAX_YEARS = 50;

  /**
   * Create a zero-valued Duration object
   * Used when elapsed time should be clamped to zero (e.g., before start date)
   */
  private zeroDuration(): Duration {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      totalDays: 0,
      totalHours: 0,
      totalMinutes: 0,
    };
  }

  /**
   * Calculate progress for a time-based progress bar
   * Requirements: 1.4, 1.5, 2.3
   *
   * @param bar - The time-based progress bar
   * @param currentDate - The current date to calculate progress from
   * @returns ProgressCalculation with all computed values
   */
  calculateProgress(
    bar: TimeBasedProgressBar,
    currentDate: Date = new Date(),
  ): ProgressCalculation {
    const { startDate, targetDate, timeBasedType } = bar;

    // Calculate total duration in days
    const totalDays = this.getDurationInDays(startDate, targetDate);

    // Bug 2 fix: Use clamped elapsed days (0 if before start)
    const elapsedDays = this.getElapsedDays(startDate, currentDate);
    const isBeforeStart = isBefore(currentDate, startDate);

    // Clamp elapsedTime to zero if before start date
    const elapsedTime = isBeforeStart
      ? this.zeroDuration()
      : this.calculateDuration(startDate, currentDate);

    // Calculate remaining time
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    // Clamp remainingTime: zero if after target, total duration if before start
    const isAfterTarget = isAfter(currentDate, targetDate);
    const remainingTime = isAfterTarget
      ? this.zeroDuration()
      : isBeforeStart
        ? this.calculateDuration(startDate, targetDate)
        : this.calculateDuration(currentDate, targetDate);

    // Calculate percentage (clamped between 0 and 100)
    const percentage =
      totalDays > 0
        ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
        : 0;

    // Calculate daily progress rate
    const dailyProgressRate = totalDays > 0 ? 100 / totalDays : 0;

    // Determine completion and overdue status
    const isCompleted = percentage >= 100 || !isBefore(currentDate, targetDate);
    const isOverdue =
      timeBasedType === "arrival-date" && isAfter(currentDate, targetDate);

    // Calculate estimated completion date (for count-up bars)
    let estimatedCompletionDate: Date | undefined;
    if (timeBasedType === "count-up" && !isCompleted) {
      estimatedCompletionDate = targetDate;
    }

    // Bug 1 fix: Return type-specific currentValue
    // Count-down bars show remaining days, count-up/arrival-date show elapsed days
    const currentValue =
      timeBasedType === "count-down" ? remainingDays : elapsedDays;

    return {
      currentValue,
      targetValue: totalDays,
      percentage,
      elapsedTime,
      remainingTime,
      dailyProgressRate,
      estimatedCompletionDate,
      isCompleted,
      isOverdue,
    };
  }

  /**
   * Get duration in days between two dates
   * Requirement: 1.4, 1.5
   *
   * @param startDate - The start date
   * @param endDate - The end date
   * @returns Total number of days between dates
   */
  getDurationInDays(startDate: Date, endDate: Date): number {
    return Math.abs(differenceInDays(endDate, startDate));
  }

  /**
   * Get elapsed days since start date, clamped to 0 if before start
   * Bug 2 fix: Prevents progress from starting before startDate
   * Requirement: 1.4, 1.5
   *
   * @param startDate - The start date
   * @param currentDate - The current date
   * @returns Elapsed days, clamped to 0 if currentDate is before startDate
   */
  getElapsedDays(startDate: Date, currentDate: Date): number {
    const diff = differenceInDays(currentDate, startDate);
    return Math.max(0, diff);
  }

  /**
   * Calculate detailed duration breakdown between two dates
   * Handles large time scales up to 50 years with accurate leap year handling
   * Requirements: 5.1, 5.3, 5.5
   *
   * @param startDate - The start date
   * @param endDate - The end date
   * @returns Duration object with multiple granularities
   */
  private calculateDuration(startDate: Date, endDate: Date): Duration {
    // Use date-fns functions which handle leap years automatically
    const totalDays = differenceInDays(endDate, startDate);
    const totalHours = differenceInHours(endDate, startDate);
    const totalMinutes = differenceInMinutes(endDate, startDate);

    // Calculate years and months using date-fns (handles leap years)
    const years = differenceInYears(endDate, startDate);
    const months = differenceInMonths(endDate, startDate) % 12;

    // Calculate remaining days after accounting for years and months
    // Using addYears and addMonths ensures leap year handling
    let tempDate = addYears(startDate, years);
    tempDate = addMonths(tempDate, months);
    const days = differenceInDays(endDate, tempDate);

    // Calculate hours and minutes for the remaining time
    const hours = differenceInHours(endDate, tempDate) % 24;
    const minutes = differenceInMinutes(endDate, tempDate) % 60;

    return {
      years: Math.abs(years),
      months: Math.abs(months),
      days: Math.abs(days),
      hours: Math.abs(hours),
      minutes: Math.abs(minutes),
      totalDays: Math.abs(totalDays),
      totalHours: Math.abs(totalHours),
      totalMinutes: Math.abs(totalMinutes),
    };
  }

  /**
   * Validate that a date range is within the supported time scale (up to 50 years)
   * Requirement: 5.1, 5.3
   *
   * @param startDate - The start date
   * @param endDate - The end date
   * @returns ValidationResult with any errors
   */
  validateTimeScale(startDate: Date, endDate: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isValid(startDate) || !isValid(endDate)) {
      errors.push({
        field: "dateRange",
        message: "Invalid date format",
        code: "INVALID_DATE_FORMAT",
      });
      return { isValid: false, errors };
    }

    const years = Math.abs(differenceInYears(endDate, startDate));

    if (years > this.MAX_YEARS) {
      errors.push({
        field: "dateRange",
        message: `Date range cannot exceed ${this.MAX_YEARS} years`,
        code: "INVALID_DATE_RANGE",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Count leap years between two dates
   * Requirement: 5.5
   *
   * @param startDate - The start date
   * @param endDate - The end date
   * @returns Number of leap years in the range
   */
  countLeapYears(startDate: Date, endDate: Date): number {
    // Use UTC to avoid timezone issues
    const startYear = startDate.getUTCFullYear();
    const endYear = endDate.getUTCFullYear();

    let count = 0;
    for (let year = startYear; year <= endYear; year++) {
      // Bug 6 fix: Use mathematical leap year check for UTC consistency
      // (isLeapYear from date-fns uses local time which conflicts with getUTCFullYear above)
      if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        count++;
      }
    }

    return count;
  }

  /**
   * Format duration to human-readable string with appropriate units
   * Requirement: 5.2
   *
   * @param duration - The duration object to format
   * @returns Human-readable duration string
   */
  formatDuration(duration: Duration): string {
    const parts: string[] = [];

    // Check if everything is zero
    const isZero =
      duration.years === 0 &&
      duration.months === 0 &&
      duration.days === 0 &&
      duration.hours === 0 &&
      duration.minutes === 0;

    if (isZero) {
      return "0 minutes";
    }

    // For large time scales (years/months)
    if (duration.years > 0) {
      parts.push(`${duration.years} year${duration.years !== 1 ? "s" : ""}`);
    }

    if (duration.months > 0) {
      parts.push(`${duration.months} month${duration.months !== 1 ? "s" : ""}`);
    }

    if (duration.days > 0) {
      parts.push(`${duration.days} day${duration.days !== 1 ? "s" : ""}`);
    }

    // For smaller time scales, include hours and minutes if no years/months
    if (duration.years === 0 && duration.months === 0) {
      if (duration.hours > 0) {
        parts.push(`${duration.hours} hour${duration.hours !== 1 ? "s" : ""}`);
      }

      if (duration.minutes > 0) {
        parts.push(
          `${duration.minutes} minute${duration.minutes !== 1 ? "s" : ""}`,
        );
      }
    }

    // Return formatted string with comma separation
    if (parts.length === 0) {
      return "0 minutes";
    }

    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return parts.join(" and ");
    }

    // For 3+ parts, use commas and "and" for the last item
    const lastPart = parts.pop();
    return `${parts.join(", ")}, and ${lastPart}`;
  }

  /**
   * Validate date range (target date must be after start date)
   * Requirement: 1.3, 4.1, 4.4
   *
   * @param startDate - The start date
   * @param targetDate - The target date
   * @returns ValidationResult with any errors
   */
  validateDateRange(startDate: Date, targetDate: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isValid(startDate)) {
      errors.push({
        field: "startDate",
        message: "Start date is not a valid date",
        code: "INVALID_DATE_FORMAT",
      });
    }

    if (!isValid(targetDate)) {
      errors.push({
        field: "targetDate",
        message: "Target date is not a valid date",
        code: "INVALID_DATE_FORMAT",
      });
    }

    if (errors.length === 0 && !isAfter(targetDate, startDate)) {
      errors.push({
        field: "targetDate",
        message: "Target date must be after start date",
        code: "INVALID_DATE_RANGE",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate historical date (not more than maxYearsInPast in the past)
   * Requirement: 4.1, 4.4
   *
   * @param date - The date to validate
   * @param maxYearsInPast - Maximum years in the past (default: 10)
   * @returns ValidationResult with any errors
   */
  validateHistoricalDate(
    date: Date,
    maxYearsInPast: number = 10,
  ): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isValid(date)) {
      errors.push({
        field: "date",
        message: "Date is not a valid date",
        code: "INVALID_DATE_FORMAT",
      });
      return { isValid: false, errors };
    }

    const now = new Date();
    const minDate = addYears(now, -maxYearsInPast);

    if (isBefore(date, minDate)) {
      errors.push({
        field: "date",
        message: `Date cannot be more than ${maxYearsInPast} years in the past`,
        code: "HISTORICAL_LIMIT_EXCEEDED",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate future date (date must be in the future)
   * Requirement: 4.1, 4.4
   *
   * @param date - The date to validate
   * @returns ValidationResult with any errors
   */
  validateFutureDate(date: Date): ValidationResult {
    const errors: ValidationError[] = [];

    if (!isValid(date)) {
      errors.push({
        field: "date",
        message: "Date is not a valid date",
        code: "INVALID_DATE_FORMAT",
      });
      return { isValid: false, errors };
    }

    const now = new Date();

    if (!isAfter(date, now)) {
      errors.push({
        field: "date",
        message: "Date must be in the future",
        code: "FUTURE_START_DATE",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance for convenience
export const dateCalculator = new DateCalculator();
