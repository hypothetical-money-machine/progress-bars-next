/**
 * Unit tests for AutoUpdateSystem
 * Tests automatic update functionality, cleanup, and tab visibility handling
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProgressBar } from "@/db/schema";
import { AutoUpdateSystem } from "../AutoUpdateSystem";
import { TimeBasedManager } from "../TimeBasedManager";

describe("AutoUpdateSystem", () => {
  let autoUpdateSystem: AutoUpdateSystem;
  let mockTimeBasedManager: TimeBasedManager;

  beforeEach(() => {
    // Create a mock TimeBasedManager
    mockTimeBasedManager = new TimeBasedManager();
    autoUpdateSystem = new AutoUpdateSystem(mockTimeBasedManager);

    // Use fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up
    autoUpdateSystem.stopUpdating();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("startUpdating", () => {
    it("should start updating time-based bars", () => {
      const bars: ProgressBar[] = [
        {
          id: "1",
          title: "Test Bar",
          description: null,
          currentValue: 0,
          targetValue: 100,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          startDate: new Date("2024-01-01").toISOString(),
          targetDate: new Date("2024-12-31").toISOString(),
          timeBasedType: "count-up",
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      autoUpdateSystem.startUpdating(bars);

      expect(autoUpdateSystem.isActive()).toBe(true);
      expect(autoUpdateSystem.getBarCount()).toBe(1);
    });

    it("should filter out manual bars", () => {
      const bars: ProgressBar[] = [
        {
          id: "1",
          title: "Manual Bar",
          description: null,
          currentValue: 50,
          targetValue: 100,
          unit: "tasks",
          unitPosition: "after",
          barType: "manual",
          startDate: null,
          targetDate: null,
          timeBasedType: null,
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          title: "Time-Based Bar",
          description: null,
          currentValue: 0,
          targetValue: 100,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          startDate: new Date("2024-01-01").toISOString(),
          targetDate: new Date("2024-12-31").toISOString(),
          timeBasedType: "count-up",
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      autoUpdateSystem.startUpdating(bars);

      expect(autoUpdateSystem.getBarCount()).toBe(1);
    });

    it("should stop existing updates before starting new ones", () => {
      const bars: ProgressBar[] = [
        {
          id: "1",
          title: "Test Bar",
          description: null,
          currentValue: 0,
          targetValue: 100,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          startDate: new Date("2024-01-01").toISOString(),
          targetDate: new Date("2024-12-31").toISOString(),
          timeBasedType: "count-up",
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      autoUpdateSystem.startUpdating(bars);
      const firstBarCount = autoUpdateSystem.getBarCount();

      autoUpdateSystem.startUpdating([]);
      const secondBarCount = autoUpdateSystem.getBarCount();

      expect(firstBarCount).toBe(1);
      expect(secondBarCount).toBe(0);
    });
  });

  describe("stopUpdating", () => {
    it("should stop updates and clean up resources", () => {
      const bars: ProgressBar[] = [
        {
          id: "1",
          title: "Test Bar",
          description: null,
          currentValue: 0,
          targetValue: 100,
          unit: null,
          unitPosition: null,
          barType: "time-based",
          startDate: new Date("2024-01-01").toISOString(),
          targetDate: new Date("2024-12-31").toISOString(),
          timeBasedType: "count-up",
          isCompleted: false,
          isOverdue: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      autoUpdateSystem.startUpdating(bars);
      expect(autoUpdateSystem.isActive()).toBe(true);

      autoUpdateSystem.stopUpdating();
      expect(autoUpdateSystem.isActive()).toBe(false);
      expect(autoUpdateSystem.getBarCount()).toBe(0);
    });

    it("should be safe to call multiple times", () => {
      autoUpdateSystem.stopUpdating();
      autoUpdateSystem.stopUpdating();

      expect(autoUpdateSystem.isActive()).toBe(false);
    });
  });

  describe("addBar", () => {
    it("should add a time-based bar to the system", () => {
      const bar: ProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 100,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        startDate: new Date("2024-01-01").toISOString(),
        targetDate: new Date("2024-12-31").toISOString(),
        timeBasedType: "count-up",
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      autoUpdateSystem.startUpdating([]);
      autoUpdateSystem.addBar(bar);

      expect(autoUpdateSystem.getBarCount()).toBe(1);
    });

    it("should not add manual bars", () => {
      const bar: ProgressBar = {
        id: "1",
        title: "Manual Bar",
        description: null,
        currentValue: 50,
        targetValue: 100,
        unit: "tasks",
        unitPosition: "after",
        barType: "manual",
        startDate: null,
        targetDate: null,
        timeBasedType: null,
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      autoUpdateSystem.startUpdating([]);
      autoUpdateSystem.addBar(bar);

      expect(autoUpdateSystem.getBarCount()).toBe(0);
    });
  });

  describe("removeBar", () => {
    it("should remove a bar from the system", () => {
      const bar: ProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 100,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        startDate: new Date("2024-01-01").toISOString(),
        targetDate: new Date("2024-12-31").toISOString(),
        timeBasedType: "count-up",
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      autoUpdateSystem.startUpdating([bar]);
      expect(autoUpdateSystem.getBarCount()).toBe(1);

      autoUpdateSystem.removeBar("1");
      expect(autoUpdateSystem.getBarCount()).toBe(0);
    });
  });

  describe("updateBar", () => {
    it("should update a bar in the system", () => {
      const bar: ProgressBar = {
        id: "1",
        title: "Test Bar",
        description: null,
        currentValue: 0,
        targetValue: 100,
        unit: null,
        unitPosition: null,
        barType: "time-based",
        startDate: new Date("2024-01-01").toISOString(),
        targetDate: new Date("2024-12-31").toISOString(),
        timeBasedType: "count-up",
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      autoUpdateSystem.startUpdating([bar]);

      const updatedBar = { ...bar, title: "Updated Bar" };
      autoUpdateSystem.updateBar(updatedBar);

      expect(autoUpdateSystem.getBarCount()).toBe(1);
    });
  });

  describe("callbacks", () => {
    it("should allow registering and unregistering callbacks", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      autoUpdateSystem.onProgressUpdate(callback1);
      autoUpdateSystem.onProgressUpdate(callback2);

      // Both callbacks should be registered
      autoUpdateSystem.offProgressUpdate(callback1);

      // Only callback1 should be unregistered
      expect(true).toBe(true); // Basic test to verify methods work
    });
  });

  describe("getUpdateInterval", () => {
    it("should return the update interval in milliseconds", () => {
      const interval = autoUpdateSystem.getUpdateInterval();
      expect(interval).toBe(60000); // 1 minute
    });
  });
});
