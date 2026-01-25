/**
 * Unit tests for PerformanceController service
 * Tests calculation caching, visibility tracking, and performance optimizations
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgressCalculation } from "@/lib/types";
import {
  CalculationCacheImpl,
  cleanupPerformanceOptimizations,
  getCurrentMinute,
  PerformanceControllerImpl,
  VisibilityTrackerImpl,
} from "../PerformanceController";

class MockIntersectionObserver implements IntersectionObserver {
  static lastInstance: MockIntersectionObserver | null = null;
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  public callback: IntersectionObserverCallback;
  public options?: IntersectionObserverInit;
  public observe = vi.fn();
  public unobserve = vi.fn();
  public disconnect = vi.fn();
  public takeRecords = vi.fn(() => []);

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this.callback = callback;
    this.options = options;
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? "";
    this.thresholds = Array.isArray(options?.threshold)
      ? options?.threshold
      : typeof options?.threshold === "number"
        ? [options.threshold]
        : [];
    MockIntersectionObserver.lastInstance = this;
  }
}

// Mock requestAnimationFrame and cancelAnimationFrame
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

// Setup global mocks
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, "requestAnimationFrame", {
  writable: true,
  configurable: true,
  value: mockRequestAnimationFrame,
});

Object.defineProperty(global, "cancelAnimationFrame", {
  writable: true,
  configurable: true,
  value: mockCancelAnimationFrame,
});

describe("PerformanceController", () => {
  let mockCalculation: ProgressCalculation;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock requestAnimationFrame to NOT execute callback immediately
    // This allows us to test the batching behavior properly
    mockRequestAnimationFrame.mockImplementation((callback) => {
      // Store callback but don't execute immediately
      setTimeout(callback, 0);
      return 1;
    });

    mockCalculation = {
      currentValue: 25,
      targetValue: 100,
      percentage: 25,
      elapsedTime: {
        years: 0,
        months: 3,
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 90,
        totalHours: 2160,
        totalMinutes: 129600,
      },
      remainingTime: {
        years: 0,
        months: 9,
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 270,
        totalHours: 6480,
        totalMinutes: 388800,
      },
      dailyProgressRate: 1.11,
      isCompleted: false,
      isOverdue: false,
    };
  });

  afterEach(() => {
    cleanupPerformanceOptimizations();
  });

  describe("CalculationCacheImpl", () => {
    let cache: CalculationCacheImpl;

    beforeEach(() => {
      cache = new CalculationCacheImpl();
    });

    it("should store and retrieve calculations within the same minute", () => {
      const barId = "test-bar-1";
      const currentMinute = getCurrentMinute();

      cache.set(barId, currentMinute, mockCalculation);
      const retrieved = cache.get(barId, currentMinute);

      expect(retrieved).toEqual(mockCalculation);
      expect(retrieved).not.toBe(mockCalculation); // Should be a copy
    });

    it("should return null for expired cache entries", () => {
      const barId = "test-bar-1";
      const oldMinute = getCurrentMinute() - 1;
      const currentMinute = getCurrentMinute();

      cache.set(barId, oldMinute, mockCalculation);
      const retrieved = cache.get(barId, currentMinute);

      expect(retrieved).toBeNull();
    });

    it("should return null for non-existent entries", () => {
      const barId = "non-existent-bar";
      const currentMinute = getCurrentMinute();

      const retrieved = cache.get(barId, currentMinute);

      expect(retrieved).toBeNull();
    });

    it("should invalidate specific bar cache", () => {
      const barId = "test-bar-1";
      const currentMinute = getCurrentMinute();

      cache.set(barId, currentMinute, mockCalculation);
      cache.invalidate(barId);
      const retrieved = cache.get(barId, currentMinute);

      expect(retrieved).toBeNull();
    });

    it("should clear all cache entries", () => {
      const barId1 = "test-bar-1";
      const barId2 = "test-bar-2";
      const currentMinute = getCurrentMinute();

      cache.set(barId1, currentMinute, mockCalculation);
      cache.set(barId2, currentMinute, mockCalculation);

      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get(barId1, currentMinute)).toBeNull();
      expect(cache.get(barId2, currentMinute)).toBeNull();
    });

    it("should prevent cache from growing too large", () => {
      const currentMinute = getCurrentMinute();

      // Fill cache beyond max size (1000)
      for (let i = 0; i < 1001; i++) {
        cache.set(`bar-${i}`, currentMinute, mockCalculation);
      }

      // Cache should not exceed max size
      expect(cache.size()).toBeLessThanOrEqual(1000);
    });

    it("should handle mutations to cached objects", () => {
      const barId = "test-bar-1";
      const currentMinute = getCurrentMinute();
      const testCalculation = { ...mockCalculation, percentage: 50 };

      cache.set(barId, currentMinute, testCalculation);
      const retrieved = cache.get(barId, currentMinute);

      // Mutate retrieved object
      if (retrieved) {
        retrieved.percentage = 75;
      }

      // Original cached object should be unchanged
      const retrievedAgain = cache.get(barId, currentMinute);
      expect(retrievedAgain?.percentage).toBe(50);
    });
  });

  describe("VisibilityTrackerImpl", () => {
    let tracker: VisibilityTrackerImpl;
    let mockElement: HTMLElement;
    let mockObserver: MockIntersectionObserver;

    beforeEach(() => {
      tracker = new VisibilityTrackerImpl();
      mockElement = document.createElement("div");
      const latest = MockIntersectionObserver.lastInstance;
      if (!latest) {
        throw new Error("MockIntersectionObserver not initialized");
      }
      mockObserver = latest;
    });

    afterEach(() => {
      if (tracker) {
        tracker.cleanup();
      }
    });

    it("should observe elements and track visibility", () => {
      const barId = "test-bar-1";

      tracker.observe(barId, mockElement);

      expect(mockObserver.observe).toHaveBeenCalledWith(mockElement);
      expect(mockElement.getAttribute("data-bar-id")).toBe(barId);
    });

    it("should unobserve elements and clean up references", () => {
      const barId = "test-bar-1";

      tracker.observe(barId, mockElement);
      tracker.unobserve(barId);

      expect(mockObserver.unobserve).toHaveBeenCalledWith(mockElement);
      expect(tracker.isVisible(barId)).toBe(false);
    });

    it("should track visible bars correctly", () => {
      const barId1 = "test-bar-1";
      const barId2 = "test-bar-2";

      // Initially no bars are visible
      expect(tracker.getVisibleBars().size).toBe(0);

      // Simulate intersection observer callback
      mockObserver.callback(
        [
          { target: { getAttribute: () => barId1 }, isIntersecting: true },
          { target: { getAttribute: () => barId2 }, isIntersecting: false },
        ] as unknown as IntersectionObserverEntry[],
        mockObserver,
      );

      expect(tracker.isVisible(barId1)).toBe(true);
      expect(tracker.isVisible(barId2)).toBe(false);
      expect(tracker.getVisibleBars()).toEqual(new Set([barId1]));
    });

    it("should handle visibility change callbacks", () => {
      const callback = vi.fn();
      const barId = "test-bar-1";

      tracker.onVisibilityChange(callback);

      // Simulate intersection observer callback
      mockObserver.callback(
        [
          { target: { getAttribute: () => barId }, isIntersecting: true },
        ] as unknown as IntersectionObserverEntry[],
        mockObserver,
      );

      expect(callback).toHaveBeenCalledWith(barId, true);
    });

    it("should fallback gracefully when IntersectionObserver is not available", () => {
      // Temporarily remove IntersectionObserver
      const originalIO = window.IntersectionObserver;
      // @ts-expect-error
      delete window.IntersectionObserver;

      const fallbackTracker = new VisibilityTrackerImpl();
      const barId = "test-bar-1";

      fallbackTracker.observe(barId, mockElement);

      // Should assume all bars are visible as fallback
      expect(fallbackTracker.isVisible(barId)).toBe(true);

      // Restore IntersectionObserver
      window.IntersectionObserver = originalIO;
      fallbackTracker.cleanup();
    });

    it("should clean up properly", () => {
      const barId = "test-bar-1";

      tracker.observe(barId, mockElement);
      tracker.cleanup();

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(tracker.getVisibleBars().size).toBe(0);
      expect(tracker.isVisible(barId)).toBe(false);
    });
  });

  describe("PerformanceControllerImpl", () => {
    let controller: PerformanceControllerImpl;

    beforeEach(() => {
      controller = new PerformanceControllerImpl();
    });

    afterEach(() => {
      controller.cleanup();
    });

    it("should schedule single updates", async () => {
      const barId = "test-bar-1";
      const callback = vi.fn();

      controller.onBatchUpdate(callback);
      controller.scheduleUpdate(barId, mockCalculation);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledWith(
        new Map([[barId, mockCalculation]]),
      );
    });

    it("should batch multiple updates", async () => {
      const updates = new Map([
        ["bar-1", mockCalculation],
        ["bar-2", { ...mockCalculation, percentage: 75 }],
      ]);
      const callback = vi.fn();

      controller.onBatchUpdate(callback);
      controller.batchUpdate(updates);

      expect(mockRequestAnimationFrame).toHaveBeenCalled();

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledWith(updates);
    });

    it("should merge pending updates correctly", async () => {
      const barId = "test-bar-1";
      const callback = vi.fn();

      controller.onBatchUpdate(callback);

      // Schedule multiple updates for the same bar
      controller.scheduleUpdate(barId, mockCalculation);
      controller.scheduleUpdate(barId, { ...mockCalculation, percentage: 75 });

      // Should only call requestAnimationFrame once
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should use the latest update
      expect(callback).toHaveBeenCalledWith(
        new Map([[barId, { ...mockCalculation, percentage: 75 }]]),
      );
    });

    it("should handle callback errors gracefully", async () => {
      const errorCallback = vi.fn(() => {
        throw new Error("Test error");
      });
      const successCallback = vi.fn();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      controller.onBatchUpdate(errorCallback);
      controller.onBatchUpdate(successCallback);

      controller.scheduleUpdate("test-bar", mockCalculation);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in update callback:",
        expect.any(Error),
      );
      expect(successCallback).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should clean up properly", () => {
      const barId = "test-bar-1";

      controller.scheduleUpdate(barId, mockCalculation);

      controller.cleanup();

      expect(mockCancelAnimationFrame).toHaveBeenCalled();
      expect(controller.getPendingCount()).toBe(0);
    });

    it("should not flush empty updates", () => {
      const callback = vi.fn();

      controller.onBatchUpdate(callback);
      controller.flushUpdates();

      expect(callback).not.toHaveBeenCalled();
    });

    it("should track pending update count correctly", () => {
      expect(controller.getPendingCount()).toBe(0);

      controller.scheduleUpdate("bar-1", mockCalculation);
      controller.scheduleUpdate("bar-2", mockCalculation);

      // After scheduling, pending count should be tracked
      expect(controller.getPendingCount()).toBe(2);

      // Manually flush to clear pending updates
      controller.flushUpdates();
      expect(controller.getPendingCount()).toBe(0);
    });
  });

  describe("getCurrentMinute utility", () => {
    it("should return minute-level timestamp", () => {
      const date = new Date("2024-01-01T12:34:56.789Z");
      const minute = getCurrentMinute(date);

      // Should truncate to minute level
      const expected = Math.floor(date.getTime() / 60000);
      expect(minute).toBe(expected);
    });

    it("should use current time when no date provided", () => {
      const before = Math.floor(Date.now() / 60000);
      const minute = getCurrentMinute();
      const after = Math.floor(Date.now() / 60000);

      expect(minute).toBeGreaterThanOrEqual(before);
      expect(minute).toBeLessThanOrEqual(after);
    });

    it("should return same value for times within the same minute", () => {
      const date1 = new Date("2024-01-01T12:34:10.000Z");
      const date2 = new Date("2024-01-01T12:34:50.999Z");

      expect(getCurrentMinute(date1)).toBe(getCurrentMinute(date2));
    });

    it("should return different values for different minutes", () => {
      const date1 = new Date("2024-01-01T12:34:59.999Z");
      const date2 = new Date("2024-01-01T12:35:00.000Z");

      expect(getCurrentMinute(date1)).not.toBe(getCurrentMinute(date2));
    });
  });

  describe("cleanupPerformanceOptimizations", () => {
    it("should clean up all performance components", () => {
      // This is tested implicitly through the afterEach cleanup
      // The function should not throw errors and should clean up properly
      expect(() => cleanupPerformanceOptimizations()).not.toThrow();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle cache and visibility tracking together", async () => {
      const cache = new CalculationCacheImpl();

      // Create a fresh tracker for this test
      const testTracker = new VisibilityTrackerImpl();
      const controller = new PerformanceControllerImpl();

      const barId = "integration-test-bar";
      const currentMinute = getCurrentMinute();
      const mockElement = document.createElement("div");

      // Set up visibility tracking
      testTracker.observe(barId, mockElement);

      // Cache a calculation
      cache.set(barId, currentMinute, mockCalculation);

      // Schedule an update
      const callback = vi.fn();
      controller.onBatchUpdate(callback);
      controller.scheduleUpdate(barId, mockCalculation);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify everything works together
      expect(cache.get(barId, currentMinute)).toEqual(mockCalculation);
      expect(callback).toHaveBeenCalled();

      // Clean up
      testTracker.cleanup();
      controller.cleanup();
      cache.clear();
    });

    it("should handle performance optimization with multiple bars", async () => {
      const cache = new CalculationCacheImpl();
      const controller = new PerformanceControllerImpl();

      const currentMinute = getCurrentMinute();
      const bars = ["bar-1", "bar-2", "bar-3"];
      const calculations = bars.map((_, index) => ({
        ...mockCalculation,
        percentage: (index + 1) * 25,
      }));

      // Cache calculations for all bars
      bars.forEach((barId, index) => {
        cache.set(barId, currentMinute, calculations[index]);
      });

      // Batch update all bars
      const updates = new Map(
        bars.map((barId, index) => [barId, calculations[index]]),
      );
      const callback = vi.fn();

      controller.onBatchUpdate(callback);
      controller.batchUpdate(updates);

      // Wait for async callback
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify batch update
      expect(callback).toHaveBeenCalledWith(updates);

      // Verify all calculations are cached
      bars.forEach((barId, index) => {
        expect(cache.get(barId, currentMinute)).toEqual(calculations[index]);
      });

      // Clean up
      controller.cleanup();
      cache.clear();
    });
  });
});
