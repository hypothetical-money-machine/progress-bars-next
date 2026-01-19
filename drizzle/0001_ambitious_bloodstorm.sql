PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_progress_bars` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`current_value` real DEFAULT 0 NOT NULL,
	`target_value` real NOT NULL,
	`unit` text,
	`unit_position` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_progress_bars`("id", "title", "description", "current_value", "target_value", "unit", "unit_position", "created_at", "updated_at") SELECT "id", "title", "description", "current_value", "target_value", NULL, NULL, "created_at", "updated_at" FROM `progress_bars`;--> statement-breakpoint
DROP TABLE `progress_bars`;--> statement-breakpoint
ALTER TABLE `__new_progress_bars` RENAME TO `progress_bars`;--> statement-breakpoint
PRAGMA foreign_keys=ON;