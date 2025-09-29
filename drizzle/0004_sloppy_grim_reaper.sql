CREATE TABLE `recipe_ingredient` (
	`id` text PRIMARY KEY NOT NULL,
	`recipeId` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`recipeId`) REFERENCES `recipe`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recipe` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`servings` integer,
	`createdAt` text NOT NULL
);
