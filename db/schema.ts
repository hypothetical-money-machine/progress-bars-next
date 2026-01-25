import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const progressBars = sqliteTable(
  "progress_bars",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    currentValue: real("current_value").notNull().default(0),
    targetValue: real("target_value").notNull(),
    unit: text("unit"),
    unitPosition: text("unit_position"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    // Time-based fields
    barType: text("bar_type").notNull().default("manual"),
    startDate: text("start_date"), // ISO 8601 format
    targetDate: text("target_date"), // ISO 8601 format
    timeBasedType: text("time_based_type"), // 'count-up' | 'count-down' | 'arrival-date'
    isCompleted: integer("is_completed", { mode: "boolean" })
      .notNull()
      .default(false),
    isOverdue: integer("is_overdue", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => ({
    typeIdx: index("idx_progress_bars_type").on(table.barType),
    datesIdx: index("idx_progress_bars_dates").on(
      table.startDate,
      table.targetDate,
    ),
  }),
);

export type ProgressBar = typeof progressBars.$inferSelect;
export type NewProgressBar = typeof progressBars.$inferInsert;
