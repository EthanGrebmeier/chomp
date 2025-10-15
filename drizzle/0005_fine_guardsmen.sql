CREATE TABLE `meal_plan_recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`mealPlanId` text NOT NULL,
	`recipeId` text NOT NULL,
	`mealTag` text,
	`date` text NOT NULL,
	`servings` integer DEFAULT 1 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`mealPlanId`) REFERENCES `meal_plan`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meal_plan` (
	`id` text PRIMARY KEY NOT NULL,
	`groceryListId` text NOT NULL,
	`name` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
