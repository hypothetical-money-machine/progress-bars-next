"use client";

import { useRef } from "react";
import { createProgressBar } from "@/app/actions";

export function CreateBarForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await createProgressBar(formData);
    formRef.current?.reset();
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
        <input
          type="number"
          name="targetValue"
          placeholder="Target (e.g. 100)"
          required
          min="1"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
        />
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
