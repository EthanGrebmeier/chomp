ALTER TABLE `app_settings` ADD `groupBy` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` DROP COLUMN `groupBySteps`;