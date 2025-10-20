CREATE TABLE `item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`createdAt` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `itemId` text NOT NULL REFERENCES item(id);--> statement-breakpoint
ALTER TABLE `grocery_list_item` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `grocery_list_item` DROP COLUMN `quantity`;--> statement-breakpoint
ALTER TABLE `grocery_list_item` DROP COLUMN `unit`;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` ADD `itemId` text NOT NULL REFERENCES item(id);--> statement-breakpoint
ALTER TABLE `recipe_ingredient` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` DROP COLUMN `quantity`;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` DROP COLUMN `unit`;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` DROP COLUMN `notes`;