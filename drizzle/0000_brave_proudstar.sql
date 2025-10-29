CREATE TABLE `grocery_list_item` (
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
CREATE TABLE `grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`name` text NOT NULL,
	`groupBy` text DEFAULT 'none' NOT NULL,
	`sortBy` text DEFAULT 'recent' NOT NULL,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meal_plan_recipe` (
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
CREATE TABLE `meal_plan` (
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
CREATE TABLE `recipe_ingredient` (
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
CREATE TABLE `recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
