import { useEffect, useMemo, useState } from "react";
import { dateCalculator } from "@/lib/services/DateCalculator";
import type { ProgressCalculation, TimeBasedProgressBar } from "@/lib/types";
import { useInterval } from "./useInterval";
import { useVisibilityChange } from "./useVisibilityChange";

const UPDATE_INTERVAL_MS = 60_000; // 1 minute

/**
 * Hook for managing multiple time-based progress bars with batch updates
 *
 * Features:
 * - Batch calculate all progress values in single interval callback
 * - Use Map<string, ProgressCalculation> for O(1) lookups
 * - Set isHydrated=true after first client-side calculation
 * - Pauses updates when tab is hidden to save resources
 *
 * Requirements: 6.4
 *
 * @param bars - Array of time-based progress bars to track
 * @returns Object with progress map and hydration state
 */
export function useTimeBasedBars(bars: TimeBasedProgressBar[]) {
  const [progressMap, setProgressMap] = useState<
    Map<string, ProgressCalculation>
  >(new Map());
  const [isHydrated, setIsHydrated] = useState(false);
  const { isVisible } = useVisibilityChange();

  // Create a stable key for the bars array to avoid infinite re-renders
  const barsKey = useMemo(() => {
    return bars
      .map(
        (bar) =>
          `${bar.id}-${bar.startDate.getTime()}-${bar.targetDate.getTime()}`,
      )
      .join(",");
  }, [bars]);

  // Batch calculate all progress values
  const calculateAll = () => {
    const now = new Date();
    const newMap = new Map<string, ProgressCalculation>();

    for (const bar of bars) {
      const progress = dateCalculator.calculateProgress(bar, now);
      newMap.set(bar.id, progress);
    }

    setProgressMap(newMap);
    setIsHydrated(true);
  };

  // Initial calculation after hydration
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional deps for stable primitives
  useEffect(() => {
    if (bars.length > 0) {
      calculateAll();
    } else {
      // Clear map if no bars
      setProgressMap(new Map());
      setIsHydrated(true);
    }
  }, [barsKey]); // Use stable key instead of bars array

  // Batch update all bars every minute (paused when tab hidden)
  useInterval(
    calculateAll,
    isVisible && bars.length > 0 ? UPDATE_INTERVAL_MS : null,
  );

  return {
    progressMap,
    isHydrated,
    refreshAll: calculateAll,
  };
}
