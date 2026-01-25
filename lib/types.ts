/**
 * Type definitions for time-based progress bars
 * Requirement 8.2: TypeScript data models for time-based progress tracking
 */

import type { ProgressBar } from "@/db/schema";

/**
 * Time-based progress bar with parsed date fields
 * Extends the base ProgressBar type with time-based specific fields
 */
export interface TimeBasedProgressBar
  extends Omit<ProgressBar, "startDate" | "targetDate"> {
  barType: "time-based";
  startDate: Date;
  targetDate: Date;
  timeBasedType: "count-up" | "count-down" | "arrival-date";
  isCompleted: boolean;
  isOverdue: boolean;
}

/**
 * Duration representation for time-based calculations
 * Provides multiple granularities for flexible display
 */
export interface Duration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
}

/**
 * Progress calculation result for time-based bars
 * Contains all computed values needed for display and updates
 */
export interface ProgressCalculation {
  currentValue: number;
  targetValue: number;
  percentage: number;
  elapsedTime: Duration;
  remainingTime: Duration;
  dailyProgressRate: number;
  estimatedCompletionDate?: Date;
  isCompleted: boolean;
  isOverdue: boolean;
}

/**
 * Progress statistics for detailed display
 * Provides human-readable progress information
 */
export interface ProgressStatistics {
  elapsedTime: Duration;
  remainingTime: Duration;
  completionPercentage: number;
  dailyProgressRate: number;
  estimatedCompletion?: Date;
  timeUntilCompletion?: Duration;
}

/**
 * Configuration for creating time-based progress bars
 * Used in form inputs and bar creation
 */
export interface TimeBasedBarConfig {
  title: string;
  description?: string;
  timeBasedType: "count-up" | "count-down" | "arrival-date";
  startDate: Date;
  targetDate: Date;
}

/**
 * Validation error codes for date validation
 */
export type ValidationErrorCode =
  | "INVALID_DATE_RANGE"
  | "HISTORICAL_LIMIT_EXCEEDED"
  | "FUTURE_START_DATE"
  | "INVALID_DATE_FORMAT";

/**
 * Validation error with field and message
 */
export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

/**
 * Result of validation operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
