import { useEffect, useState } from "react";
import { dateCalculator } from "@/lib/services/DateCalculator";
import type { ProgressCalculation, TimeBasedProgressBar } from "@/lib/types";
import { useInterval } from "./useInterval";
import { useVisibilityChange } from "./useVisibilityChange";

const UPDATE_INTERVAL_MS = 60_000; // 1 minute

/**
 * Hook for managing time-based progress bar calculations with auto-updates
 *
 * Features:
 * - Client-side only calculation to avoid hydration mismatch
 * - Auto-updates every minute when tab is visible
 * - Pauses updates when tab is hidden to save resources
 * - Returns isStale=true initially until first client calculation
 *
 * Requirements: 6.1, 6.5
 *
 * @param bar - The time-based progress bar to track
 * @returns Object with progress calculation and hydration state
 */
export function useTimeBasedProgress(bar: TimeBasedProgressBar) {
  const [progress, setProgress] = useState<ProgressCalculation | null>(null);
  const { isVisible } = useVisibilityChange();

  // Calculate progress (client-side only to avoid hydration mismatch)
  const calculate = () => {
    const newProgress = dateCalculator.calculateProgress(bar, new Date());
    setProgress(newProgress);
  };

  // Initial calculation after hydration
  // Use .getTime() for stable primitives - Date objects create new references each render
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional deps for stable primitives
  useEffect(() => {
    calculate();
  }, [
    bar.id,
    bar.startDate.getTime(),
    bar.targetDate.getTime(),
    bar.timeBasedType,
  ]);

  // Auto-update every minute (paused when tab hidden)
  useInterval(calculate, isVisible ? UPDATE_INTERVAL_MS : null);

  return {
    progress,
    isStale: progress === null, // true initially until first client calculation
    refresh: calculate,
  };
}
