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
  const targetValue = Number.parseFloat(formData.get("targetValue") as string);
  const description = (formData.get("description") as string) || null;
  const unit = (formData.get("unit") as string) || null;
  const unitPosition = (formData.get("unitPosition") as string) || null;

  const now = new Date();

  await db.insert(progressBars).values({
    id: generateId(),
    title,
    description,
    currentValue: 0,
    targetValue,
    unit,
    unitPosition,
    createdAt: now,
    updatedAt: now,
  });

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
