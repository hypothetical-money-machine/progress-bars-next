"use client";

import { useRef, useState } from "react";
import { createProgressBar } from "@/app/actions";

const CURRENCY_SYMBOLS = /^[$€£¥₹]/;

type BarType = "manual" | "time-based";
type TimeBasedType = "count-up" | "count-down" | "arrival-date";

interface ValidationErrors {
  dateRange?: string;
  startDate?: string;
  targetDate?: string;
}

export function CreateBarForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [unitPosition, setUnitPosition] = useState<"prefix" | "suffix">(
    "suffix",
  );
  const [barType, setBarType] = useState<BarType>("manual");
  const [timeBasedType, setTimeBasedType] = useState<TimeBasedType>("count-up");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const validateDates = (
    startDate: string,
    targetDate: string,
    timeBasedType: TimeBasedType,
  ): ValidationErrors => {
    const errors: ValidationErrors = {};
    const now = new Date();
    const start = new Date(`${startDate}T00:00:00`);
    const target = new Date(`${targetDate}T00:00:00`);

    // Validate date range
    if (start >= target) {
      errors.dateRange = "Target date must be after start date";
    }

    // Validate historical start date (up to 10 years in past)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    if (timeBasedType === "count-up" && start < tenYearsAgo) {
      errors.startDate = "Start date cannot be more than 10 years in the past";
    }

    // Validate future dates
    if (timeBasedType === "count-up" && start > now) {
      errors.startDate = "Start date must be in the past for count-up bars";
    }

    if (
      target <= now &&
      (timeBasedType === "count-down" || timeBasedType === "arrival-date")
    ) {
      errors.targetDate = "Target date must be in the future";
    }

    return errors;
  };

  const handleSubmit = async (formData: FormData) => {
    if (barType === "time-based") {
      const startDate = formData.get("startDate") as string;
      const targetDate = formData.get("targetDate") as string;

      const errors = validateDates(startDate, targetDate, timeBasedType);
      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        return;
      }
    }

    await createProgressBar(formData);
    formRef.current?.reset();
    setUnitPosition("suffix");
    setBarType("manual");
    setTimeBasedType("count-up");
    setValidationErrors({});
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (CURRENCY_SYMBOLS.test(value)) {
      setUnitPosition("prefix");
    }
  };

  const handleDateChange = () => {
    // Clear validation errors when dates change
    setValidationErrors({});
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
        New Progress Bar
      </h3>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          name="title"
          placeholder="What are you tracking?"
          required
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
        />

        {/* Bar Type Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Progress Type:
          </span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="barType"
                value="manual"
                checked={barType === "manual"}
                onChange={() => setBarType("manual")}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Manual Progress
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="barType"
                value="time-based"
                checked={barType === "time-based"}
                onChange={() => setBarType("time-based")}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Time-Based Progress
              </span>
            </label>
          </div>
        </div>

        {/* Time-Based Type Selection */}
        {barType === "time-based" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Time-Based Type:
            </span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeBasedType"
                  value="count-up"
                  checked={timeBasedType === "count-up"}
                  onChange={() => setTimeBasedType("count-up")}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Count-Up
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    Track progress from past date to future target
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeBasedType"
                  value="count-down"
                  checked={timeBasedType === "count-down"}
                  onChange={() => setTimeBasedType("count-down")}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Count-Down
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    Track remaining time until future deadline
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeBasedType"
                  value="arrival-date"
                  checked={timeBasedType === "arrival-date"}
                  onChange={() => setTimeBasedType("arrival-date")}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Arrival Date
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                    Track progress toward specific arrival date
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Manual Progress Fields */}
        {barType === "manual" && (
          <div className="flex gap-2">
            <input
              type="number"
              name="targetValue"
              placeholder="Target"
              required
              min="0.01"
              step="any"
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
            <input
              type="text"
              name="unit"
              placeholder="Unit"
              onChange={handleUnitChange}
              className="w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
          </div>
        )}

        {/* Unit Position for Manual Progress */}
        {barType === "manual" && (
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Position:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="unitPosition"
                value="prefix"
                checked={unitPosition === "prefix"}
                onChange={() => setUnitPosition("prefix")}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              Before ($10)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="unitPosition"
                value="suffix"
                checked={unitPosition === "suffix"}
                onChange={() => setUnitPosition("suffix")}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              After (10 books)
            </label>
          </div>
        )}

        {/* Date Fields for Time-Based Progress */}
        {barType === "time-based" && (
          <div className="flex flex-col gap-3">
            {/* Start Date - only show for count-up and arrival-date */}
            {(timeBasedType === "count-up" ||
              timeBasedType === "arrival-date") && (
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="startDate"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Start Date:
                </label>
                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  required
                  onChange={handleDateChange}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
                />
                {validationErrors.startDate && (
                  <span className="text-xs text-red-500">
                    {validationErrors.startDate}
                  </span>
                )}
              </div>
            )}

            {/* Target/Arrival Date */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="targetDate"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {timeBasedType === "arrival-date"
                  ? "Arrival Date:"
                  : "Target Date:"}
              </label>
              <input
                id="targetDate"
                type="date"
                name="targetDate"
                required
                onChange={handleDateChange}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              />
              {validationErrors.targetDate && (
                <span className="text-xs text-red-500">
                  {validationErrors.targetDate}
                </span>
              )}
            </div>

            {/* Date Range Error */}
            {validationErrors.dateRange && (
              <span className="text-xs text-red-500">
                {validationErrors.dateRange}
              </span>
            )}
          </div>
        )}

        <input
          type="text"
          name="description"
          placeholder="Description (optional)"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add Progress Bar
        </button>
      </div>
    </form>
  );
}
