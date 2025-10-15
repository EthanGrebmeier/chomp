PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meal_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text,
	`name` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_meal_plan`("id", "groceryListId", "name", "startDate", "endDate", "createdAt") SELECT "id", "groceryListId", "name", "startDate", "endDate", "createdAt" FROM `meal_plan`;--> statement-breakpoint
DROP TABLE `meal_plan`;--> statement-breakpoint
ALTER TABLE `__new_meal_plan` RENAME TO `meal_plan`;--> statement-breakpoint
PRAGMA foreign_keys=ON;