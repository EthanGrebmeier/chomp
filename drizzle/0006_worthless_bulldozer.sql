ALTER TABLE `app_settings` ADD `groupBySteps` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` DROP COLUMN `groupBy`;