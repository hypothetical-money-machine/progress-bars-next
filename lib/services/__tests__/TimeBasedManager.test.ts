/**
 * Unit tests for TimeBasedManager service
 * Tests basic functionality of time-based progress bar management
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { progressBars } from "@/db/schema";
import { TimeBasedManager } from "../TimeBasedManager";

describe("TimeBasedManager", () => {
  let manager: TimeBasedManager;
  const createdIds: string[] = [];

  beforeEach(() => {
    manager = new TimeBasedManager();
  });

  afterEach(async () => {
    // Clean up created test bars
    for (const id of createdIds) {
      await db.delete(progressBars).where(eq(progressBars.id, id));
    }
    createdIds.length = 0;
  });

  describe("createTimeBasedBar", () => {
    it("should create a count-up bar with valid dates", async () => {
      const startDate = new Date("2024-01-01");
      const targetDate = new Date("2027-12-31");

      const bar = await manager.createTimeBasedBar({
        title: "Test Count-Up Bar",
        description: "Test description",
        timeBasedType: "count-up",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      expect(bar.title).toBe("Test Count-Up Bar");
      expect(bar.barType).toBe("time-based");
      expect(bar.timeBasedType).toBe("count-up");
      expect(bar.startDate).toEqual(startDate);
      expect(bar.targetDate).toEqual(targetDate);
    });

    it("should create a count-down bar with valid target date", async () => {
      const startDate = new Date();
      const targetDate = new Date("2027-12-31");

      const bar = await manager.createTimeBasedBar({
        title: "Test Count-Down Bar",
        timeBasedType: "count-down",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      expect(bar.title).toBe("Test Count-Down Bar");
      expect(bar.timeBasedType).toBe("count-down");
      expect(bar.targetDate).toEqual(targetDate);
    });

    it("should create an arrival-date bar", async () => {
      const startDate = new Date("2025-01-01");
      const targetDate = new Date("2025-12-31");

      const bar = await manager.createTimeBasedBar({
        title: "Test Arrival Date Bar",
        timeBasedType: "arrival-date",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      expect(bar.title).toBe("Test Arrival Date Bar");
      expect(bar.timeBasedType).toBe("arrival-date");
    });

    it("should throw error when target date is before start date", async () => {
      const startDate = new Date("2025-12-31");
      const targetDate = new Date("2025-01-01");

      await expect(
        manager.createTimeBasedBar({
          title: "Invalid Bar",
          timeBasedType: "count-up",
          startDate,
          targetDate,
        }),
      ).rejects.toThrow("Validation failed");
    });

    it("should throw error for count-up bar with future start date", async () => {
      const startDate = new Date("2030-01-01");
      const targetDate = new Date("2031-01-01");

      await expect(
        manager.createTimeBasedBar({
          title: "Invalid Count-Up",
          timeBasedType: "count-up",
          startDate,
          targetDate,
        }),
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("calculateCurrentProgress", () => {
    it("should calculate progress for a time-based bar", async () => {
      const startDate = new Date("2024-01-01");
      const targetDate = new Date("2027-12-31");

      const bar = await manager.createTimeBasedBar({
        title: "Progress Test Bar",
        timeBasedType: "count-up",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      // Get the bar from database
      const dbBar = await db
        .select()
        .from(progressBars)
        .where(eq(progressBars.id, bar.id))
        .get();

      expect(dbBar).toBeDefined();
      if (!dbBar) return;

      const progress = manager.calculateCurrentProgress(dbBar);

      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeLessThanOrEqual(100);
      expect(progress.elapsedTime).toBeDefined();
      expect(progress.remainingTime).toBeDefined();
    });

    it("should throw error for non-time-based bar", async () => {
      const manualBar = {
        id: "test-id",
        title: "Manual Bar",
        description: null,
        currentValue: 50,
        targetValue: 100,
        unit: null,
        unitPosition: null,
        barType: "manual" as const,
        startDate: null,
        targetDate: null,
        timeBasedType: null,
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(() => manager.calculateCurrentProgress(manualBar)).toThrow(
        "Bar is not a time-based progress bar",
      );
    });
  });

  describe("getAllTimeBasedBars", () => {
    it("should retrieve only time-based bars", async () => {
      // Create a time-based bar
      const bar = await manager.createTimeBasedBar({
        title: "Time-Based Bar",
        timeBasedType: "count-down",
        startDate: new Date(),
        targetDate: new Date("2027-12-31"),
      });

      createdIds.push(bar.id);

      const timeBasedBars = await manager.getAllTimeBasedBars();

      expect(timeBasedBars.length).toBeGreaterThan(0);
      expect(timeBasedBars.every((b) => b.barType === "time-based")).toBe(true);
    });
  });

  describe("updateCompletionStatus", () => {
    it("should update completion status for completed bar", async () => {
      // Create a bar that's already past its target date
      // Use arrival-date type since count-up bars require future target dates
      const startDate = new Date("2020-01-01");
      const targetDate = new Date("2021-01-01");

      const bar = await manager.createTimeBasedBar({
        title: "Completed Bar",
        timeBasedType: "arrival-date",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      // Get the bar from database
      const dbBar = await db
        .select()
        .from(progressBars)
        .where(eq(progressBars.id, bar.id))
        .get();

      expect(dbBar).toBeDefined();
      if (!dbBar) return;

      const updatedBar = await manager.updateCompletionStatus(dbBar);

      expect(updatedBar.isCompleted).toBe(true);
    });
  });

  describe("toTimeBasedProgressBar", () => {
    it("should convert database bar to TimeBasedProgressBar", async () => {
      const startDate = new Date("2024-01-01");
      const targetDate = new Date("2027-12-31");

      const bar = await manager.createTimeBasedBar({
        title: "Conversion Test",
        timeBasedType: "count-up",
        startDate,
        targetDate,
      });

      createdIds.push(bar.id);

      // Get the bar from database
      const dbBar = await db
        .select()
        .from(progressBars)
        .where(eq(progressBars.id, bar.id))
        .get();

      expect(dbBar).toBeDefined();
      if (!dbBar) return;

      const timeBasedBar = manager.toTimeBasedProgressBar(dbBar);

      expect(timeBasedBar).not.toBeNull();
      expect(timeBasedBar?.barType).toBe("time-based");
      expect(timeBasedBar?.startDate).toBeInstanceOf(Date);
      expect(timeBasedBar?.targetDate).toBeInstanceOf(Date);
    });

    it("should return null for manual bar", () => {
      const manualBar = {
        id: "test-id",
        title: "Manual Bar",
        description: null,
        currentValue: 50,
        targetValue: 100,
        unit: null,
        unitPosition: null,
        barType: "manual" as const,
        startDate: null,
        targetDate: null,
        timeBasedType: null,
        isCompleted: false,
        isOverdue: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = manager.toTimeBasedProgressBar(manualBar);
      expect(result).toBeNull();
    });
  });
});
