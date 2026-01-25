ALTER TABLE `progress_bars` ADD `bar_type` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `progress_bars` ADD `start_date` text;--> statement-breakpoint
ALTER TABLE `progress_bars` ADD `target_date` text;--> statement-breakpoint
ALTER TABLE `progress_bars` ADD `time_based_type` text;--> statement-breakpoint
ALTER TABLE `progress_bars` ADD `is_completed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `progress_bars` ADD `is_overdue` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_progress_bars_type` ON `progress_bars` (`bar_type`);--> statement-breakpoint
CREATE INDEX `idx_progress_bars_dates` ON `progress_bars` (`start_date`,`target_date`);