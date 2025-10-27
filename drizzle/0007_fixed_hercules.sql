PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`createdAt` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
-- Populate item table from existing grocery_list_item data
INSERT INTO `item`("id", "name", "quantity", "unit", "createdAt")
SELECT 
	"id" || '_item', 
	"name", 
	"quantity", 
	"unit", 
	datetime('now')
FROM `grocery_list_item`
GROUP BY "name", "quantity", "unit";
--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text NOT NULL,
	`itemId` text NOT NULL,
	`isChecked` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "itemId", "isChecked")
SELECT 
	gli."id",
	gli."groceryListId",
	i."id" as "itemId",
	gli."isChecked"
FROM `grocery_list_item` gli
JOIN `item` i ON i."name" = gli."name" AND i."quantity" = gli."quantity" AND i."unit" = gli."unit"
WHERE i."id" = gli."id" || '_item';
--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
-- Populate item table from existing recipe_ingredient data
INSERT INTO `item`("id", "name", "quantity", "unit", "notes", "createdAt")
SELECT 
	"id" || '_item', 
	"name", 
	"quantity", 
	"unit", 
	"notes",
	datetime('now')
FROM `recipe_ingredient`
GROUP BY "name", "quantity", "unit", "notes";
--> statement-breakpoint
CREATE TABLE `__new_recipe_ingredient` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeId` text NOT NULL,
	`itemId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recipe_ingredient`("id", "recipeId", "itemId", "order")
SELECT 
	ri."id",
	ri."recipeId",
	i."id" as "itemId",
	ri."order"
FROM `recipe_ingredient` ri
JOIN `item` i ON i."name" = ri."name" AND i."quantity" = ri."quantity" AND i."unit" = ri."unit"
WHERE i."id" = ri."id" || '_item';
--> statement-breakpoint
DROP TABLE `recipe_ingredient`;--> statement-breakpoint
ALTER TABLE `__new_recipe_ingredient` RENAME TO `recipe_ingredient`;--> statement-breakpoint
PRAGMA foreign_keys=ON;