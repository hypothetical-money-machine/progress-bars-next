"use client";

import { useTransition } from "react";
import { deleteProgressBar, updateProgress } from "@/app/actions";
import type { ProgressBar as ProgressBarType } from "@/db/schema";
import { useTimeBasedProgress } from "@/lib/hooks/useTimeBasedProgress";
import { dateCalculator } from "@/lib/services/DateCalculator";
import type { TimeBasedProgressBar } from "@/lib/types";
import { ProgressStatistics } from "./ProgressStatistics";

const colors = [
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-green-500 to-emerald-500",
  "from-yellow-500 to-orange-500",
  "from-red-500 to-pink-500",
];

function getColorFromId(id: string) {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatValue(
  value: number,
  unit?: string | null,
  position?: string | null,
) {
  const num = value.toLocaleString();
  if (!unit) return num;
  return position === "prefix" ? `${unit}${num}` : `${num} ${unit}`;
}

function isTimeBasedBar(bar: ProgressBarType): bar is ProgressBarType & {
  barType: "time-based";
  startDate: string;
  targetDate: string;
  timeBasedType: "count-up" | "count-down" | "arrival-date";
} {
  return (
    bar.barType === "time-based" &&
    bar.startDate !== null &&
    bar.targetDate !== null &&
    bar.timeBasedType !== null
  );
}

function TimeBasedBadge({ type }: { type: string }) {
  const badgeText =
    {
      "count-up": "Count-Up",
      "count-down": "Count-Down",
      "arrival-date": "Arrival Date",
    }[type] || "Time-Based";

  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
      {badgeText}
    </span>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type TimeBasedBar = ProgressBarType & {
  barType: "time-based";
  startDate: string;
  targetDate: string;
  timeBasedType: "count-up" | "count-down" | "arrival-date";
};

function TimeBasedProgressBarCard({
  bar,
  colorClass,
  isPending,
  onDelete,
}: {
  bar: TimeBasedBar;
  colorClass: string;
  isPending: boolean;
  onDelete: () => void;
}) {
  const timeBasedBar: TimeBasedProgressBar = {
    ...bar,
    startDate: new Date(bar.startDate),
    targetDate: new Date(bar.targetDate),
    timeBasedType: bar.timeBasedType as
      | "count-up"
      | "count-down"
      | "arrival-date",
    isCompleted: bar.isCompleted,
    isOverdue: bar.isOverdue,
  };

  const { progress, isStale } = useTimeBasedProgress(timeBasedBar);

  // Show skeleton while loading
  if (isStale || !progress) {
    return (
      <div
        className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-900 ${isPending ? "opacity-50" : ""}`}
      >
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {bar.title}
              </h3>
              <TimeBasedBadge type={bar.timeBasedType || "time-based"} />
            </div>
            {bar.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {bar.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="text-zinc-400 transition-colors hover:text-red-500"
            aria-label="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-2 h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-full w-0 rounded-full bg-gradient-to-r bg-zinc-300 dark:bg-zinc-600 animate-pulse" />
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading progress...
        </div>
      </div>
    );
  }

  const percentage = progress.percentage;
  const isCompleted = progress.isCompleted;
  const isOverdue = progress.isOverdue;

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-900 ${isPending ? "opacity-50" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {bar.title}
            </h3>
            <TimeBasedBadge type={bar.timeBasedType || "time-based"} />
            {isCompleted && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Completed
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                Overdue
              </span>
            )}
          </div>
          {bar.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {bar.description}
            </p>
          )}
          {/* Show start date for historical dates */}
          {new Date(bar.startDate) < new Date() && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Started: {formatDate(bar.startDate)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-zinc-400 transition-colors hover:text-red-500"
          aria-label="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mb-2 h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Time-based statistics */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {Math.round(percentage)}% Complete
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {dateCalculator.formatDuration(progress.elapsedTime)} elapsed
          </span>
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              {dateCalculator.formatDuration(progress.remainingTime)} remaining
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {progress.dailyProgressRate.toFixed(2)}% per day
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Target: {formatDate(bar.targetDate)}</span>
          {progress.estimatedCompletionDate && !isCompleted && (
            <span>
              Est. completion:{" "}
              {formatDate(progress.estimatedCompletionDate.toISOString())}
            </span>
          )}
        </div>
      </div>

      {/* Detailed Progress Statistics */}
      <div className="mt-3">
        <ProgressStatistics
          progress={progress}
          targetDate={new Date(bar.targetDate)}
          timeBasedType={
            bar.timeBasedType as "count-up" | "count-down" | "arrival-date"
          }
        />
      </div>
    </div>
  );
}

export function ProgressBar({ bar }: { bar: ProgressBarType }) {
  const [isPending, startTransition] = useTransition();
  const colorClass = getColorFromId(bar.id);

  // Handle time-based progress bars
  if (isTimeBasedBar(bar)) {
    const handleDelete = () => {
      startTransition(() => {
        deleteProgressBar(bar.id);
      });
    };

    return (
      <TimeBasedProgressBarCard
        bar={bar}
        colorClass={colorClass}
        isPending={isPending}
        onDelete={handleDelete}
      />
    );
  }

  // Handle manual progress bars (existing functionality)
  const percentage = Math.min((bar.currentValue / bar.targetValue) * 100, 100);
  const displayUnit = bar.unit ?? "items";
  const displayUnitPosition = bar.unitPosition ?? "suffix";

  const handleIncrement = () => {
    startTransition(() => {
      updateProgress(bar.id, Math.min(bar.currentValue + 1, bar.targetValue));
    });
  };

  const handleDecrement = () => {
    startTransition(() => {
      updateProgress(bar.id, Math.max(bar.currentValue - 1, 0));
    });
  };

  const handleDelete = () => {
    startTransition(() => {
      deleteProgressBar(bar.id);
    });
  };

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-900 ${isPending ? "opacity-50" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {bar.title}
            </h3>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Manual
            </span>
          </div>
          {bar.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {bar.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="text-zinc-400 transition-colors hover:text-red-500"
          aria-label="Delete"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mb-2 h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {formatValue(bar.currentValue, displayUnit, displayUnitPosition)} /{" "}
          {formatValue(bar.targetValue, displayUnit, displayUnitPosition)}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={bar.currentValue <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={bar.currentValue >= bar.targetValue}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 font-bold text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
