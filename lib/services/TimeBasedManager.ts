/**
 * TimeBasedManager Service
 * Manages time-based progress bars including creation, calculation, and status updates
 * Requirements: 2.5, 3.4, 3.5
 */

import { isValid } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { ProgressBar } from "@/db/schema";
import { progressBars } from "@/db/schema";
import type {
  ProgressCalculation,
  TimeBasedBarConfig,
  TimeBasedProgressBar,
  ValidationResult,
} from "@/lib/types";
import { DateCalculator } from "./DateCalculator";

/**
 * TimeBasedManager class provides management services for time-based progress bars
 */
export class TimeBasedManager {
  private dateCalculator: DateCalculator;

  constructor(dateCalculator?: DateCalculator) {
    this.dateCalculator = dateCalculator || new DateCalculator();
  }

  /**
   * Create a new time-based progress bar
   * Requirements: 2.5
   *
   * @param config - Configuration for the time-based bar
   * @returns The created time-based progress bar
   * @throws Error if validation fails
   */
  async createTimeBasedBar(
    config: TimeBasedBarConfig,
  ): Promise<TimeBasedProgressBar> {
    // Validate dates based on bar type
    const validation = this.validateBarConfig(config);

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => e.message).join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Generate unique ID
    const id = crypto.randomUUID();
    const now = new Date();

    // Calculate initial progress to determine completion status
    const initialProgress = this.dateCalculator.calculateProgress(
      {
        id,
        title: config.title,
        description: config.description || null,
        barType: "time-based",
        startDate: config.startDate,
        targetDate: config.targetDate,
        timeBasedType: config.timeBasedType,
        isCompleted: false,
        isOverdue: false,
        currentValue: 0,
        targetValue: 0,
        unit: null,
        unitPosition: null,
        createdAt: now,
        updatedAt: now,
      },
      now,
    );

    // Insert into database
    await db.insert(progressBars).values({
      id,
      title: config.title,
      description: config.description || null,
      currentValue: initialProgress.currentValue,
      targetValue: initialProgress.targetValue,
      unit: null,
      unitPosition: null,
      barType: "time-based",
      startDate: config.startDate.toISOString(),
      targetDate: config.targetDate.toISOString(),
      timeBasedType: config.timeBasedType,
      isCompleted: initialProgress.isCompleted,
      isOverdue: initialProgress.isOverdue,
      createdAt: now,
      updatedAt: now,
    });

