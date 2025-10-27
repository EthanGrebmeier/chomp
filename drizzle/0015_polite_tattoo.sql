PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`category` text,
	`recipeId` text,
	`isChecked` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "name", "quantity", "unit", "notes", "category", "recipeId", "isChecked", "createdAt", "updatedAt") SELECT "id", "groceryListId", "name", "quantity", "unit", "notes", "category", "recipeId", "isChecked", "createdAt", "updatedAt" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;