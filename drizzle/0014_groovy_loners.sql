DROP TABLE `item`;--> statement-breakpoint
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
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "name", "quantity", "unit", "notes", "category", "recipeId", "isChecked", "createdAt", "updatedAt") SELECT "id", "groceryListId", "name", "quantity", "unit", "notes", "category", "recipeId", "isChecked", "createdAt", "updatedAt" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_recipe_ingredient` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeId` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`category` text,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_recipe_ingredient`("id", "recipeId", "name", "quantity", "unit", "notes", "category", "order", "createdAt", "updatedAt") SELECT "id", "recipeId", "name", "quantity", "unit", "notes", "category", "order", "createdAt", "updatedAt" FROM `recipe_ingredient`;--> statement-breakpoint
DROP TABLE `recipe_ingredient`;--> statement-breakpoint
ALTER TABLE `__new_recipe_ingredient` RENAME TO `recipe_ingredient`;