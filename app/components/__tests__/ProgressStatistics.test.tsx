import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProgressCalculation } from "@/lib/types";
import { ProgressStatistics } from "../ProgressStatistics";

const mockProgress: ProgressCalculation = {
  currentValue: 50,
  targetValue: 100,
  percentage: 50,
  elapsedTime: {
    years: 0,
    months: 6,
    days: 15,
    hours: 12,
    minutes: 30,
    totalDays: 195,
    totalHours: 4692,
    totalMinutes: 281550,
  },
  remainingTime: {
    years: 0,
    months: 6,
    days: 15,
    hours: 12,
    minutes: 30,
    totalDays: 195,
    totalHours: 4692,
    totalMinutes: 281550,
  },
  dailyProgressRate: 0.51,
  isCompleted: false,
  isOverdue: false,
};

describe("ProgressStatistics", () => {
  it("renders progress statistics correctly", () => {
    const targetDate = new Date("2024-12-31");

    render(
      <ProgressStatistics
        progress={mockProgress}
        targetDate={targetDate}
        timeBasedType="count-up"
      />,
    );

    expect(screen.getByText("Progress Statistics")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("0.51% per day")).toBeInTheDocument();
  });

  it("shows completion status for completed progress", () => {
    const completedProgress = {
      ...mockProgress,
      percentage: 100,
      isCompleted: true,
    };

    render(
      <ProgressStatistics
        progress={completedProgress}
        targetDate={new Date("2024-12-31")}
        timeBasedType="count-up"
      />,
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows overdue status for overdue progress", () => {
    const overdueProgress = {
      ...mockProgress,
      isOverdue: true,
    };

    render(
      <ProgressStatistics
        progress={overdueProgress}
        targetDate={new Date("2024-12-31")}
        timeBasedType="arrival-date"
      />,
    );

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows arrival date label for arrival-date type", () => {
    render(
      <ProgressStatistics
        progress={mockProgress}
        targetDate={new Date("2024-12-31")}
        timeBasedType="arrival-date"
      />,
    );

    expect(screen.getByText("Arrival Date")).toBeInTheDocument();
  });
});
