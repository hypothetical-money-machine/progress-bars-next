import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInterval } from "../useInterval";

describe("useInterval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls callback at specified interval", () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("pauses when delay is null", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 as number | null } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ delay: null });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1, paused
  });

  it("cleans up on unmount", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("updates callback without restarting interval", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(
      ({ callback }) => useInterval(callback, 1000),
      { initialProps: { callback: callback1 } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback1).toHaveBeenCalledTimes(1);

    // Update callback
    rerender({ callback: callback2 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // New callback should be called, old one should not be called again
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledTimes(1); // Still only called once
  });

  it("restarts interval when delay changes", () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 } },
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(callback).not.toHaveBeenCalled();

    // Change delay - should restart interval
    rerender({ delay: 2000 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).not.toHaveBeenCalled(); // Still waiting for 2000ms

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
