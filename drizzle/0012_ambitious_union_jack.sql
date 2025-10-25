PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`category` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
INSERT INTO `__new_item`("id", "name", "quantity", "unit", "notes", "category", "createdAt", "updatedAt") SELECT "id", "name", "quantity", "unit", "notes", "category", "createdAt", "updatedAt" FROM `item`;--> statement-breakpoint
DROP TABLE `item`;--> statement-breakpoint
ALTER TABLE `__new_item` RENAME TO `item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_meal_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text,
	`name` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`createdAt` text,
	`updatedAt` text,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_meal_plan`("id", "groceryListId", "name", "startDate", "endDate", "createdAt", "updatedAt") SELECT "id", "groceryListId", "name", "startDate", "endDate", "createdAt", "updatedAt" FROM `meal_plan`;--> statement-breakpoint
DROP TABLE `meal_plan`;--> statement-breakpoint
ALTER TABLE `__new_meal_plan` RENAME TO `meal_plan`;--> statement-breakpoint
CREATE TABLE `__new_recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` text,
	`updatedAt` text
);
--> statement-breakpoint
INSERT INTO `__new_recipe`("id", "name", "description", "createdAt", "updatedAt") SELECT "id", "name", "description", "createdAt", "updatedAt" FROM `recipe`;--> statement-breakpoint
DROP TABLE `recipe`;--> statement-breakpoint
ALTER TABLE `__new_recipe` RENAME TO `recipe`;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `createdAt` text;--> statement-breakpoint
ALTER TABLE `grocery_list_item` ADD `updatedAt` text;--> statement-breakpoint
ALTER TABLE `grocery_list` ADD `createdAt` text;--> statement-breakpoint
ALTER TABLE `grocery_list` ADD `updatedAt` text;--> statement-breakpoint
ALTER TABLE `meal_plan_recipe` ADD `createdAt` text;--> statement-breakpoint
ALTER TABLE `meal_plan_recipe` ADD `updatedAt` text;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` ADD `createdAt` text;--> statement-breakpoint
ALTER TABLE `recipe_ingredient` ADD `updatedAt` text;