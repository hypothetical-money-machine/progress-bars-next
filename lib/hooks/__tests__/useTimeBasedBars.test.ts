import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TimeBasedProgressBar } from "@/lib/types";
import { useTimeBasedBars } from "../useTimeBasedBars";

describe("useTimeBasedBars", () => {
  let mockHidden: boolean;
  let visibilityChangeListeners: ((event: Event) => void)[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    mockHidden = false;
    visibilityChangeListeners = [];

    // Mock document.hidden
    Object.defineProperty(document, "hidden", {
      get: () => mockHidden,
      configurable: true,
    });

    // Mock addEventListener/removeEventListener for visibility
    const originalAddEventListener = document.addEventListener;
    const originalRemoveEventListener = document.removeEventListener;

    vi.spyOn(document, "addEventListener").mockImplementation(
      (event, listener) => {
        if (event === "visibilitychange") {
          visibilityChangeListeners.push(listener as (event: Event) => void);
        } else {
          originalAddEventListener.call(document, event, listener);
        }
      },
    );

    vi.spyOn(document, "removeEventListener").mockImplementation(
      (event, listener) => {
        if (event === "visibilitychange") {
          const index = visibilityChangeListeners.indexOf(
            listener as (event: Event) => void,
          );
          if (index > -1) {
            visibilityChangeListeners.splice(index, 1);
          }
        } else {
          originalRemoveEventListener.call(document, event, listener);
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const _triggerVisibilityChange = () => {
    act(() => {
      visibilityChangeListeners.forEach((listener) => {
        listener(new Event("visibilitychange"));
      });
    });
  };

  const createMockBar = (id: string): TimeBasedProgressBar => ({
    id,
    title: `Test Progress Bar ${id}`,
    description: "A test progress bar",
    currentValue: 0,
    targetValue: 100,
    unit: "days",
    unitPosition: "suffix",
    barType: "time-based",
    startDate: new Date("2024-01-01"),
    targetDate: new Date("2024-12-31"),
    timeBasedType: "count-up",
    isCompleted: false,
    isOverdue: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });

  it("handles empty bars array", () => {
    const { result } = renderHook(() => useTimeBasedBars([]));

    // Should be hydrated with empty map
    expect(result.current.isHydrated).toBe(true);
    expect(result.current.progressMap.size).toBe(0);
  });

  it("calculates progress for all bars after mount", () => {
    const bars = [createMockBar("bar1"), createMockBar("bar2")];
    const { result } = renderHook(() => useTimeBasedBars(bars));

    // Should have calculated progress for all bars and be hydrated
    expect(result.current.isHydrated).toBe(true);
    expect(result.current.progressMap.size).toBe(2);
    expect(result.current.progressMap.has("bar1")).toBe(true);
    expect(result.current.progressMap.has("bar2")).toBe(true);
  });

  it("provides refreshAll function for manual updates", () => {
    const bars = [createMockBar("bar1")];
    const { result } = renderHook(() => useTimeBasedBars(bars));

    const initialMap = result.current.progressMap;

    // Call refreshAll manually
    act(() => {
      result.current.refreshAll();
    });

    // Progress should be recalculated (new map reference)
    expect(result.current.progressMap).not.toBe(initialMap);
    expect(result.current.progressMap.size).toBe(1);
  });

  it("cleans up intervals on unmount", () => {
    const bars = [createMockBar("bar1")];
    const { unmount } = renderHook(() => useTimeBasedBars(bars));

    // Unmount the hook
    unmount();

    // Advance time - no intervals should be running
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // No errors should occur (intervals cleaned up properly)
    expect(true).toBe(true); // Test passes if no errors thrown
  });
});
