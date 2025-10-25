PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text NOT NULL,
	`itemId` text NOT NULL,
	`recipeId` text,
	`isChecked` integer DEFAULT false NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list_item`("id", "groceryListId", "itemId", "recipeId", "isChecked", "createdAt", "updatedAt") SELECT "id", "groceryListId", "itemId", "recipeId", "isChecked", "createdAt", "updatedAt" FROM `grocery_list_item`;--> statement-breakpoint
DROP TABLE `grocery_list_item`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list_item` RENAME TO `grocery_list_item`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`name` text NOT NULL,
	`groupBy` text DEFAULT 'none' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list`("id", "date", "name", "groupBy", "createdAt", "updatedAt") SELECT "id", "date", "name", "groupBy", "createdAt", "updatedAt" FROM `grocery_list`;--> statement-breakpoint
DROP TABLE `grocery_list`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list` RENAME TO `grocery_list`;--> statement-breakpoint
CREATE TABLE `__new_item` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`category` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_item`("id", "name", "quantity", "unit", "notes", "category", "createdAt", "updatedAt") SELECT "id", "name", "quantity", "unit", "notes", "category", "createdAt", "updatedAt" FROM `item`;--> statement-breakpoint
DROP TABLE `item`;--> statement-breakpoint
ALTER TABLE `__new_item` RENAME TO `item`;--> statement-breakpoint
CREATE TABLE `__new_meal_plan_recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`mealPlanId` text NOT NULL,
	`recipeId` text NOT NULL,
	`mealTag` text,
	`date` text NOT NULL,
	`servings` integer DEFAULT 1 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`mealPlanId`) REFERENCES `meal_plan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meal_plan_recipe`("id", "mealPlanId", "recipeId", "mealTag", "date", "servings", "order", "createdAt", "updatedAt") SELECT "id", "mealPlanId", "recipeId", "mealTag", "date", "servings", "order", "createdAt", "updatedAt" FROM `meal_plan_recipe`;--> statement-breakpoint
DROP TABLE `meal_plan_recipe`;--> statement-breakpoint
ALTER TABLE `__new_meal_plan_recipe` RENAME TO `meal_plan_recipe`;--> statement-breakpoint
CREATE TABLE `__new_meal_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text,
	`name` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_meal_plan`("id", "groceryListId", "name", "startDate", "endDate", "createdAt", "updatedAt") SELECT "id", "groceryListId", "name", "startDate", "endDate", "createdAt", "updatedAt" FROM `meal_plan`;--> statement-breakpoint
DROP TABLE `meal_plan`;--> statement-breakpoint
ALTER TABLE `__new_meal_plan` RENAME TO `meal_plan`;--> statement-breakpoint
CREATE TABLE `__new_recipe_ingredient` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeId` text NOT NULL,
	`itemId` text NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_recipe_ingredient`("id", "recipeId", "itemId", "order", "createdAt", "updatedAt") SELECT "id", "recipeId", "itemId", "order", "createdAt", "updatedAt" FROM `recipe_ingredient`;--> statement-breakpoint
DROP TABLE `recipe_ingredient`;--> statement-breakpoint
ALTER TABLE `__new_recipe_ingredient` RENAME TO `recipe_ingredient`;--> statement-breakpoint
CREATE TABLE `__new_recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_recipe`("id", "name", "description", "createdAt", "updatedAt") SELECT "id", "name", "description", "createdAt", "updatedAt" FROM `recipe`;--> statement-breakpoint
DROP TABLE `recipe`;--> statement-breakpoint
ALTER TABLE `__new_recipe` RENAME TO `recipe`;