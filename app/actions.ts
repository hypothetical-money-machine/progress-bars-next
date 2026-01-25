"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { progressBars } from "@/db/schema";

function generateId() {
  return crypto.randomUUID();
}

export async function getProgressBars() {
  return db.select().from(progressBars).all();
}

export async function createProgressBar(formData: FormData) {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const barType = (formData.get("barType") as string) || "manual";

  const now = new Date();

  if (barType === "manual") {
    // Handle manual progress bar
    const targetValue = Number.parseFloat(
      formData.get("targetValue") as string,
    );
    const unit = (formData.get("unit") as string) || null;
    const unitPosition = (formData.get("unitPosition") as string) || null;

    await db.insert(progressBars).values({
      id: generateId(),
      title,
      description,
      currentValue: 0,
      targetValue,
      unit,
      unitPosition,
      barType: "manual",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    // Handle time-based progress bar
    const timeBasedType = formData.get("timeBasedType") as string;
    let startDate: string;
    const targetDate = formData.get("targetDate") as string;

    // For count-down bars, use current date as start date
    if (timeBasedType === "count-down") {
      startDate = now.toISOString();
    } else {
      startDate = new Date(
        `${formData.get("startDate") as string}T00:00:00`,
      ).toISOString();
    }

    await db.insert(progressBars).values({
      id: generateId(),
      title,
      description,
      currentValue: 0, // Will be calculated dynamically for time-based bars
      targetValue: 100, // Percentage-based for time-based bars
      barType: "time-based",
      startDate,
      targetDate: new Date(`${targetDate}T00:00:00`).toISOString(),
      timeBasedType: timeBasedType as
        | "count-up"
        | "count-down"
        | "arrival-date",
      isCompleted: false,
      isOverdue: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/");
}

export async function updateProgress(id: string, newValue: number) {
  await db
    .update(progressBars)
    .set({
      currentValue: newValue,
      updatedAt: new Date(),
    })
    .where(eq(progressBars.id, id));

  revalidatePath("/");
}

export async function deleteProgressBar(id: string) {
  await db.delete(progressBars).where(eq(progressBars.id, id));
  revalidatePath("/");
}
