"use client";

import { dateCalculator } from "@/lib/services/DateCalculator";
import type { ProgressCalculation } from "@/lib/types";

interface ProgressStatisticsProps {
  progress: ProgressCalculation;
  targetDate: Date;
  timeBasedType: "count-up" | "count-down" | "arrival-date";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProgressStatistics({
  progress,
  targetDate,
  timeBasedType,
}: ProgressStatisticsProps) {
  const {
    elapsedTime,
    remainingTime,
    percentage,
    dailyProgressRate,
    estimatedCompletionDate,
    isCompleted,
    isOverdue,
  } = progress;

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Progress Statistics
      </h4>

      {/* Completion Percentage with Visual Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Completion
          </span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted
                ? "bg-green-500"
                : isOverdue
                  ? "bg-red-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Elapsed Time */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Elapsed Time
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {dateCalculator.formatDuration(elapsedTime)}
        </span>
      </div>

      {/* Remaining Time */}
      {!isCompleted && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Remaining Time
          </span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {dateCalculator.formatDuration(remainingTime)}
          </span>
        </div>
      )}

      {/* Daily Progress Rate */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Daily Progress Rate
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {dailyProgressRate.toFixed(2)}% per day
        </span>
      </div>

      {/* Target Date */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {timeBasedType === "arrival-date" ? "Arrival Date" : "Target Date"}
        </span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formatDate(targetDate)}
        </span>
      </div>

      {/* Estimated Completion Date for Count-Up Bars */}
      {timeBasedType === "count-up" &&
        estimatedCompletionDate &&
        !isCompleted && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Estimated Completion
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {formatDate(estimatedCompletionDate)}
            </span>
          </div>
        )}

      {/* Status Indicators */}
      {isCompleted && (
        <div className="flex items-center gap-2 rounded-md bg-green-100 px-2 py-1 dark:bg-green-900">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Completed
          </span>
        </div>
      )}

      {isOverdue && (
        <div className="flex items-center gap-2 rounded-md bg-red-100 px-2 py-1 dark:bg-red-900">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            Overdue
          </span>
        </div>
      )}
    </div>
  );
}
