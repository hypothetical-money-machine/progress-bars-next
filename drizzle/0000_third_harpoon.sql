CREATE TABLE `progress_bars` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`current_value` integer DEFAULT 0 NOT NULL,
	`target_value` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
