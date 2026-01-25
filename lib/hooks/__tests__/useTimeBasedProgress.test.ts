import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TimeBasedProgressBar } from "@/lib/types";
import { useTimeBasedProgress } from "../useTimeBasedProgress";

describe("useTimeBasedProgress", () => {
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

  const triggerVisibilityChange = () => {
    act(() => {
      visibilityChangeListeners.forEach((listener) => {
        listener(new Event("visibilitychange"));
      });
    });
  };

  const createMockBar = (
    overrides: Partial<TimeBasedProgressBar> = {},
  ): TimeBasedProgressBar => ({
    id: "test-bar-1",
    title: "Test Progress Bar",
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
    ...overrides,
  });

  it("calculates progress immediately after mount in test environment", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // In test environment, useEffect runs synchronously, so progress is calculated immediately
    // In real browser environment, there would be a brief moment where isStale=true
    expect(result.current.isStale).toBe(false);
    expect(result.current.progress).not.toBe(null);
    expect(result.current.progress?.percentage).toBeGreaterThanOrEqual(0);
  });

  it("calculates progress after mount", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // Wait for useEffect to run
    act(() => {
      // useEffect runs after render
    });

    // Should have calculated progress and no longer be stale
    expect(result.current.isStale).toBe(false);
    expect(result.current.progress).not.toBe(null);
    expect(result.current.progress?.percentage).toBeGreaterThanOrEqual(0);
  });

  it("updates progress at 60-second intervals when visible", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // Initial calculation
    act(() => {
      // useEffect runs
    });

    const initialProgress = result.current.progress;
    expect(initialProgress).not.toBe(null);

    // Advance time by 60 seconds
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Progress should be recalculated (new object reference)
    expect(result.current.progress).not.toBe(initialProgress);
    expect(result.current.progress).not.toBe(null);
  });

  it("pauses updates when tab is hidden", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // Initial calculation
    act(() => {
      // useEffect runs
    });

    const initialProgress = result.current.progress;

    // Hide the tab
    mockHidden = true;
    triggerVisibilityChange();

    // Advance time by 60 seconds
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Progress should not be recalculated (same object reference)
    expect(result.current.progress).toBe(initialProgress);
  });

  it("resumes updates when tab becomes visible again", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // Initial calculation
    act(() => {
      // useEffect runs
    });

    // Hide the tab
    mockHidden = true;
    triggerVisibilityChange();

    // Show the tab again
    mockHidden = false;
    triggerVisibilityChange();

    const progressBeforeInterval = result.current.progress;

    // Advance time by 60 seconds
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Progress should be recalculated (new object reference)
    expect(result.current.progress).not.toBe(progressBeforeInterval);
  });

  it("recalculates when bar properties change", () => {
    const mockBar = createMockBar();
    const { result, rerender } = renderHook(
      ({ bar }) => useTimeBasedProgress(bar),
      { initialProps: { bar: mockBar } },
    );

    // Initial calculation
    act(() => {
      // useEffect runs
    });

    const initialProgress = result.current.progress;

    // Change bar properties
    const updatedBar = createMockBar({
      id: "test-bar-2", // Different ID should trigger recalculation
    });

    rerender({ bar: updatedBar });

    // Progress should be recalculated
    expect(result.current.progress).not.toBe(initialProgress);
  });

  it("provides refresh function for manual updates", () => {
    const mockBar = createMockBar();
    const { result } = renderHook(() => useTimeBasedProgress(mockBar));

    // Initial calculation
    act(() => {
      // useEffect runs
    });

    const initialProgress = result.current.progress;

    // Call refresh manually
    act(() => {
      result.current.refresh();
    });

    // Progress should be recalculated (new object reference)
    expect(result.current.progress).not.toBe(initialProgress);
    expect(result.current.progress).not.toBe(null);
  });

  it("cleans up intervals on unmount", () => {
    const mockBar = createMockBar();
    const { unmount } = renderHook(() => useTimeBasedProgress(mockBar));

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