    // Return the created bar
    return {
      id,
      title: config.title,
      description: config.description || null,
      currentValue: initialProgress.currentValue,
      targetValue: initialProgress.targetValue,
      unit: null,
      unitPosition: null,
      barType: "time-based",
      startDate: config.startDate,
      targetDate: config.targetDate,
      timeBasedType: config.timeBasedType,
      isCompleted: initialProgress.isCompleted,
      isOverdue: initialProgress.isOverdue,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Validate time-based bar configuration
   *
   * @param config - Configuration to validate
   * @returns ValidationResult with any errors
   */
  private validateBarConfig(config: TimeBasedBarConfig): ValidationResult {
    const errors = [];

    // Bug 5 fix: Early isValid() checks to prevent .toISOString() errors on invalid dates
    if (!isValid(config.startDate)) {
      errors.push({
        field: "startDate",
        message: "Start date is not a valid date",
        code: "INVALID_DATE_FORMAT" as const,
      });
    }

    if (!isValid(config.targetDate)) {
      errors.push({
        field: "targetDate",
        message: "Target date is not a valid date",
        code: "INVALID_DATE_FORMAT" as const,
      });
    }

    // Return early if dates are invalid to prevent downstream errors
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate date range (target must be after start)
    const rangeValidation = this.dateCalculator.validateDateRange(
      config.startDate,
      config.targetDate,
    );
    errors.push(...rangeValidation.errors);

    // Bug 3 fix: Validate time scale (50-year limit)
    const scaleValidation = this.dateCalculator.validateTimeScale(
      config.startDate,
      config.targetDate,
    );
    errors.push(...scaleValidation.errors);

    // Type-specific validation
    switch (config.timeBasedType) {
      case "count-up": {
        // Start date should be in the past (historical)
        const now = new Date();
        if (config.startDate > now) {
          errors.push({
            field: "startDate",
            message: "Count-up bars require a start date in the past",
            code: "FUTURE_START_DATE" as const,
          });
        }

        // Validate historical limit (10 years)
        const historicalValidation = this.dateCalculator.validateHistoricalDate(
          config.startDate,
          10,
        );
        errors.push(...historicalValidation.errors);

        // Bug 4 fix: Target date must be in the future for count-up bars (Req 1.2)
        const targetFutureValidation = this.dateCalculator.validateFutureDate(
          config.targetDate,
        );
        errors.push(...targetFutureValidation.errors);
        break;
      }

      case "count-down": {
        // Target date must be in the future
        const futureValidation = this.dateCalculator.validateFutureDate(
          config.targetDate,
        );
        errors.push(...futureValidation.errors);
        break;
      }

      case "arrival-date": {
        // Both dates can be flexible, but target must be after start
        // Range validation already covers this
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate current progress for a time-based bar
   * Requirements: 2.5, 3.4
   *
   * @param bar - The progress bar (can be manual or time-based)
   * @returns ProgressCalculation with current values
   */
  calculateCurrentProgress(bar: ProgressBar): ProgressCalculation {
    // Check if this is a time-based bar
    if (
      bar.barType !== "time-based" ||
      !bar.startDate ||
      !bar.targetDate ||
      !bar.timeBasedType
    ) {
      throw new Error("Bar is not a time-based progress bar");
    }

    // Parse dates from ISO strings
    const startDate = new Date(bar.startDate);
    const targetDate = new Date(bar.targetDate);

    // Create TimeBasedProgressBar object
    const timeBasedBar: TimeBasedProgressBar = {
      ...bar,
      barType: "time-based",
      startDate,
      targetDate,
      timeBasedType: bar.timeBasedType as
        | "count-up"
        | "count-down"
        | "arrival-date",
      isCompleted: bar.isCompleted,
      isOverdue: bar.isOverdue,
    };

    // Calculate progress using DateCalculator
    return this.dateCalculator.calculateProgress(timeBasedBar);
  }

  /**
   * Update completion status for a time-based bar
   * Requirements: 3.4, 3.5
   *
   * @param bar - The progress bar to update
   * @returns Updated progress bar with new completion status
   */
  async updateCompletionStatus(bar: ProgressBar): Promise<ProgressBar> {
    // Check if this is a time-based bar
    if (
      bar.barType !== "time-based" ||
      !bar.startDate ||
      !bar.targetDate ||
      !bar.timeBasedType
    ) {
      throw new Error("Bar is not a time-based progress bar");
    }

    // Calculate current progress
    const progress = this.calculateCurrentProgress(bar);

    // Update database if status changed
    if (
      progress.isCompleted !== bar.isCompleted ||
      progress.isOverdue !== bar.isOverdue
    ) {
      await db
        .update(progressBars)
        .set({
          isCompleted: progress.isCompleted,
          isOverdue: progress.isOverdue,
          currentValue: progress.currentValue,
          targetValue: progress.targetValue,
          updatedAt: new Date(),
        })
        .where(eq(progressBars.id, bar.id));

      // Return updated bar
      return {
        ...bar,
        isCompleted: progress.isCompleted,
        isOverdue: progress.isOverdue,
        currentValue: progress.currentValue,
        targetValue: progress.targetValue,
        updatedAt: new Date(),
      };
    }

    return bar;
  }

  /**
   * Get all time-based progress bars from database
   * Requirements: 2.5, 3.5
   *
   * @returns Array of time-based progress bars
   */
  async getAllTimeBasedBars(): Promise<ProgressBar[]> {
    const allBars = await db.select().from(progressBars).all();

    // Filter only time-based bars
    return allBars.filter((bar) => bar.barType === "time-based");
  }

  /**
   * Convert a database ProgressBar to TimeBasedProgressBar
   * Helper method for type conversion
   *
   * @param bar - Database progress bar
   * @returns TimeBasedProgressBar with parsed dates
   */
  toTimeBasedProgressBar(bar: ProgressBar): TimeBasedProgressBar | null {
    if (
      bar.barType !== "time-based" ||
      !bar.startDate ||
      !bar.targetDate ||
      !bar.timeBasedType
    ) {
      return null;
    }

    return {
      ...bar,
      description: bar.description || null,
      barType: "time-based",
      startDate: new Date(bar.startDate),
      targetDate: new Date(bar.targetDate),
      timeBasedType: bar.timeBasedType as
        | "count-up"
        | "count-down"
        | "arrival-date",
      isCompleted: bar.isCompleted,
      isOverdue: bar.isOverdue,
    };
  }
}

// Export singleton instance for convenience
export const timeBasedManager = new TimeBasedManager();
