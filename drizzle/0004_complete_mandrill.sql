ALTER TABLE `app_settings` ADD `savedItemsSortBy` text DEFAULT 'name' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `savedItemsFilterCategory` text;