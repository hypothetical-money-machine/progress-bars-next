"use client";

import { useTransition } from "react";
import { deleteProgressBar, updateProgress } from "@/app/actions";
import type { ProgressBar as ProgressBarType } from "@/db/schema";

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

export function ProgressBar({ bar }: { bar: ProgressBarType }) {
  const [isPending, startTransition] = useTransition();
  const percentage = Math.min((bar.currentValue / bar.targetValue) * 100, 100);
  const colorClass = getColorFromId(bar.id);

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
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {bar.title}
          </h3>
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
          {formatValue(bar.currentValue, bar.unit, bar.unitPosition)} /{" "}
          {formatValue(bar.targetValue, bar.unit, bar.unitPosition)}
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
