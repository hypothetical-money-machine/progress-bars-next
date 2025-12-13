"use client";

import { useRef, useState } from "react";
import { createProgressBar } from "@/app/actions";

const CURRENCY_SYMBOLS = /^[$€£¥₹]/;

export function CreateBarForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [unitPosition, setUnitPosition] = useState<"prefix" | "suffix">(
    "suffix",
  );

  const handleSubmit = async (formData: FormData) => {
    await createProgressBar(formData);
    formRef.current?.reset();
    setUnitPosition("suffix");
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (CURRENCY_SYMBOLS.test(value)) {
      setUnitPosition("prefix");
    }
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
