PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`isChecked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "name", "quantity", "unit", "isChecked") SELECT "id", "groceryListId", "name", "quantity", "unit", "isChecked" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;