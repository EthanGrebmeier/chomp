PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list`("id", "date") SELECT "id", "date" FROM `grocery_list`;--> statement-breakpoint
DROP TABLE `grocery_list`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list` RENAME TO `grocery_list`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` integer NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "name", "quantity", "unit") SELECT "id", "groceryListId", "name", "quantity", "unit" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;