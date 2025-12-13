import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const progressBars = sqliteTable("progress_bars", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  currentValue: real("current_value").notNull().default(0),
  targetValue: real("target_value").notNull(),
  unit: text("unit"),
  unitPosition: text("unit_position"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type ProgressBar = typeof progressBars.$inferSelect;
export type NewProgressBar = typeof progressBars.$inferInsert;
